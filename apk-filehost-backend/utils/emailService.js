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
// Shared email styles
// ============================
const emailStyles = `
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0f; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 0 auto; padding: 40px 20px; }
    .card { background: linear-gradient(135deg, rgba(15,15,25,0.95), rgba(20,20,35,0.95)); border: 1px solid rgba(124,58,237,0.3); border-radius: 16px; padding: 40px; text-align: center; }
    .logo { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #7c3aed, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px; }
    .author { color: #94a3b8; font-size: 12px; margin-bottom: 6px; }
    .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 32px; }
    .greeting { font-size: 18px; margin-bottom: 16px; color: #f1f5f9; }
    .message { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    .code-box { background: rgba(124,58,237,0.1); border: 2px dashed rgba(124,58,237,0.4); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #a78bfa; font-family: monospace; }
    .expiry { color: #ef4444; font-size: 12px; margin-top: 8px; }
    .info-box { background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2); border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(124,58,237,0.1); color: #94a3b8; font-size: 13px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; }
    .info-value { color: #e2e8f0; font-weight: 600; }
    .success-icon { font-size: 48px; margin-bottom: 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .social-links { margin-top: 24px; margin-bottom: 16px; }
    .social-links a { display: inline-block; margin: 0 8px; width: 32px; height: 32px; border-radius: 50%; background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3); text-align: center; line-height: 32px; text-decoration: none; color: #a78bfa; font-size: 14px; }
    .footer { color: #64748b; font-size: 12px; margin-top: 16px; line-height: 1.5; }
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
        © 2026 APKFlow by Dr Web Jr. All rights reserved.<br/>
        Free, fast, and secure APK file hosting.
    </div>
`;

// ============================
// 1. Send Verification Email (OTP)
// ============================
const sendVerificationEmail = async (to, code, userName) => {
    const transporter = createTransporter();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><style>${emailStyles}</style></head>
    <body>
        <div class="container">
            <div class="card">
                <div class="logo">APKFlow</div>
                <div class="author">by Dr Web Jr.</div>
                <div class="subtitle">Email Verification</div>
                <div class="greeting">Hi ${userName}! 👋</div>
                <div class="message">
                    Thank you for signing up with APKFlow! Please use the verification code below to verify your email address.
                </div>
                <div class="code-box">
                    <div class="code">${code}</div>
                    <div class="expiry">⏰ This code expires in 15 minutes</div>
                </div>
                <div class="message">
                    If you didn't create an account on APKFlow, please ignore this email.
                </div>
                ${footerHTML}
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: `"APKFlow — Dr Web Jr." <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `${code} — APKFlow Email Verification`,
        html: htmlContent
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
// 2. Notify Admin — New Account Pending Approval
// ============================
const sendAdminNotificationEmail = async (userName, userEmail, userIP) => {
    const transporter = createTransporter();
    const adminEmail = process.env.EMAIL_USER; // apkflow.vercel.app@gmail.com

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><style>${emailStyles}</style></head>
    <body>
        <div class="container">
            <div class="card">
                <div class="logo">APKFlow</div>
                <div class="author">by Dr Web Jr.</div>
                <div class="subtitle">🔔 New Account Pending Approval</div>
                <div class="greeting">Hey Admin! 👨‍💻</div>
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
                        <span class="info-label">🕐 Time</span>
                        <span class="info-value">${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</span>
                    </div>
                </div>
                <div class="message">
                    Please review this account in the Admin Panel and approve or reject it.
                </div>
                <a href="https://apkflow.vercel.app/admin" class="btn">Open Admin Panel →</a>
                ${footerHTML}
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: `"APKFlow — Dr Web Jr." <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `🔔 New Account Pending — ${userName} (${userEmail})`,
        html: htmlContent
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
// 3. Notify User — Account Approved
// ============================
const sendApprovalEmail = async (to, userName) => {
    const transporter = createTransporter();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><style>${emailStyles}</style></head>
    <body>
        <div class="container">
            <div class="card">
                <div class="logo">APKFlow</div>
                <div class="author">by Dr Web Jr.</div>
                <div class="subtitle">Account Approved</div>
                <div class="success-icon">🎉</div>
                <div class="greeting">Congratulations, ${userName}!</div>
                <div class="message">
                    Great news! Your APKFlow account has been reviewed and <strong style="color: #22c55e;">approved</strong> by our admin team.
                </div>
                <div class="info-box">
                    <div class="info-row">
                        <span class="info-label">✅ Status</span>
                        <span class="info-value" style="color: #22c55e;">Approved</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">📦 Storage</span>
                        <span class="info-value">5 GB Free</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">📤 Max Upload</span>
                        <span class="info-value">1 GB per file</span>
                    </div>
                </div>
                <div class="message">
                    You can now login and start uploading your APK files. Enjoy the platform!
                </div>
                <a href="https://apkflow.vercel.app/login" class="btn">Login Now →</a>
                ${footerHTML}
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: `"APKFlow — Dr Web Jr." <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `🎉 Your APKFlow Account Has Been Approved!`,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Approval email send error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { generateOTP, sendVerificationEmail, sendAdminNotificationEmail, sendApprovalEmail };
