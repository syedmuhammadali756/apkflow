const express = require('express');
const router = express.Router();
const File = require('../models/File');
const User = require('../models/User');
const { downloadFromR2 } = require('../utils/r2Storage');
const { downloadFromLocal } = require('../utils/localStorage');
const { getSupabasePublicUrl } = require('../utils/supabaseStorage');

// Determine storage type
const STORAGE_TYPE = process.env.SUPABASE_URL ? 'supabase' : (process.env.R2_ACCESS_KEY_ID ? 'r2' : 'local');

const downloadFile = STORAGE_TYPE === 'supabase' ? null : (STORAGE_TYPE === 'r2' ? downloadFromR2 : downloadFromLocal);

// @route   GET /d/:fileId
// @desc    Download file (public endpoint) with domain lock + custom filename
// @access  Public
router.get('/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;

        // Find file by ID
        const file = await File.findOne({ fileId, isActive: true });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // ========== DOMAIN LOCK SECURITY ==========
        if (file.allowedDomain && file.allowedDomain.trim() !== '') {
            const referer = req.get('Referer') || req.get('Origin') || '';
            const allowedDomain = file.allowedDomain.trim().toLowerCase()
                .replace(/^https?:\/\//, '') // Remove protocol
                .replace(/\/.*$/, '');        // Remove path

            let requestDomain = '';
            try {
                if (referer) {
                    const url = new URL(referer);
                    requestDomain = url.hostname.toLowerCase();
                }
            } catch (e) {
                requestDomain = '';
            }

            // Check if the request is coming from the allowed domain
            const isAllowed = requestDomain === allowedDomain ||
                requestDomain === `www.${allowedDomain}` ||
                requestDomain.endsWith(`.${allowedDomain}`);

            if (!isAllowed) {
                return res.status(403).json({
                    success: false,
                    message: 'This download link is restricted to a specific website.',
                    detail: 'Access denied: domain not authorized'
                });
            }
        }

        // ========== BUILD CUSTOM DOWNLOAD FILENAME ==========
        let downloadName = file.originalName;

        if (file.customName && file.customName.trim()) {
            let name = file.customName.trim();
            // Ensure .apk extension
            if (!name.toLowerCase().endsWith('.apk')) {
                name += '.apk';
            }
            // Prepend brand name if set
            if (file.brandName && file.brandName.trim()) {
                const brand = file.brandName.trim().replace(/[^a-zA-Z0-9_\-. ]/g, '');
                downloadName = `${brand}_${name}`;
            } else {
                downloadName = name;
            }
        } else if (file.brandName && file.brandName.trim()) {
            // Only brand name, no custom name
            const brand = file.brandName.trim().replace(/[^a-zA-Z0-9_\-. ]/g, '');
            downloadName = `${brand}_${file.originalName}`;
        }

        // ========== PROXY DOWNLOAD (for custom filename + domain security) ==========
        if (file.storageType === 'supabase' || STORAGE_TYPE === 'supabase') {
            const publicUrl = getSupabasePublicUrl(file.storageKey);
            if (publicUrl) {
                try {
                    // Fetch file from Supabase and proxy it to user
                    const fetch = (await import('node-fetch')).default;
                    const supaResponse = await fetch(publicUrl);

                    if (!supaResponse.ok) {
                        throw new Error(`Supabase returned ${supaResponse.status}`);
                    }

                    // Set headers for download with custom filename
                    res.setHeader('Content-Type', file.mimeType || 'application/vnd.android.package-archive');
                    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
                    if (supaResponse.headers.get('content-length')) {
                        res.setHeader('Content-Length', supaResponse.headers.get('content-length'));
                    }
                    res.setHeader('Cache-Control', 'public, max-age=86400');

                    // Pipe the response
                    supaResponse.body.pipe(res);

                    // Increment download count (async)
                    file.incrementDownload().catch(err => console.error('Error incrementing download count:', err));
                    return;
                } catch (proxyError) {
                    console.error('Proxy download error:', proxyError);
                    // Fallback: redirect to Supabase URL (loses custom filename but at least works)
                    file.incrementDownload().catch(err => console.error('Error incrementing download count:', err));
                    return res.redirect(publicUrl);
                }
            }
        }

        // Get file stream from storage (Local or R2)
        const { stream, contentType, contentLength } = await downloadFile(file.storageKey);

        // Set response headers for file download with custom filename
        res.setHeader('Content-Type', contentType || file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
        res.setHeader('Content-Length', contentLength || file.fileSize);
        res.setHeader('Cache-Control', 'public, max-age=86400');

        // Stream file to response
        stream.pipe(res);

        // Increment download count (async)
        file.incrementDownload().catch(err => {
            console.error('Error incrementing download count:', err);
        });

    } catch (error) {
        console.error('Download error:', error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Server error downloading file'
            });
        }
    }
});

// @route   GET /d/:fileId/info
// @desc    Get file info without downloading
// @access  Public
router.get('/:fileId/info', async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await File.findOne({ fileId, isActive: true })
            .select('fileId originalName fileSize downloadCount uploadedAt');

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
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
        res.status(500).json({
            success: false,
            message: 'Server error fetching file info'
        });
    }
});

module.exports = router;
