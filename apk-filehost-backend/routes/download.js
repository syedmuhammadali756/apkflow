const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const File = require('../models/File');
const User = require('../models/User');
const { downloadFromR2 } = require('../utils/r2Storage');
const { downloadFromLocal } = require('../utils/localStorage');
const { getTebiPublicUrl } = require('../utils/tebiStorage');

// Determine storage type
const STORAGE_TYPE = process.env.TEBI_ACCESS_KEY ? 'tebi' : (process.env.R2_ACCESS_KEY_ID ? 'r2' : 'local');
const downloadFile = STORAGE_TYPE === 'tebi' ? null : (STORAGE_TYPE === 'r2' ? downloadFromR2 : downloadFromLocal);
const SECRET = process.env.JWT_SECRET || 'apkflow-download-secret';

// Helper: Get base URL (handles Vercel proxy correctly)
function getBaseUrl(req) {
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  return `${proto}://${req.get('host')}`;
}

// Helper: Generate HMAC signature (stateless - no memory needed)
function generateSignature(fileId, expiry) {
  return crypto.createHmac('sha256', SECRET)
    .update(`${fileId}:${expiry}`)
    .digest('hex')
    .substring(0, 32);
}

// Helper: Verify HMAC signature
function verifySignature(fileId, expiry, sig) {
  if (!sig || !expiry) return false;
  if (parseInt(expiry) < Date.now()) return false; // Expired
  const expected = generateSignature(fileId, expiry);
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

// @route   GET /d/:fileId
// @desc    Download file (public) - serves verification page for domain-locked files
// @access  Public
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findOne({ fileId, isActive: true });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Check if file owner is suspended
    const owner = await User.findById(file.userId);
    if (owner && owner.isSuspended) {
      return res.status(403).json({ success: false, message: 'This file is no longer available.' });
    }

    // ========== DOMAIN LOCK: Serve verification page ==========
    if (file.allowedDomain && file.allowedDomain.trim() !== '') {
      const allowedDomain = file.allowedDomain.trim().toLowerCase()
        .replace(/^https?:\/\//, '').replace(/\/.*$/, '');

      // Generate signed token (valid 120 seconds)
      const expiry = Date.now() + 120000;
      const sig = generateSignature(fileId, expiry);
      const baseUrl = getBaseUrl(req);

      // Get brand name and file info for display
      const brandName = file.brandName ? file.brandName.trim() : '';
      const fileName = file.customName ? file.customName.trim() : file.originalName;

      return res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${brandName ? brandName + ' — ' : ''}Secure Download</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#0a0a14;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;overflow:hidden}

/* Animated background */
.bg-glow{position:fixed;width:400px;height:400px;border-radius:50%;filter:blur(120px);opacity:.15;animation:float 8s ease-in-out infinite}
.bg-glow.purple{background:#7c3aed;top:-100px;left:-100px;animation-delay:0s}
.bg-glow.cyan{background:#06b6d4;bottom:-100px;right:-100px;animation-delay:4s}
@keyframes float{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,30px)}}

.card{background:rgba(20,20,35,.85);backdrop-filter:blur(20px);border:1px solid rgba(124,58,237,.15);border-radius:24px;padding:48px 40px;text-align:center;max-width:460px;width:92%;position:relative;overflow:hidden;animation:cardIn .6s ease-out}
@keyframes cardIn{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}

/* Shimmer bar */
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#7c3aed,#06b6d4,transparent);animation:shimmer 2s ease-in-out infinite}
@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}

/* Brand */
.brand{font-size:13px;font-weight:600;color:#a78bfa;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:24px;display:flex;align-items:center;justify-content:center;gap:6px}
.brand-dot{width:6px;height:6px;background:#7c3aed;border-radius:50%;animation:pulse 1.5s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}

/* Shield animation */
.shield-wrap{position:relative;width:72px;height:72px;margin:0 auto 24px}
.shield-icon{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2;color:#a78bfa}
.shield-ring{position:absolute;inset:0;border:2px solid rgba(124,58,237,.3);border-radius:50%;animation:ring-pulse 2s ease-in-out infinite}
.shield-ring:nth-child(2){inset:-8px;animation-delay:.5s;border-color:rgba(6,182,212,.2)}
.shield-ring:nth-child(3){inset:-16px;animation-delay:1s;border-color:rgba(124,58,237,.1)}
@keyframes ring-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.05);opacity:.5}}

h2{font-size:22px;font-weight:700;margin-bottom:8px;background:linear-gradient(135deg,#e2e8f0,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.subtitle{color:#64748b;font-size:14px;margin-bottom:28px;line-height:1.5}

/* Progress dots */
.dots{display:flex;justify-content:center;gap:8px;margin:24px 0}
.dot{width:10px;height:10px;background:rgba(124,58,237,.3);border-radius:50%;animation:dot-bounce 1.4s ease-in-out infinite}
.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}.dot:nth-child(4){animation-delay:.6s}
@keyframes dot-bounce{0%,80%,100%{background:rgba(124,58,237,.3);transform:scale(1)}40%{background:#7c3aed;transform:scale(1.3)}}

/* File info */
.file-info{background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.1);border-radius:12px;padding:12px 16px;margin-bottom:24px;display:flex;align-items:center;gap:12px}
.file-icon{width:40px;height:40px;background:linear-gradient(135deg,#7c3aed,#06b6d4);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
.file-name{text-align:left;font-size:13px;font-weight:600;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.file-label{font-size:11px;color:#64748b;margin-top:2px}

/* States */
.state{display:none;animation:fadeIn .5s ease-out}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

.success-box{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:14px;padding:24px}
.success-icon{margin-bottom:12px;color:#34d399}
.success-icon svg{animation:checkPop .5s ease-out}
@keyframes checkPop{from{transform:scale(0)}60%{transform:scale(1.2)}to{transform:scale(1)}}
.success-text{color:#34d399;font-size:18px;font-weight:700}
.success-sub{color:#94a3b8;font-size:13px;margin-top:8px;line-height:1.5}
.enjoy-text{display:block;margin-top:4px;color:#a78bfa;font-size:12px;font-weight:500}

.error-box{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:14px;padding:24px}
.error-icon{margin-bottom:12px;color:#f87171}
.error-title{color:#fca5a5;font-size:16px;font-weight:600;margin-bottom:8px}
.error-text{color:#94a3b8;font-size:13px;line-height:1.7}
.error-link{display:inline-block;margin-top:14px;padding:10px 22px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600;transition:all .2s}
.error-link:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(124,58,237,.3)}
.error-tips{margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.06);text-align:left}
.error-tips li{color:#64748b;font-size:12px;margin:6px 0;line-height:1.5;list-style:none}
.error-tips li::before{content:'→ ';color:#7c3aed}
</style></head><body>

<div class="bg-glow purple"></div>
<div class="bg-glow cyan"></div>

<div class="card">
  ${brandName ? '<div class="brand"><span class="brand-dot"></span> ' + brandName + '</div>' : ''}
  
  <!-- Verifying State -->
  <div id="verifying">
    <div class="shield-wrap">
      <div class="shield-ring"></div>
      <div class="shield-ring"></div>
      <div class="shield-ring"></div>
      <span class="shield-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
    </div>
    <h2>Verifying Access</h2>
    <p class="subtitle">Checking security credentials...</p>
    
    <div class="file-info">
      <div class="file-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
      <div>
        <div class="file-name">${fileName}</div>
        <div class="file-label">Secure Download</div>
      </div>
    </div>
    
    <div class="dots">
      <div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div>
    </div>
  </div>

  <!-- Success State -->
  <div class="state" id="success">
    <div class="success-box">
      <div class="success-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
      <div class="success-text">Downloaded Successfully!</div>
      <div class="success-sub">Your file is ready.<span class="enjoy-text">Enjoy your download!</span></div>
    </div>
  </div>

  <!-- Error State -->
  <div class="state" id="error">
    <div class="error-box">
      <div class="error-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
      <div class="error-title">Protected Download</div>
      <div class="error-text">This file is exclusively available through our official website. Direct links and third-party access are not supported for security reasons.</div>
      <a href="https://${allowedDomain}" class="error-link">Visit ${allowedDomain} →</a>
      <ul class="error-tips">
        <li>Go to <strong>${allowedDomain}</strong> and download from there</li>
        <li>Direct or copied URLs won't work for your protection</li>
        <li>This ensures you always get the authentic, safe file</li>
      </ul>
    </div>
  </div>
</div>

<script>
(function(){
  var allowed = "${allowedDomain}";
  var ref = document.referrer || "";
  var refHost = "";
  try { refHost = new URL(ref).hostname.toLowerCase(); } catch(e) {}
  var ok = refHost === allowed || refHost === "www." + allowed || refHost.endsWith("." + allowed);
  
  setTimeout(function(){
    document.getElementById("verifying").style.display = "none";
    if (ok) {
      var s = document.getElementById("success");
      s.style.display = "block";
      setTimeout(function(){
        window.location.href = "${baseUrl}/d/${fileId}/download?t=${expiry}&sig=${sig}";
      }, 800);
    } else {
      document.getElementById("error").style.display = "block";
    }
  }, 1800);
})();
</script></body></html>`);
    }

    // ========== NO DOMAIN LOCK: Direct download ==========
    return await serveFile(req, res, file);

  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error downloading file' });
    }
  }
});

// @route   GET /d/:fileId/download
// @desc    Actual file download (after domain verification)
// @access  Public (requires valid signature for domain-locked files)
router.get('/:fileId/download', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { t, sig } = req.query;

    const file = await File.findOne({ fileId, isActive: true });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Verify signature for domain-locked files
    if (file.allowedDomain && file.allowedDomain.trim() !== '') {
      if (!verifySignature(fileId, t, sig)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: signature expired or invalid. Please go back to the website and click the download link again.'
        });
      }
    }

    return await serveFile(req, res, file);

  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error downloading file' });
    }
  }
});

// ========== Helper: Serve the actual file ==========
async function serveFile(req, res, file) {
  // Build custom download filename
  let downloadName = file.originalName;

  if (file.customName && file.customName.trim()) {
    let name = file.customName.trim();
    if (!name.toLowerCase().endsWith('.apk')) name += '.apk';
    if (file.brandName && file.brandName.trim()) {
      const brand = file.brandName.trim().replace(/[^a-zA-Z0-9_\-. ]/g, '');
      downloadName = `${brand}_${name}`;
    } else {
      downloadName = name;
    }
  } else if (file.brandName && file.brandName.trim()) {
    const brand = file.brandName.trim().replace(/[^a-zA-Z0-9_\-. ]/g, '');
    downloadName = `${brand}_${file.originalName}`;
  }

  // Increment download count
  file.incrementDownload().catch(err => console.error('Download count error:', err));

  // Tebi/Supabase: Redirect to public URL with download param
  if (file.storageType === 'tebi' || STORAGE_TYPE === 'tebi') {
    const publicUrl = getTebiPublicUrl(file.storageKey);
    if (publicUrl) {
      const separator = publicUrl.includes('?') ? '&' : '?';
      const downloadUrl = `${publicUrl}${separator}download=${encodeURIComponent(downloadName)}`;
      return res.redirect(downloadUrl);
    }
  }

  // Local/R2 storage
  const { stream, contentType, contentLength } = await downloadFile(file.storageKey);
  res.setHeader('Content-Type', contentType || file.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
  res.setHeader('Content-Length', contentLength || file.fileSize);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  stream.pipe(res);
}

// @route   GET /d/:fileId/info
// @desc    Get file info without downloading
// @access  Public
router.get('/:fileId/info', async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({ fileId, isActive: true })
      .select('fileId originalName fileSize downloadCount uploadedAt');

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.json({
      success: true,
      file: {
        fileId: file.fileId,
        originalName: file.originalName,
        fileSize: file.fileSize,
        downloadCount: file.downloadCount,
        uploadedAt: file.uploadedAt
      }
    });
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching file info' });
  }
});

module.exports = router;
