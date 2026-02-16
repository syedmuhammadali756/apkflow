const express = require('express');
const router = express.Router();
const multer = require('multer');
const { nanoid } = require('nanoid');
const auth = require('../middleware/auth');
const { uploadToLocal, deleteFromLocal } = require('../utils/localStorage');
const { uploadToR2, deleteFromR2 } = require('../utils/r2Storage');
const File = require('../models/File');
const User = require('../models/User');

const { uploadToSupabase, deleteFromSupabase } = require('../utils/supabaseStorage');

// Determine storage type
const STORAGE_TYPE = process.env.SUPABASE_URL ? 'supabase' : (process.env.R2_ACCESS_KEY_ID ? 'r2' : 'local');

const uploadFile = STORAGE_TYPE === 'supabase' ? uploadToSupabase : (STORAGE_TYPE === 'r2' ? uploadToR2 : uploadToLocal);
const deleteFile = STORAGE_TYPE === 'supabase' ? deleteFromSupabase : (STORAGE_TYPE === 'r2' ? deleteFromR2 : deleteFromLocal);

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: (process.env.MAX_FILE_SIZE_MB || 100) * 1024 * 1024 // Default 100MB
    },
    fileFilter: (req, file, cb) => {
        // Only allow APK files
        const allowedMimes = ['application/vnd.android.package-archive', 'application/octet-stream'];
        const allowedExtensions = ['.apk'];

        const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

        if (allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Only APK files are allowed'), false);
        }
    }
});

// @route   POST /api/files/upload
// @desc    Upload an APK file (supports direct metadata or multipart)
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        let originalName, fileSize, mimetype, storageKey, storageType;

        // Mode 1: Frontend uploaded directly to Supabase, sending metadata only
        if (req.body.storageKey && req.body.fileUrl) {
            originalName = req.body.originalName;
            fileSize = parseInt(req.body.fileSize);
            mimetype = req.body.mimetype || 'application/octet-stream';
            storageKey = req.body.storageKey;
            storageType = 'supabase';
        }
        // Mode 2: Classic multipart file upload
        else if (req.file) {
            originalName = req.file.originalname;
            fileSize = req.file.size;
            mimetype = req.file.mimetype;
            storageKey = `${req.userId}/${nanoid(10)}-${req.file.originalname}`;
            storageType = STORAGE_TYPE;
            await uploadFile(req.file.buffer, storageKey, mimetype);
        }
        else {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Check user storage quota
        const user = await User.findById(req.userId);
        if (!user.hasStorageSpace(fileSize)) {
            return res.status(400).json({
                success: false,
                message: 'Storage quota exceeded.'
            });
        }

        const fileId = nanoid(10);

        // Get custom fields from request
        const customName = req.body.customName || '';
        const brandName = req.body.brandName || '';
        const allowedDomain = req.body.allowedDomain || '';

        const newFile = new File({
            fileId,
            userId: req.userId,
            originalName,
            fileSize,
            mimeType: mimetype,
            storageKey,
            storageType,
            downloadLink: `/d/${fileId}`,
            customName,
            brandName,
            allowedDomain,
            metadata: {
                fileExtension: '.apk',
                uploadIP: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        await newFile.save();

        user.totalStorageUsed += fileSize;
        user.filesCount += 1;
        await user.save();

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                fileId: newFile.fileId,
                originalName: newFile.originalName,
                fileSize: newFile.fileSize,
                downloadLink: `${baseUrl}/d/${newFile.fileId}`,
                uploadedAt: newFile.uploadedAt
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during file upload'
        });
    }
});

// @route   GET /api/files
// @desc    Get all files for logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = '-uploadedAt' } = req.query;

        const files = await File.find({ userId: req.userId, isActive: true })
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-__v');

        const total = await File.countDocuments({ userId: req.userId, isActive: true });

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const filesWithFullLinks = files.map(file => {
            const fileObj = file.toObject();
            // Build proper download link pointing to backend
            let link = fileObj.downloadLink || `/d/${fileObj.fileId}`;
            // If link already has http (legacy records), extract just the path
            if (link.startsWith('http')) {
                try {
                    const url = new URL(link);
                    link = url.pathname; // get just "/d/fileId"
                } catch (e) {
                    link = `/d/${fileObj.fileId}`;
                }
            }
            return { ...fileObj, downloadLink: `${baseUrl}${link}` };
        });

        res.json({
            success: true,
            files: filesWithFullLinks,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching files'
        });
    }
});

// @route   DELETE /api/files/:fileId
// @desc    Delete a file
// @access  Private
router.delete('/:fileId', auth, async (req, res) => {
    try {
        const { fileId } = req.params;

        // Find file
        const file = await File.findOne({ fileId, userId: req.userId });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Delete from storage
        try {
            await deleteFile(file.storageKey);
        } catch (storageError) {
            console.error('Storage deletion error:', storageError);
            // Continue to delete from DB even if storage deletion fails
        }

        // Update user storage
        const user = await User.findById(req.userId);
        user.totalStorageUsed -= file.fileSize;
        user.filesCount -= 1;
        await user.save();

        // Soft delete (mark as inactive)
        file.isActive = false;
        await file.save();

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting file'
        });
    }
});

// @route   PUT /api/files/:fileId/rename
// @desc    Rename a file
// @access  Private
router.put('/:fileId/rename', auth, async (req, res) => {
    try {
        const { fileId } = req.params;
        const { newName } = req.body;

        if (!newName || !newName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'New name is required'
            });
        }

        // Ensure .apk extension
        let finalName = newName.trim();
        if (!finalName.toLowerCase().endsWith('.apk')) {
            finalName += '.apk';
        }

        const file = await File.findOne({ fileId, userId: req.userId, isActive: true });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        file.originalName = finalName;
        await file.save();

        res.json({
            success: true,
            message: 'File renamed successfully',
            file: {
                fileId: file.fileId,
                originalName: file.originalName
            }
        });
    } catch (error) {
        console.error('Rename error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error renaming file'
        });
    }
});

// Handle multer errors
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 100}MB`
            });
        }
    }
    next(error);
});

module.exports = router;
