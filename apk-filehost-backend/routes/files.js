const express = require('express');
const router = express.Router();
const multer = require('multer');
const { nanoid } = require('nanoid');
const auth = require('../middleware/auth');
const { uploadToLocal, deleteFromLocal } = require('../utils/localStorage');
const { uploadToR2, deleteFromR2 } = require('../utils/r2Storage');
const { uploadToTebi, deleteFromTebi, getPresignedUploadUrl, createMultipartUpload, getMultipartPresignedUrl, completeMultipartUpload, abortMultipartUpload } = require('../utils/tebiStorage');
const File = require('../models/File');
const User = require('../models/User');

// Determine storage type (Tebi > R2 > Local)
const STORAGE_TYPE = process.env.TEBI_ACCESS_KEY ? 'tebi' : (process.env.R2_ACCESS_KEY_ID ? 'r2' : 'local');

const uploadFile = STORAGE_TYPE === 'tebi' ? uploadToTebi : (STORAGE_TYPE === 'r2' ? uploadToR2 : uploadToLocal);
const deleteFile = STORAGE_TYPE === 'tebi' ? deleteFromTebi : (STORAGE_TYPE === 'r2' ? deleteFromR2 : deleteFromLocal);

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: (process.env.MAX_FILE_SIZE_MB || 1024) * 1024 * 1024 // Default 1GB
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
// @route   POST /api/files/upload
// @desc    Upload an APK file (supports direct metadata or multipart)
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        // Check upload limit based on user's plan
        const user = await User.findById(req.userId);
        const planLimits = User.PLAN_LIMITS[user.plan] || User.PLAN_LIMITS.free;
        const currentFileCount = await File.countDocuments({ userId: req.userId, isActive: true });
        if (currentFileCount >= planLimits.maxFiles) {
            return res.status(400).json({
                success: false,
                message: `Upload limit reached. Your ${user.plan} plan allows ${planLimits.maxFiles} file(s). Upgrade your plan for more uploads.`,
                upgradeRequired: true,
                currentPlan: user.plan
            });
        }

        let originalName, fileSize, mimetype, storageKey, storageType;

        // Mode 1: Frontend uploaded directly to Tebi/Supabase, sending metadata only
        if (req.body.storageKey && req.body.fileUrl) {
            originalName = req.body.originalName;
            fileSize = parseInt(req.body.fileSize);
            mimetype = req.body.mimetype || 'application/octet-stream';
            storageKey = req.body.storageKey;
            storageType = req.body.storageType || 'tebi';
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

        // Check user storage quota (legacy check, keep for safety)
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
// @desc    Get all files for logged-in user + aggregated stats
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = '-uploadedAt' } = req.query;

        // Get paginated files
        const files = await File.find({ userId: req.userId, isActive: true })
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-__v');

        const total = await File.countDocuments({ userId: req.userId, isActive: true });

        // Calculate aggregated stats from ALL user files (not just paginated ones)
        const allUserFiles = await File.find({ userId: req.userId, isActive: true }).select('fileSize downloadCount');
        const totalStorageUsed = allUserFiles.reduce((acc, file) => acc + (file.fileSize || 0), 0);
        const totalDownloads = allUserFiles.reduce((acc, file) => acc + (file.downloadCount || 0), 0);

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
            stats: {
                totalFiles: total,
                totalStorageUsed,
                totalDownloads
            },
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
                message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 1024}MB`
            });
        }
    }
    next(error);
});
// @route   POST /api/files/presign
// @desc    Get presigned URL for direct upload to Tebi.io
// @access  Private
router.post('/presign', auth, async (req, res) => {
    try {
        const { fileName, contentType } = req.body;

        if (!fileName) {
            return res.status(400).json({ success: false, message: 'fileName is required' });
        }

        // Check upload limit based on user's plan
        const user = await User.findById(req.userId);
        const planLimits = User.PLAN_LIMITS[user.plan] || User.PLAN_LIMITS.free;
        const currentFileCount = await File.countDocuments({ userId: req.userId, isActive: true });
        if (currentFileCount >= planLimits.maxFiles) {
            return res.status(400).json({
                success: false,
                message: `Upload limit reached. Your ${user.plan} plan allows ${planLimits.maxFiles} file(s). Upgrade your plan for more uploads.`,
                upgradeRequired: true,
                currentPlan: user.plan
            });
        }

        const fileExt = fileName.split('.').pop();
        const storageKey = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const mime = contentType || 'application/octet-stream';

        const presignData = await getPresignedUploadUrl(storageKey, mime);

        res.json({
            success: true,
            uploadUrl: presignData.uploadUrl,
            storageKey: presignData.storageKey,
            publicUrl: presignData.publicUrl
        });
    } catch (error) {
        console.error('Presign error:', error.message, 'STORAGE_TYPE:', STORAGE_TYPE, 'TEBI_KEY_SET:', !!process.env.TEBI_ACCESS_KEY);
        res.status(500).json({ success: false, message: 'Failed to generate upload URL', debug: error.message });
    }
});

// @route   POST /api/files/multipart/init
// @desc    Initialize multipart upload
router.post('/multipart/init', auth, async (req, res) => {
    try {
        const { fileName, contentType } = req.body;
        if (!fileName) return res.status(400).json({ success: false, message: 'fileName is required' });

        const fileExt = fileName.split('.').pop();
        const storageKey = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const mime = contentType || 'application/octet-stream';

        const { uploadId, key } = await createMultipartUpload(storageKey, mime);

        res.json({ success: true, uploadId, key });
    } catch (error) {
        console.error('Multipart init error:', error);
        res.status(500).json({ success: false, message: 'Failed to init upload' });
    }
});

// @route   POST /api/files/multipart/sign-part
// @desc    Get presigned URL for a part
router.post('/multipart/sign-part', auth, async (req, res) => {
    try {
        const { key, uploadId, partNumber } = req.body;
        if (!key || !uploadId || !partNumber) return res.status(400).json({ success: false, message: 'Missing parameters' });

        const { uploadUrl } = await getMultipartPresignedUrl(key, uploadId, parseInt(partNumber));
        res.json({ success: true, uploadUrl });
    } catch (error) {
        console.error('Multipart sign error:', error);
        res.status(500).json({ success: false, message: 'Failed to sign part' });
    }
});

// @route   POST /api/files/multipart/complete
// @desc    Complete multipart upload
router.post('/multipart/complete', auth, async (req, res) => {
    try {
        const { key, uploadId, parts } = req.body;
        if (!key || !uploadId || !parts) return res.status(400).json({ success: false, message: 'Missing parameters' });

        const result = await completeMultipartUpload(key, uploadId, parts);
        res.json(result);
    } catch (error) {
        console.error('Multipart complete error:', error);
        res.status(500).json({ success: false, message: 'Failed to complete upload' });
    }
});

// @route   POST /api/files/multipart/abort
// @desc    Abort multipart upload
router.post('/multipart/abort', auth, async (req, res) => {
    try {
        const { key, uploadId } = req.body;
        await abortMultipartUpload(key, uploadId);
        res.json({ success: true });
    } catch (error) {
        console.error('Multipart abort error:', error);
        res.status(500).json({ success: false, message: 'Failed to abort upload' });
    }
});

module.exports = router;
