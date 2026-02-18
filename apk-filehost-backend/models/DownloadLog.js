const mongoose = require('mongoose');

const downloadLogSchema = new mongoose.Schema({
    fileId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    fileName: {
        type: String,
        default: ''
    },
    ip: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    },
    referer: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: 'Unknown'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false
});

// Compound indexes for analytics queries
downloadLogSchema.index({ fileId: 1, timestamp: -1 });
downloadLogSchema.index({ userId: 1, timestamp: -1 });
downloadLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('DownloadLog', downloadLogSchema);
