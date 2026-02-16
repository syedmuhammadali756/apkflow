const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const File = require('../models/File');
const User = require('../models/User');
const { downloadFromR2 } = require('../utils/r2Storage');
const { downloadFromLocal } = require('../utils/localStorage');
const { getSupabasePublicUrl } = require('../utils/supabaseStorage');

// Determine storage type
const STORAGE_TYPE = process.env.SUPABASE_URL ? 'supabase' : (process.env.R2_ACCESS_KEY_ID ? 'r2' : 'local');
const downloadFile = STORAGE_TYPE === 'supabase' ? null : (STORAGE_TYPE === 'r2' ? downloadFromR2 : downloadFromLocal);
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

        // ========== DOMAIN LOCK: Serve verification page ==========
        if (file.allowedDomain && file.allowedDomain.trim() !== '') {
            const allowedDomain = file.allowedDomain.trim().toLowerCase()
                .replace(/^https?:\/\//, '').replace(/\/.*$/, '');

            // Generate signed token (valid 120 seconds)
            const expiry = Date.now() + 120000;
            const sig = generateSignature(fileId, expiry);
            const baseUrl = getBaseUrl(req);

            return res.send(`<!DOCTYPE html>
<html><head><title>Download Verification</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0f0f1a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .box{background:#1a1a2e;border:1px solid #2d2d44;border-radius:16px;padding:40px;text-align:center;max-width:420px;width:90%}
  h2{margin:0 0 8px;font-size:20px}
  p{color:#94a3b8;font-size:14px;margin:8px 0}
  .spinner{width:40px;height:40px;border:3px solid #2d2d44;border-top-color:#7c3aed;border-radius:50%;animation:spin 1s linear infinite;margin:20px auto}
  @keyframes spin{to{transform:rotate(360deg)}}
  .error{color:#f87171;background:rgba(239,68,68,.1);padding:12px 16px;border-radius:8px;font-size:14px;display:none}
  .success{color:#34d399;font-size:14px}
</style></head><body>
<div class="box">
  <h2>🔒 Verifying Access</h2>
  <p>Checking if you're accessing from an authorized website...</p>
  <div class="spinner" id="spinner"></div>
  <div class="error" id="error"></div>
  <p class="success" id="success" style="display:none">✓ Verified! Download starting...</p>
</div>
<script>
(function(){
  var allowed = "${allowedDomain}";
  var ref = document.referrer || "";
  var refHost = "";
  try { refHost = new URL(ref).hostname.toLowerCase(); } catch(e) {}
  
  var ok = refHost === allowed || 
           refHost === "www." + allowed || 
           refHost.endsWith("." + allowed);
  
  setTimeout(function(){
    document.getElementById("spinner").style.display = "none";
    if (ok) {
      document.getElementById("success").style.display = "block";
      window.location.href = "${baseUrl}/d/${fileId}/download?t=${expiry}&sig=${sig}";
    } else {
      var el = document.getElementById("error");
      el.style.display = "block";
      el.textContent = "⛔ Access Denied — This download is restricted to " + allowed + " only.";
      if (ref) el.textContent += " (Your source: " + refHost + ")";
      else el.textContent += " (No referring website detected. Please visit the download page from the authorized website.)";
    }
  }, 1200);
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

    // Supabase: Redirect with ?download=filename
    if (file.storageType === 'supabase' || STORAGE_TYPE === 'supabase') {
        const publicUrl = getSupabasePublicUrl(file.storageKey);
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
