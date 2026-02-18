const nodemailer = require('nodemailer');

// Create transporter using Gmail SMTP
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================
// Premium Shared Email Styles
// ============================
const emailStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: #050510;
        color: #e2e8f0;
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: 100%;
    }
    
    .email-wrapper {
        background: #050510;
        padding: 40px 16px;
    }
    
    .container {
        max-width: 520px;
        margin: 0 auto;
    }
    
    .card {
        background: linear-gradient(145deg, rgba(15, 15, 30, 0.98), rgba(10, 10, 20, 0.98));
        border: 1px solid rgba(124, 58, 237, 0.2);
        border-radius: 20px;
        padding: 44px 36px;
        text-align: center;
        box-shadow:
            0 0 60px rgba(124, 58, 237, 0.06),
            0 20px 40px rgba(0, 0, 0, 0.4);
    }
    
    /* Header gradient bar */
    .header-bar {
        height: 4px;
        background: linear-gradient(90deg, #7c3aed, #a78bfa, #06b6d4, #7c3aed);
        border-radius: 20px 20px 0 0;
        margin: -44px -36px 32px -36px;
    }
    
    /* Logo */
    .logo-section { margin-bottom: 8px; }
    .logo {
        font-size: 32px;
        font-weight: 800;
        background: linear-gradient(135deg, #7c3aed, #a78bfa);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.5px;
    }
    .logo-icon {
        display: inline-block;
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #7c3aed, #6d28d9);
        border-radius: 10px;
        vertical-align: middle;
        margin-right: 8px;
        position: relative;
    }
    .author {
        color: #64748b;
        font-size: 11px;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        margin-bottom: 4px;
    }
    .subtitle {
        color: #94a3b8;
        font-size: 13px;
        margin-bottom: 28px;
        letter-spacing: 0.5px;
    }
    
    /* Divider */
    .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.3), transparent);
        margin: 24px 0;
    }
    
    /* Content */
    .greeting {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 12px;
        color: #f1f5f9;
    }
    .message {
        color: #94a3b8;
        font-size: 14px;
        line-height: 1.7;
        margin-bottom: 20px;
    }
    
    /* OTP Code Box */
    .code-box {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(6, 182, 212, 0.05));
        border: 1px solid rgba(124, 58, 237, 0.25);
        border-radius: 16px;
        padding: 28px;
        margin: 28px 0;
    }
    .code-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: #64748b;
        margin-bottom: 12px;
    }
    .code {
        font-size: 42px;
        font-weight: 800;
        letter-spacing: 10px;
        background: linear-gradient(135deg, #a78bfa, #7c3aed);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-family: 'Courier New', monospace;
    }
    .expiry {
        color: #f87171;
        font-size: 12px;
        margin-top: 12px;
        font-weight: 500;
    }
    
    /* Info Box */
    .info-box {
        background: rgba(124, 58, 237, 0.06);
        border: 1px solid rgba(124, 58, 237, 0.15);
        border-radius: 14px;
        padding: 20px;
        margin: 24px 0;
        text-align: left;
    }
    .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid rgba(124, 58, 237, 0.08);
    }
    .info-row:last-child { border-bottom: none; }
    .info-label {
        color: #64748b;
        font-size: 13px;
    }
    .info-value {
        color: #e2e8f0;
        font-weight: 600;
        font-size: 13px;
    }
    
    /* Status Badge */
    .badge {
        display: inline-block;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }
    .badge-success {
        background: rgba(34, 197, 94, 0.12);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.25);
    }
    .badge-error {
        background: rgba(239, 68, 68, 0.12);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.25);
    }
    .badge-pending {
        background: rgba(251, 191, 36, 0.12);
        color: #fbbf24;
        border: 1px solid rgba(251, 191, 36, 0.25);
    }
    
    /* Big Icon */
    .icon-circle {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        margin-bottom: 20px;
    }
    .icon-success {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
        border: 2px solid rgba(34, 197, 94, 0.3);
    }
    .icon-error {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
        border: 2px solid rgba(239, 68, 68, 0.3);
    }
    .icon-info {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(124, 58, 237, 0.05));
        border: 2px solid rgba(124, 58, 237, 0.3);
    }
    
    /* Button */
    .btn {
        display: inline-block;
        background: linear-gradient(135deg, #7c3aed, #6d28d9);
        color: #ffffff !important;
        padding: 14px 36px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 700;
        font-size: 14px;
        margin-top: 20px;
        letter-spacing: 0.3px;
        box-shadow: 0 4px 15px rgba(124, 58, 237, 0.35);
    }
    .btn-outline {
        background: transparent;
        border: 1px solid rgba(124, 58, 237, 0.4);
        color: #a78bfa !important;
        box-shadow: none;
    }
    
    /* Features Grid */
    .features {
        display: flex;
        gap: 12px;
        margin: 24px 0;
        text-align: center;
    }
    .feature-item {
        flex: 1;
        background: rgba(124, 58, 237, 0.05);
        border: 1px solid rgba(124, 58, 237, 0.1);
        border-radius: 12px;
        padding: 16px 8px;
    }
    .feature-icon { font-size: 24px; margin-bottom: 8px; }
    .feature-title { font-size: 11px; color: #a78bfa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .feature-desc { font-size: 11px; color: #64748b; margin-top: 4px; }
    
    /* Social Links */
    .social-links {
        margin-top: 28px;
        margin-bottom: 16px;
    }
    .social-links a {
        display: inline-block;
        margin: 0 6px;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: rgba(124, 58, 237, 0.1);
        border: 1px solid rgba(124, 58, 237, 0.2);
        text-align: center;
        line-height: 36px;
        text-decoration: none;
        color: #a78bfa;
        font-size: 13px;
        font-weight: 600;
    }
    
    /* Footer */
    .footer {
        color: #475569;
        font-size: 11px;
        margin-top: 16px;
        line-height: 1.6;
    }
    .footer a { color: #7c3aed; text-decoration: none; }
    
    /* Tip box */
    .tip-box {
        background: rgba(6, 182, 212, 0.06);
        border: 1px solid rgba(6, 182, 212, 0.15);
        border-radius: 10px;
        padding: 14px 16px;
        margin: 16px 0;
        text-align: left;
        font-size: 12px;
        color: #94a3b8;
        line-height: 1.6;
    }
    .tip-box strong { color: #22d3ee; }
`;

const socialLinksHTML = `
    <div class="social-links">
        <a href="https://www.facebook.com/SyedMuhammadAli.DrWebJr/" title="Facebook">f</a>
        <a href="https://pk.linkedin.com/in/syed-muhammad-abubaker-dr-web-jr" title="LinkedIn">in</a>
        <a href="https://www.instagram.com/syedmuhammadabubaker.drwebjr/" title="Instagram">ig</a>
    </div>
`;

const footerHTML = `
    ${socialLinksHTML}
    <div class="footer">
        © 2026 <a href="https://apkflow.vercel.app">APKFlow</a> by Dr Web Jr. All rights reserved.<br/>
        Free, fast, and secure APK file hosting.
    </div>
`;

// Build full HTML email wrapper
const buildEmail = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>APKFlow</title>
    <style>${emailStyles}</style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="card">
                <div class="header-bar"></div>
                <div class="logo-section">
                    <span class="logo">APKFlow</span>
                </div>
                <div class="author">by Dr Web Jr.</div>
                ${bodyContent}
                ${footerHTML}
            </div>
        </div>
    </div>
</body>
</html>
`;

// ============================
// 1. Verification Email (OTP)
// ============================
const sendVerificationEmail = async (to, code, userName) => {
    const transporter = createTransporter();

    const bodyContent = `
        <div class="subtitle">Email Verification</div>
        <div class="greeting">Hi ${userName}! 👋</div>
        <div class="message">
            Thank you for joining APKFlow! Use the verification code below to confirm your email and activate your account.
        </div>
        <div class="code-box">
            <div class="code-label">Your Verification Code</div>
            <div class="code">${code}</div>
            <div class="expiry">⏰ Expires in 15 minutes</div>
        </div>
        <div class="tip-box">
            <strong>💡 Tip:</strong> If you didn't create an APKFlow account, you can safely ignore this email. No action is needed.
        </div>
        <div class="divider"></div>
    `;

    const mailOptions = {
        from: `"APKFlow — Dr Web Jr." <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `${code} — Verify Your APKFlow Account`,
        html: buildEmail(bodyContent)
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};

// ============================
// 2. Admin Notification — New Account
// ============================
const sendAdminNotificationEmail = async (userName, userEmail, userIP) => {
    const transporter = createTransporter();
    const adminEmail = process.env.EMAIL_USER;

    const bodyContent = `
        <div class="subtitle">🔔 New Account Pending</div>
        <div class="icon-circle icon-info">👤</div>
        <div class="greeting">New User Registration</div>
        <div class="message">
            A new user has verified their email and is waiting for your approval to access APKFlow.
        </div>
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">👤 Name</span>
                <span class="info-value">${userName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">📧 Email</span>
                <span class="info-value">${userEmail}</span>
            </div>
            <div class="info-row">
                <span class="info-label">🌐 IP Address</span>
                <span class="info-value">${userIP || 'Unknown'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">🕐 Requested At</span>
                <span class="info-value">${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</span>
            </div>
            <div class="info-row">
                <span class="info-label">📋 Status</span>
                <span class="badge badge-pending">Pending Review</span>
            </div>
        </div>
        <a href="https://apkflow.vercel.app/admin" class="btn">Review in Admin Panel →</a>
        <div class="divider"></div>
    `;

    const mailOptions = {
        from: `"APKFlow — Dr Web Jr." <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `🔔 New Account Pending — ${userName} (${userEmail})`,
        html: buildEmail(bodyContent)
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Admin notification email error:', error);
        return { success: false, error: error.message };
    }
};

// ============================
// 3. Account Approved
// ============================
const sendApprovalEmail = async (to, userName) => {
    const transporter = createTransporter();

    const bodyContent = `
        <div class="subtitle">Account Status Update</div>
        <div class="icon-circle icon-success">🎉</div>
        <div class="greeting">Welcome Aboard, ${userName}!</div>
        <div class="message">
            Great news! Your APKFlow account has been reviewed and <strong style="color: #4ade80;">approved</strong> by our team. You now have full access to the platform.
        </div>
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">✅ Status</span>
                <span class="badge badge-success">Approved</span>
            </div>
            <div class="info-row">
                <span class="info-label">📦 Free Storage</span>
                <span class="info-value">5 GB</span>
            </div>
            <div class="info-row">
                <span class="info-label">📤 Max Upload</span>
                <span class="info-value">1 GB per file</span>
            </div>
            <div class="info-row">
                <span class="info-label">📁 Max Files</span>
                <span class="info-value">3 files</span>
            </div>
        </div>
        <div style="display: flex; gap: 12px; margin: 24px 0; text-align: center;">
            <div style="flex: 1; background: rgba(124,58,237,0.05); border: 1px solid rgba(124,58,237,0.1); border-radius: 12px; padding: 16px 8px;">
                <div style="font-size: 24px; margin-bottom: 8px;">📤</div>
                <div style="font-size: 11px; color: #a78bfa; font-weight: 600;">UPLOAD</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Drag & drop APKs</div>
            </div>
            <div style="flex: 1; background: rgba(124,58,237,0.05); border: 1px solid rgba(124,58,237,0.1); border-radius: 12px; padding: 16px 8px;">
                <div style="font-size: 24px; margin-bottom: 8px;">🔗</div>
                <div style="font-size: 11px; color: #a78bfa; font-weight: 600;">SHARE</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Get instant links</div>
            </div>
            <div style="flex: 1; background: rgba(124,58,237,0.05); border: 1px solid rgba(124,58,237,0.1); border-radius: 12px; padding: 16px 8px;">
                <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
                <div style="font-size: 11px; color: #a78bfa; font-weight: 600;">TRACK</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Monitor downloads</div>
            </div>
        </div>
        <a href="https://apkflow.vercel.app/login" class="btn">Login & Start Uploading →</a>
        <div class="divider"></div>
    `;

    const mailOptions = {
        from: `"APKFlow — Dr Web Jr." <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `🎉 Your APKFlow Account Has Been Approved!`,
        html: buildEmail(bodyContent)
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Approval email send error:', error);
        return { success: false, error: error.message };
    }
};

// ============================
// 4. Account Rejected (NEW)
// ============================
const sendRejectionEmail = async (to, userName, reason) => {
    const transporter = createTransporter();

    const reasonText = reason || 'Your account did not meet our approval criteria at this time.';

    const bodyContent = `
        <div class="subtitle">Account Status Update</div>
        <div class="icon-circle icon-error">⚠️</div>
        <div class="greeting">Hi ${userName},</div>
        <div class="message">
            We've reviewed your APKFlow account request, and unfortunately, it was <strong style="color: #f87171;">not approved</strong> at this time.
        </div>
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">❌ Status</span>
                <span class="badge badge-error">Rejected</span>
            </div>
            <div class="info-row">
                <span class="info-label">📝 Reason</span>
                <span class="info-value" style="max-width: 250px; text-align: right;">${reasonText}</span>
            </div>
        </div>
        <div class="tip-box">
            <strong>📩 Need Help?</strong> If you believe this was a mistake, you can reply to this email or contact us. We're happy to review your case again.
        </div>
        <div class="divider"></div>
    `;

    const mailOptions = {
        from: `"APKFlow — Dr Web Jr." <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `APKFlow Account Update — Action Required`,
        html: buildEmail(bodyContent)
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Rejection email send error:', error);
        return { success: false, error: error.message };
    }
};

// ============================
// 5. Password Reset OTP (NEW)
// ============================
const sendPasswordResetEmail = async (to, code, userName) => {
    const transporter = createTransporter();

    const bodyContent = `
        <div class="subtitle">Password Reset</div>
        <div class="icon-circle icon-info">🔐</div>
        <div class="greeting">Hi ${userName},</div>
        <div class="message">
            We received a request to reset your APKFlow password. Use the code below to verify your identity and set a new password.
        </div>
        <div class="code-box">
            <div class="code-label">Password Reset Code</div>
            <div class="code">${code}</div>
            <div class="expiry">⏰ Expires in 10 minutes</div>
        </div>
        <div class="tip-box">
            <strong>🛡️ Security Notice:</strong> If you didn't request a password reset, someone may be trying to access your account. You can safely ignore this email — your password will remain unchanged.
        </div>
        <div class="divider"></div>
    `;

    const mailOptions = {
        from: `"APKFlow — Dr Web Jr." <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `${code} — Reset Your APKFlow Password`,
        html: buildEmail(bodyContent)
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Password reset email error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateOTP,
    sendVerificationEmail,
    sendAdminNotificationEmail,
    sendApprovalEmail,
    sendRejectionEmail,
    sendPasswordResetEmail
};
