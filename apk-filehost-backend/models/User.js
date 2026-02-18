const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    plainPassword: {
        type: String,
        select: false
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    totalStorageUsed: {
        type: Number,
        default: 0 // in bytes
    },
    storageQuota: {
        type: Number,
        default: 5 * 1024 * 1024 * 1024 // 5 GB in bytes
    },
    filesCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    suspendedAt: {
        type: Date
    },
    suspendReason: {
        type: String,
        default: ''
    },
    accountStatus: {
        type: String,
        enum: ['pending_verification', 'pending_approval', 'approved', 'rejected'],
        default: 'pending_verification'
    },
    verificationCode: {
        type: String,
        select: false
    },
    verificationCodeExpiry: {
        type: Date,
        select: false
    },
    registrationIP: {
        type: String,
        default: ''
    },
    deviceFingerprint: {
        type: String,
        default: ''
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    resetCode: {
        type: String,
        select: false
    },
    resetCodeExpiry: {
        type: Date,
        select: false
    },
    resetAttempts: {
        type: Number,
        default: 0,
        select: false
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check storage availability
userSchema.methods.hasStorageSpace = function (fileSize) {
    return (this.totalStorageUsed + fileSize) <= this.storageQuota;
};

// Method to update storage usage
userSchema.methods.updateStorage = function (bytes) {
    this.totalStorageUsed += bytes;
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
