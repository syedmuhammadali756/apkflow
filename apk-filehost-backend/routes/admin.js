const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const File = require('../models/File');

const ADMIN_CODE = process.env.ADMIN_CODE || 'drwebjr2026';
const ADMIN_SECRET = process.env.JWT_SECRET + '-admin';

// Middleware: verify admin token
function adminAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Admin token required' });
    }
    try {
        const decoded = jwt.verify(token, ADMIN_SECRET);
        if (!decoded.isAdmin) throw new Error();
        next();
    } catch {
        return res.status(403).json({ success: false, message: 'Invalid admin token' });
    }
}

// @route   POST /api/admin/login
// @desc    Admin login with secret code
router.post('/login', (req, res) => {
    const { code } = req.body;
    if (!code || code !== ADMIN_CODE) {
        return res.status(401).json({ success: false, message: 'Invalid admin code' });
    }
    const token = jwt.sign({ isAdmin: true }, ADMIN_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token });
});

// @route   GET /api/admin/users
// @desc    List all users with stats
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        // Get file counts and storage for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const files = await File.find({ userId: user._id, isActive: true })
                .select('fileSize downloadCount');
            const totalFiles = files.length;
            const totalStorage = files.reduce((sum, f) => sum + (f.fileSize || 0), 0);
            const totalDownloads = files.reduce((sum, f) => sum + (f.downloadCount || 0), 0);

            return {
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                isSuspended: user.isSuspended || false,
                suspendedAt: user.suspendedAt,
                suspendReason: user.suspendReason || '',
                stats: { totalFiles, totalStorage, totalDownloads }
            };
        }));

        res.json({ success: true, users: usersWithStats, total: usersWithStats.length });
    } catch (error) {
        console.error('Admin list users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/admin/users/:id
// @desc    Get user details with their files
router.get('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('+plainPassword');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const files = await File.find({ userId: user._id })
            .sort({ uploadedAt: -1 });

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                password: user.plainPassword || '(not stored)',
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                isSuspended: user.isSuspended || false,
                suspendedAt: user.suspendedAt,
                suspendReason: user.suspendReason || ''
            },
            files: files.map(f => ({
                id: f._id,
                fileId: f.fileId,
                originalName: f.originalName,
                fileSize: f.fileSize,
                downloadCount: f.downloadCount,
                isActive: f.isActive,
                uploadedAt: f.uploadedAt,
                allowedDomain: f.allowedDomain || ''
            }))
        });
    } catch (error) {
        console.error('Admin user detail error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/admin/users/:id/suspend
// @desc    Suspend a user account
router.post('/users/:id/suspend', adminAuth, async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isSuspended = true;
        user.suspendedAt = new Date();
        user.suspendReason = reason || 'Violated terms of service';
        await user.save();

        // Deactivate all user files
        await File.updateMany({ userId: user._id }, { isActive: false });

        res.json({ success: true, message: `User ${user.name} has been suspended` });
    } catch (error) {
        console.error('Admin suspend error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/admin/users/:id/unsuspend
// @desc    Unsuspend a user account
router.post('/users/:id/unsuspend', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isSuspended = false;
        user.suspendedAt = undefined;
        user.suspendReason = '';
        await user.save();

        // Reactivate all user files
        await File.updateMany({ userId: user._id }, { isActive: true });

        res.json({ success: true, message: `User ${user.name} has been unsuspended` });
    } catch (error) {
        console.error('Admin unsuspend error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
