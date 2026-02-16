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

// Send verification email with OTP
const sendVerificationEmail = async (to, code, userName) => {
    const transporter = createTransporter();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0f; color: #e2e8f0; margin: 0; padding: 0; }
            .container { max-width: 500px; margin: 0 auto; padding: 40px 20px; }
            .card { background: linear-gradient(135deg, rgba(15,15,25,0.95), rgba(20,20,35,0.95)); border: 1px solid rgba(124,58,237,0.3); border-radius: 16px; padding: 40px; text-align: center; }
            .logo { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #7c3aed, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
            .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 32px; }
            .greeting { font-size: 18px; margin-bottom: 16px; color: #f1f5f9; }
            .message { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
            .code-box { background: rgba(124,58,237,0.1); border: 2px dashed rgba(124,58,237,0.4); border-radius: 12px; padding: 20px; margin: 24px 0; }
            .code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #a78bfa; font-family: monospace; }
            .expiry { color: #ef4444; font-size: 12px; margin-top: 8px; }
            .footer { color: #64748b; font-size: 12px; margin-top: 32px; line-height: 1.5; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <div class="logo">APKFlow</div>
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
                <div class="footer">
                    © 2026 APKFlow. All rights reserved.<br/>
                    Free, fast, and secure APK file hosting.
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: `"APKFlow" <${process.env.EMAIL_USER}>`,
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

module.exports = { generateOTP, sendVerificationEmail };
