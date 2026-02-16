const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, sendVerificationEmail } = require('../utils/emailService');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, deviceFingerprint } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, password, and name'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Get client IP
        const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress || '';

        // Check if user already exists with this email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Admin IP/device exemption — admin's IP and device can create unlimited accounts
        const ADMIN_EMAILS = ['syedmuhammadalibukhari756@gmail.com'];
        const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());

        // Check if this IP/device belongs to an admin (admin already registered from here)
        let isAdminDevice = isAdminEmail;
        if (!isAdminDevice) {
            const adminCheckQuery = [];
            if (clientIP) adminCheckQuery.push({ registrationIP: clientIP });
            if (deviceFingerprint) adminCheckQuery.push({ deviceFingerprint: deviceFingerprint });

            if (adminCheckQuery.length > 0) {
                const adminOnDevice = await User.findOne({
                    email: { $in: ADMIN_EMAILS },
                    $or: adminCheckQuery
                });
                if (adminOnDevice) isAdminDevice = true;
            }
        }

        // Check IP and device fingerprint restriction — one account per IP and per device
        // Skip entirely if this is admin's device/IP
        if (!isAdminDevice) {
            const restrictionQuery = [];
            if (clientIP) {
                restrictionQuery.push({ registrationIP: clientIP });
            }
            if (deviceFingerprint) {
                restrictionQuery.push({ deviceFingerprint: deviceFingerprint });
            }

            if (restrictionQuery.length > 0) {
                const existingAccount = await User.findOne({
                    $or: restrictionQuery,
                    accountStatus: { $in: ['pending_verification', 'pending_approval', 'approved'] }
                });
                if (existingAccount) {
                    const reason = existingAccount.registrationIP === clientIP
                        ? 'this network/IP address'
                        : 'this device';
                    return res.status(403).json({
                        success: false,
                        message: `An account has already been registered from ${reason}. Only one account per device and network is allowed. If you believe this is an error, please contact support.`
                    });
                }
            }
        }

        // Generate verification code
        const verificationCode = generateOTP();
        const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Create new user with pending status
        const user = new User({
            email,
            password,
            plainPassword: password,
            name,
            registrationIP: clientIP,
            deviceFingerprint: deviceFingerprint || '',
            accountStatus: 'pending_verification',
            verificationCode,
            verificationCodeExpiry,
            isEmailVerified: false
        });

        await user.save();

        // Send verification email
        const emailResult = await sendVerificationEmail(email, verificationCode, name);
        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
        }

        res.status(201).json({
            success: true,
            step: 'verify_email',
            message: 'A verification code has been sent to your email. Please check your inbox.',
            userId: user._id
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email with OTP code
// @access  Public
router.post('/verify-email', async (req, res) => {
    try {
        const { userId, code } = req.body;

        if (!userId || !code) {
            return res.status(400).json({
                success: false,
                message: 'User ID and verification code are required'
            });
        }

        const user = await User.findById(userId).select('+verificationCode +verificationCodeExpiry');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified. Waiting for admin approval.'
            });
        }

        // Check code expiry
        if (new Date() > user.verificationCodeExpiry) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new one.'
            });
        }

        // Check code match
        if (user.verificationCode !== code) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code. Please try again.'
            });
        }

        // Mark email as verified, move to pending approval
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    isEmailVerified: true,
                    accountStatus: 'pending_approval',
                    verificationCode: null,
                    verificationCodeExpiry: null
                }
            }
        );

        res.json({
            success: true,
            step: 'pending_approval',
            message: 'Email verified successfully! Your account is now pending admin approval. You will be able to login once an admin approves your account.'
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ success: false, message: 'Server error during verification' });
    }
});

// @route   POST /api/auth/resend-code
// @desc    Resend verification code
// @access  Public
router.post('/resend-code', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ success: false, message: 'Email is already verified' });
        }

        // Generate new code
        const verificationCode = generateOTP();
        const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

        await User.updateOne(
            { _id: user._id },
            { $set: { verificationCode, verificationCodeExpiry } }
        );

        // Send email
        const emailResult = await sendVerificationEmail(user.email, verificationCode, user.name);
        if (!emailResult.success) {
            return res.status(500).json({ success: false, message: 'Failed to send verification email' });
        }

        res.json({
            success: true,
            message: 'A new verification code has been sent to your email.'
        });
    } catch (error) {
        console.error('Resend code error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is suspended
        if (user.isSuspended) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended. Please contact support for assistance.',
                suspended: true,
                reason: user.suspendReason || ''
            });
        }

        // Check account status
        if (user.accountStatus === 'pending_verification') {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email first. Check your inbox for the verification code.',
                accountStatus: 'pending_verification'
            });
        }
        if (user.accountStatus === 'pending_approval') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending admin approval. Please wait for approval before logging in.',
                accountStatus: 'pending_approval'
            });
        }
        if (user.accountStatus === 'rejected') {
            return res.status(403).json({
                success: false,
                message: 'Your account registration has been rejected. Please contact support.',
                accountStatus: 'rejected'
            });
        }

        // Update last login and capture plain password for admin
        user.lastLogin = new Date();
        user.plainPassword = password;
        await User.updateOne({ _id: user._id }, { $set: { lastLogin: user.lastLogin, plainPassword: password } });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                storageUsed: user.totalStorageUsed,
                storageQuota: user.storageQuota,
                filesCount: user.filesCount
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');

        // Force-logout suspended users
        if (user.isSuspended) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended.',
                suspended: true
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                storageUsed: user.totalStorageUsed,
                storageQuota: user.storageQuota,
                filesCount: user.filesCount,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile'
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (name, email)
// @access  Private
router.put('/profile', require('../middleware/auth'), async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if email is taken by another user
        if (email && email !== user.email) {
            const existing = await User.findOne({ email });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            user.email = email;
        }

        if (name) user.name = name;
        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                storageUsed: user.totalStorageUsed,
                storageQuota: user.storageQuota,
                filesCount: user.filesCount
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: 'Server error updating profile' });
    }
});

// @route   PUT /api/auth/password
// @desc    Change user password
// @access  Private
router.put('/password', require('../middleware/auth'), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        user.plainPassword = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ success: false, message: 'Server error changing password' });
    }
});

module.exports = router;
