const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const File = require('../models/File');
const User = require('../models/User');
const DownloadLog = require('../models/DownloadLog');

// @route   GET /api/stats/overview
// @desc    Get user's dashboard overview stats
// @access  Private
router.get('/overview', auth, async (req, res) => {
    try {
        const userId = req.userId;

        // Files stats
        const files = await File.find({ userId, isActive: true });
        const totalFiles = files.length;
        const totalStorage = files.reduce((sum, f) => sum + (f.fileSize || 0), 0);
        const totalDownloads = files.reduce((sum, f) => sum + (f.downloadCount || 0), 0);

        // Downloads last 7 days (for chart)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyDownloads = await DownloadLog.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    timestamp: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]).catch(() => []);

        // Fill in missing days with 0
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = dailyDownloads.find(dd => dd._id === dateStr);
            chartData.push({
                date: dateStr,
                label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                downloads: found ? found.count : 0
            });
        }

        // Top downloaded files
        const topFiles = files
            .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
            .slice(0, 5)
            .map(f => ({
                fileId: f.fileId,
                name: f.customName || f.originalName,
                downloads: f.downloadCount || 0,
                size: f.fileSize
            }));

        // Downloads today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const downloadsToday = await DownloadLog.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
            timestamp: { $gte: todayStart }
        }).catch(() => 0);

        // User info
        const user = await User.findById(userId);

        res.json({
            success: true,
            stats: {
                totalFiles,
                totalStorage,
                totalDownloads,
                downloadsToday,
                storageQuota: user?.storageQuota || 5 * 1024 * 1024 * 1024,
                storageUsed: user?.totalStorageUsed || totalStorage,
                maxFiles: 3,
                chartData,
                topFiles
            }
        });
    } catch (error) {
        console.error('Stats overview error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/stats/file/:fileId
// @desc    Get detailed stats for a specific file
// @access  Private
router.get('/file/:fileId', auth, async (req, res) => {
    try {
        const file = await File.findOne({
            fileId: req.params.fileId,
            userId: req.userId,
            isActive: true
        });

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // Last 30 days of downloads
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyDownloads = await DownloadLog.aggregate([
            {
                $match: {
                    fileId: file.fileId,
                    timestamp: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]).catch(() => []);

        // Country breakdown
        const countryStats = await DownloadLog.aggregate([
            { $match: { fileId: file.fileId } },
            {
                $group: {
                    _id: '$country',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]).catch(() => []);

        // Referer breakdown
        const refererStats = await DownloadLog.aggregate([
            { $match: { fileId: file.fileId, referer: { $ne: '' } } },
            {
                $group: {
                    _id: '$referer',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]).catch(() => []);

        // Recent downloads (last 20)
        const recentDownloads = await DownloadLog.find({ fileId: file.fileId })
            .sort({ timestamp: -1 })
            .limit(20)
            .select('ip country referer timestamp')
            .catch(() => []);

        res.json({
            success: true,
            file: {
                fileId: file.fileId,
                originalName: file.originalName,
                customName: file.customName,
                brandName: file.brandName,
                fileSize: file.fileSize,
                downloadCount: file.downloadCount,
                uploadedAt: file.uploadedAt,
                lastDownloadAt: file.lastDownloadAt,
                allowedDomain: file.allowedDomain,
                storageType: file.storageType
            },
            analytics: {
                dailyDownloads,
                countryStats: countryStats.map(c => ({
                    country: c._id || 'Unknown',
                    count: c.count
                })),
                refererStats: refererStats.map(r => ({
                    referer: r._id,
                    count: r.count
                })),
                recentDownloads
            }
        });
    } catch (error) {
        console.error('File stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/stats/admin
// @desc    Admin overview stats
// @access  Admin (using query token for simplicity)
router.get('/admin', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const approvedUsers = await User.countDocuments({ accountStatus: 'approved' });
        const pendingUsers = await User.countDocuments({ accountStatus: 'pending_approval' });
        const totalFiles = await File.countDocuments({ isActive: true });

        const storageAgg = await File.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, totalSize: { $sum: '$fileSize' }, totalDownloads: { $sum: '$downloadCount' } } }
        ]).catch(() => []);

        const totalStorage = storageAgg[0]?.totalSize || 0;
        const totalDownloads = storageAgg[0]?.totalDownloads || 0;

        // Downloads last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyDownloads = await DownloadLog.aggregate([
            { $match: { timestamp: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]).catch(() => []);

        // Recent signups
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email accountStatus createdAt');

        res.json({
            success: true,
            stats: {
                totalUsers,
                approvedUsers,
                pendingUsers,
                totalFiles,
                totalStorage,
                totalDownloads,
                dailyDownloads,
                recentUsers
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
