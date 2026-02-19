const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const File = require('../models/File');
const { sendApprovalEmail, sendRejectionEmail, sendSuspensionEmail, sendUnsuspensionEmail, sendRemovalEmail, sendPlanUpgradeEmail } = require('../utils/emailService');
const DownloadLog = require('../models/DownloadLog');
const { deleteFromTebi } = require('../utils/tebiStorage');

const ADMIN_CODE = process.env.ADMIN_CODE || '(..@@drwebjr2026.Aa...)';
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
                accountStatus: user.accountStatus || 'approved',
                plan: user.plan || 'free',
                isEmailVerified: user.isEmailVerified || false,
                registrationIP: user.registrationIP || '',
                deviceFingerprint: user.deviceFingerprint || '',
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
                suspendReason: user.suspendReason || '',
                accountStatus: user.accountStatus || 'approved',
                plan: user.plan || 'free',
                isEmailVerified: user.isEmailVerified || false,
                registrationIP: user.registrationIP || '',
                deviceFingerprint: user.deviceFingerprint || ''
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

        // Send suspension email notification
        try {
            await sendSuspensionEmail(user.email, user.name, reason);
        } catch (emailErr) {
            console.error('Suspension email failed:', emailErr);
        }

        res.json({ success: true, message: `User ${user.name} has been suspended and notified via email` });
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

        const previousReason = user.suspendReason || 'Policy violation';

        user.isSuspended = false;
        user.suspendedAt = undefined;
        user.suspendReason = '';
        await user.save();

        // Reactivate all user files
        await File.updateMany({ userId: user._id }, { isActive: true });

        // Send unsuspension email with warning
        try {
            await sendUnsuspensionEmail(user.email, user.name, previousReason);
        } catch (emailErr) {
            console.error('Unsuspension email failed:', emailErr);
        }

        res.json({ success: true, message: `User ${user.name} has been unsuspended and notified via email` });
    } catch (error) {
        console.error('Admin unsuspend error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/admin/pending
// @desc    Get all users pending approval
router.get('/pending', adminAuth, async (req, res) => {
    try {
        const pendingUsers = await User.find({ accountStatus: 'pending_approval' })
            .select('-password')
            .sort({ createdAt: -1 });

        const users = pendingUsers.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            createdAt: u.createdAt,
            registrationIP: u.registrationIP || '',
            deviceFingerprint: u.deviceFingerprint || '',
            isEmailVerified: u.isEmailVerified || false
        }));

        res.json({ success: true, users, total: users.length });
    } catch (error) {
        console.error('Admin pending users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/admin/approve/:id
// @desc    Approve a pending user account
router.post('/approve/:id', adminAuth, async (req, res) => {
    try {
        const { plan } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.accountStatus = 'approved';
        user.plan = plan || 'free';
        await user.save();

        // Send approval notification email to user with plan info
        const emailResult = await sendApprovalEmail(user.email, user.name, user.plan);
        if (!emailResult.success) {
            console.error('Failed to send approval email:', emailResult.error);
        }

        res.json({ success: true, message: `User ${user.name} has been approved on ${user.plan} plan and notified via email.` });
    } catch (error) {
        console.error('Admin approve error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/admin/users/:id/change-plan
// @desc    Change a user's subscription plan
router.post('/users/:id/change-plan', adminAuth, async (req, res) => {
    try {
        const { plan } = req.body;
        if (!['free', 'starter', 'pro'].includes(plan)) {
            return res.status(400).json({ success: false, message: 'Invalid plan. Must be free, starter, or pro.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const oldPlan = user.plan || 'free';
        user.plan = plan;
        await user.save();

        // Send plan upgrade email
        try {
            await sendPlanUpgradeEmail(user.email, user.name, plan, oldPlan);
        } catch (emailErr) {
            console.error('Plan upgrade email failed:', emailErr);
        }

        res.json({ success: true, message: `${user.name}'s plan changed from ${oldPlan} to ${plan}.` });
    } catch (error) {
        console.error('Admin change-plan error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/admin/reject/:id
// @desc    Reject a pending user account
router.post('/reject/:id', adminAuth, async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.accountStatus = 'rejected';
        await user.save();

        // Send rejection email with reason
        try {
            await sendRejectionEmail(user.email, user.name, reason);
        } catch (emailErr) {
            console.error('Rejection email failed:', emailErr);
        }

        res.json({ success: true, message: `User ${user.name} has been rejected.` });
    } catch (error) {
        console.error('Admin reject error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Permanently remove a user and all their data
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Save user info before deletion for the email
        const userEmail = user.email;
        const userName = user.name;
        const { reason } = req.body;

        // 1. Delete files from cloud storage
        const files = await File.find({ userId: user._id });
        let storageDeleted = 0;
        for (const file of files) {
            try {
                if (file.storageKey) {
                    await deleteFromTebi(file.storageKey);
                }
                storageDeleted++;
            } catch (storageErr) {
                console.error(`Failed to delete file ${file.storageKey} from storage:`, storageErr.message);
            }
        }

        // 2. Delete all File documents
        const fileResult = await File.deleteMany({ userId: user._id });

        // 3. Delete all DownloadLog documents
        const logResult = await DownloadLog.deleteMany({ userId: user._id });

        // 4. Delete the User document
        await User.findByIdAndDelete(user._id);

        // 5. Send permanent removal email
        try {
            await sendRemovalEmail(userEmail, userName, reason);
        } catch (emailErr) {
            console.error('Removal email failed:', emailErr);
        }

        res.json({
            success: true,
            message: `User ${userName} has been permanently removed and notified via email`,
            deletedFiles: fileResult.deletedCount,
            deletedLogs: logResult.deletedCount,
            storageFilesDeleted: storageDeleted
        });
    } catch (error) {
        console.error('Admin permanent delete error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
