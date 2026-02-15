const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    fileId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true // in bytes
    },
    mimeType: {
        type: String,
        default: 'application/vnd.android.package-archive'
    },
    storageKey: {
        type: String,
        required: true // Key in R2 storage
    },
    downloadLink: {
        type: String,
        required: true
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    lastDownloadAt: {
        type: Date
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    metadata: {
        fileExtension: String,
        uploadIP: String,
        userAgent: String
    }
}, {
    timestamps: true
});

// Index for faster queries
fileSchema.index({ userId: 1, uploadedAt: -1 });
fileSchema.index({ fileId: 1 });

// Method to increment download count
fileSchema.methods.incrementDownload = function () {
    this.downloadCount += 1;
    this.lastDownloadAt = new Date();
    return this.save();
};

// Static method to get user's total files
fileSchema.statics.getUserFilesCount = function (userId) {
    return this.countDocuments({ userId, isActive: true });
};

// Static method to get user's total storage
fileSchema.statics.getUserTotalStorage = async function (userId) {
    const result = await this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId), isActive: true } },
        { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
    ]);

    return result.length > 0 ? result[0].totalSize : 0;
};

module.exports = mongoose.model('File', fileSchema);
