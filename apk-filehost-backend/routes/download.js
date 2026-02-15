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
// @desc    Download file (public endpoint)
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
        // If using Supabase, redirect to public URL
        if (file.storageType === 'supabase' || STORAGE_TYPE === 'supabase') {
            const publicUrl = getSupabasePublicUrl(file.storageKey);
            if (publicUrl) {
                // Increment download count (async, don't wait)
                file.incrementDownload().catch(err => console.error('Error incrementing download count:', err));
                return res.redirect(publicUrl);
            }
        }

        // Get file stream from storage (Local or R2)
        const { stream, contentType, contentLength } = await downloadFile(file.storageKey);

        // Set response headers for file download
        res.setHeader('Content-Type', contentType || file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Length', contentLength || file.fileSize);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

        // Stream file to response
        stream.pipe(res);

        // Increment download count (async, don't wait)
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
