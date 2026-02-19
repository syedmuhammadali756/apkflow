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
// Table-Based Email Template
// ============================
// Email clients do NOT support CSS flex, grid, or modern features.
// Everything must use <table> layout with inline styles.

const buildEmail = (bodyContent, previewText = '') => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <title>APKFlow</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
        u + #body a { color: inherit; text-decoration: none; font-size: inherit; font-family: inherit; font-weight: inherit; line-height: inherit; }
    </style>
</head>
<body id="body" style="margin:0; padding:0; background-color:#050510; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <!-- Preview text -->
    <div style="display:none; font-size:1px; color:#050510; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
        ${previewText}
    </div>

    <!-- Outer wrapper -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#050510;">
        <tr>
            <td align="center" style="padding: 40px 16px;">
                <!-- Inner container -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;">
                    <tr>
                        <td style="background: linear-gradient(145deg, #0f0f1e, #0a0a14); border: 1px solid rgba(124,58,237,0.2); border-radius: 20px; overflow: hidden;">
                            
                            <!-- Gradient top bar -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="height: 4px; background: linear-gradient(90deg, #7c3aed, #a78bfa, #06b6d4, #7c3aed);"></td>
                                </tr>
                            </table>

                            <!-- Content area -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding: 36px 36px 12px 36px; text-align: center;">
                                        <!-- Logo -->
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding-bottom: 4px;">
                                                    <span style="font-size: 28px; font-weight: 800; color: #a78bfa; letter-spacing: -0.5px;">APKFlow</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="font-size: 11px; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase; padding-bottom: 6px;">
                                                    by Dr Web Jr.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Body content injected here -->
                            ${bodyContent}

                            <!-- Footer -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding: 0 36px 8px 36px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr><td style="height: 1px; background: linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent);"></td></tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding: 16px 36px 10px 36px;">
                                        <!-- Social icons -->
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 0 4px;">
                                                    <a href="https://www.facebook.com/SyedMuhammadAli.DrWebJr/" style="display:inline-block; width:32px; height:32px; border-radius:8px; background:rgba(124,58,237,0.1); border:1px solid rgba(124,58,237,0.2); text-align:center; line-height:32px; text-decoration:none; color:#a78bfa; font-size:12px; font-weight:600;">f</a>
                                                </td>
                                                <td style="padding: 0 4px;">
                                                    <a href="https://pk.linkedin.com/in/syed-muhammad-abubaker-dr-web-jr" style="display:inline-block; width:32px; height:32px; border-radius:8px; background:rgba(124,58,237,0.1); border:1px solid rgba(124,58,237,0.2); text-align:center; line-height:32px; text-decoration:none; color:#a78bfa; font-size:12px; font-weight:600;">in</a>
                                                </td>
                                                <td style="padding: 0 4px;">
                                                    <a href="https://www.instagram.com/syedmuhammadabubaker.drwebjr/" style="display:inline-block; width:32px; height:32px; border-radius:8px; background:rgba(124,58,237,0.1); border:1px solid rgba(124,58,237,0.2); text-align:center; line-height:32px; text-decoration:none; color:#a78bfa; font-size:12px; font-weight:600;">ig</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding: 8px 36px 28px 36px; font-size: 11px; color: #475569; line-height: 1.7;">
                                        &copy; 2026 <a href="https://apkflow.vercel.app" style="color:#7c3aed; text-decoration:none;">APKFlow</a> by Dr Web Jr. All rights reserved.<br/>
                                        Free, fast, and secure APK file hosting.
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

// Helper: OTP code box (table-based)
const codeBoxHTML = (label, code, expiryText) => `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
        <td style="padding: 0 36px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(124,58,237,0.06); border: 1px solid rgba(124,58,237,0.2); border-radius: 14px;">
                <tr>
                    <td align="center" style="padding: 24px 20px;">
                        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 12px;">${label}</div>
                        <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #a78bfa; font-family: 'Courier New', monospace;">${code}</div>
                        <div style="color: #f87171; font-size: 12px; margin-top: 10px; font-weight: 500;">${expiryText}</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
`;

// Helper: Info box row (table-based)
const infoBoxHTML = (rows) => {
    const rowsHTML = rows.map(r => `
        <tr>
            <td style="padding: 10px 16px; border-bottom: 1px solid rgba(124,58,237,0.06); font-size: 13px; color: #64748b; width: 40%;">${r.label}</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid rgba(124,58,237,0.06); font-size: 13px; color: #e2e8f0; font-weight: 600; text-align: right;">${r.value}</td>
        </tr>
    `).join('');

    return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td style="padding: 0 36px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(124,58,237,0.04); border: 1px solid rgba(124,58,237,0.12); border-radius: 12px; overflow: hidden;">
                    ${rowsHTML}
                </table>
            </td>
        </tr>
    </table>
    `;
};

// Helper: Tip box (table-based)
const tipBoxHTML = (text) => `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
        <td style="padding: 16px 36px 0 36px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(6,182,212,0.05); border: 1px solid rgba(6,182,212,0.12); border-radius: 10px;">
                <tr>
                    <td style="padding: 14px 16px; font-size: 12px; color: #94a3b8; line-height: 1.6;">${text}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>
`;

// Helper: Heading area
const headingHTML = (subtitle, icon, greeting, message) => `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
        <td align="center" style="padding: 0 36px 6px 36px; font-size: 13px; color: #94a3b8; letter-spacing: 0.5px;">${subtitle}</td>
    </tr>
    ${icon ? `<tr><td align="center" style="padding: 8px 36px; font-size: 36px;">${icon}</td></tr>` : ''}
    <tr>
        <td align="center" style="padding: 6px 36px; font-size: 20px; font-weight: 700; color: #f1f5f9;">${greeting}</td>
    </tr>
    <tr>
        <td align="center" style="padding: 6px 36px 20px 36px; font-size: 14px; color: #94a3b8; line-height: 1.7;">${message}</td>
    </tr>
</table>
`;

// Helper: Button
const buttonHTML = (text, url) => `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
        <td align="center" style="padding: 16px 36px 20px 36px;">
            <a href="${url}" style="display:inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">${text}</a>
        </td>
    </tr>
</table>
`;

// ============================
// 1. Verification Email (OTP)
// ============================
const sendVerificationEmail = async (to, code, userName) => {
    const transporter = createTransporter();

    const bodyContent = `
        ${headingHTML(
        'Email Verification',
        '&#x1F44B;',
        `Hi ${userName}!`,
        'Thank you for joining APKFlow! Use the verification code below to confirm your email and activate your account.'
    )}
        ${codeBoxHTML('Your Verification Code', code, '&#x23F0; Expires in 15 minutes')}
        ${tipBoxHTML('<strong style="color:#22d3ee;">&#x1F4A1; Tip:</strong> If you didn\'t create an APKFlow account, you can safely ignore this email.')}
    `;

    const mailOptions = {
        from: {
            name: 'APKFlow',
            address: process.env.EMAIL_USER
        },
        replyTo: process.env.EMAIL_USER,
        to: to,
        subject: `${code} - Verify Your APKFlow Account`,
        text: `Your APKFlow verification code is: ${code}. It expires in 15 minutes.`,
        html: buildEmail(bodyContent, `Your verification code is ${code}`)
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
// 2. Admin Notification
// ============================
const sendAdminNotificationEmail = async (userName, userEmail, userIP) => {
    const transporter = createTransporter();
    const adminEmail = process.env.EMAIL_USER;

    const bodyContent = `
        ${headingHTML(
        'New Account Pending',
        '&#x1F464;',
        'New User Registration',
        'A new user has verified their email and is waiting for your approval.'
    )}
        ${infoBoxHTML([
        { label: '&#x1F464; Name', value: userName },
        { label: '&#x1F4E7; Email', value: userEmail },
        { label: '&#x1F310; IP Address', value: userIP || 'Unknown' },
        { label: '&#x1F570; Requested', value: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) },
        { label: '&#x1F4CB; Status', value: '<span style="background:rgba(251,191,36,0.12); color:#fbbf24; border:1px solid rgba(251,191,36,0.25); padding:4px 12px; border-radius:16px; font-size:11px; font-weight:700; text-transform:uppercase;">Pending</span>' }
    ])}
        ${buttonHTML('Review in Admin Panel &rarr;', 'https://apkflow.vercel.app/admin')}
    `;

    const mailOptions = {
        from: {
            name: 'APKFlow',
            address: process.env.EMAIL_USER
        },
        to: [adminEmail, 'SyedMuhammadalibukhari756@gmail.com'],
        subject: `New Account Pending - ${userName} (${userEmail})`,
        text: `New user registration: ${userName} (${userEmail}). IP: ${userIP || 'Unknown'}. Please review at https://apkflow.vercel.app/admin`,
        html: buildEmail(bodyContent, `New user ${userName} is waiting for approval`)
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
// 3. Account Approved (Plan-Specific)
// ============================
const sendApprovalEmail = async (to, userName, plan = 'free') => {
    const transporter = createTransporter();

    const planLabels = {
        free: { name: 'Free', color: '#64748b', maxFiles: '1 file', protectedLinks: 'Not included' },
        starter: { name: 'Starter', color: '#7c3aed', maxFiles: '3 files', protectedLinks: 'Included ✓' },
        pro: { name: 'Pro', color: '#f59e0b', maxFiles: 'Unlimited', protectedLinks: 'Included ✓' }
    };
    const p = planLabels[plan] || planLabels.free;

    const bodyContent = `
        ${headingHTML(
        'Account Status Update',
        '&#x1F389;',
        `Welcome Aboard, ${userName}!`,
        `Great news! Your APKFlow account has been <strong style="color:#4ade80;">approved</strong> on the <strong style="color:${p.color};">${p.name} Plan</strong>.`
    )}
        ${infoBoxHTML([
        { label: '&#x2705; Status', value: '<span style="background:rgba(34,197,94,0.12); color:#4ade80; border:1px solid rgba(34,197,94,0.25); padding:4px 12px; border-radius:16px; font-size:11px; font-weight:700; text-transform:uppercase;">Approved</span>' },
        { label: '&#x1F3F7; Plan', value: `<span style="background:rgba(124,58,237,0.12); color:${p.color}; border:1px solid rgba(124,58,237,0.25); padding:4px 12px; border-radius:16px; font-size:11px; font-weight:700; text-transform:uppercase;">${p.name}</span>` },
        { label: '&#x1F4E6; Free Storage', value: '5 GB' },
        { label: '&#x1F4C1; Max Files', value: p.maxFiles },
        { label: '&#x1F512; Protected Links', value: p.protectedLinks }
    ])}
        <!-- Features row using table -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td style="padding: 16px 36px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="8" width="100%">
                        <tr>
                            <td align="center" width="33%" style="background:rgba(124,58,237,0.04); border:1px solid rgba(124,58,237,0.08); border-radius:10px; padding:14px 6px;">
                                <div style="font-size:22px; margin-bottom:6px;">&#x1F4E4;</div>
                                <div style="font-size:10px; color:#a78bfa; font-weight:700; text-transform:uppercase;">Upload</div>
                                <div style="font-size:10px; color:#64748b; margin-top:2px;">Drag &amp; drop APKs</div>
                            </td>
                            <td align="center" width="33%" style="background:rgba(124,58,237,0.04); border:1px solid rgba(124,58,237,0.08); border-radius:10px; padding:14px 6px;">
                                <div style="font-size:22px; margin-bottom:6px;">&#x1F517;</div>
                                <div style="font-size:10px; color:#a78bfa; font-weight:700; text-transform:uppercase;">Share</div>
                                <div style="font-size:10px; color:#64748b; margin-top:2px;">Get instant links</div>
                            </td>
                            <td align="center" width="33%" style="background:rgba(124,58,237,0.04); border:1px solid rgba(124,58,237,0.08); border-radius:10px; padding:14px 6px;">
                                <div style="font-size:22px; margin-bottom:6px;">&#x1F4CA;</div>
                                <div style="font-size:10px; color:#a78bfa; font-weight:700; text-transform:uppercase;">Track</div>
                                <div style="font-size:10px; color:#64748b; margin-top:2px;">Monitor downloads</div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        ${buttonHTML('Login &amp; Start Uploading &rarr;', 'https://apkflow.vercel.app/login')}
    `;

    const mailOptions = {
        from: {
            name: 'APKFlow',
            address: process.env.EMAIL_USER
        },
        replyTo: process.env.EMAIL_USER,
        to: to,
        subject: `Your APKFlow Account Has Been Approved! (${p.name} Plan)`,
        text: `Great news, ${userName}! Your APKFlow account has been approved on the ${p.name} Plan. Login at https://apkflow.vercel.app/login`,
        html: buildEmail(bodyContent, `Your APKFlow account has been approved on the ${p.name} Plan!`)
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
// 4. Account Rejected
// ============================
const sendRejectionEmail = async (to, userName, reason) => {
    const transporter = createTransporter();
    const reasonText = reason || 'Your account did not meet our approval criteria at this time.';

    const bodyContent = `
        ${headingHTML(
        'Account Status Update',
        '&#x26A0;&#xFE0F;',
        `Hi ${userName},`,
        'We\'ve reviewed your APKFlow account request, and unfortunately, it was <strong style="color:#f87171;">not approved</strong> at this time.'
    )}
        ${infoBoxHTML([
        { label: '&#x274C; Status', value: '<span style="background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.25); padding:4px 12px; border-radius:16px; font-size:11px; font-weight:700; text-transform:uppercase;">Rejected</span>' },
        { label: '&#x1F4DD; Reason', value: reasonText }
    ])}
        ${tipBoxHTML('<strong style="color:#22d3ee;">&#x1F4E9; Need Help?</strong> If you believe this was a mistake, you can reply to this email or contact us.')}
    `;

    const mailOptions = {
        from: {
            name: 'APKFlow',
            address: process.env.EMAIL_USER
        },
        replyTo: process.env.EMAIL_USER,
        to: to,
        subject: `APKFlow Account Update - Action Required`,
        text: `Hi ${userName}, your APKFlow account request was not approved. Reason: ${reasonText}. Contact us if you have questions.`,
        html: buildEmail(bodyContent, `Your APKFlow account update`)
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
// 5. Password Reset OTP
// ============================
const sendPasswordResetEmail = async (to, code, userName) => {
    const transporter = createTransporter();

    const bodyContent = `
        ${headingHTML(
        'Password Reset',
        '&#x1F510;',
        `Hi ${userName},`,
        'We received a request to reset your APKFlow password. Use the code below to verify your identity and set a new password.'
    )}
        ${codeBoxHTML('Password Reset Code', code, '&#x23F0; Expires in 10 minutes')}
        ${tipBoxHTML('<strong style="color:#22d3ee;">&#x1F6E1;&#xFE0F; Security Notice:</strong> If you didn\'t request a password reset, someone may be trying to access your account. You can safely ignore this email.')}
    `;

    const mailOptions = {
        from: {
            name: 'APKFlow',
            address: process.env.EMAIL_USER
        },
        replyTo: process.env.EMAIL_USER,
        to: to,
        subject: `${code} - Reset Your APKFlow Password`,
        text: `Your APKFlow password reset code is: ${code}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
        html: buildEmail(bodyContent, `Your password reset code is ${code}`)
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Password reset email error:', error);
        return { success: false, error: error.message };
    }
};

// ============================
// 6. Account Suspended
// ============================
const sendSuspensionEmail = async (to, userName, reason) => {
    const transporter = createTransporter();
    const reasonText = reason || 'Violated terms of service.';

    const bodyContent = `
        ${headingHTML(
        'Account Suspended',
        '&#x1F6AB;',
        `Hi ${userName},`,
        'Your APKFlow account has been <strong style="color:#f87171;">suspended</strong> by our admin team. All your files have been temporarily deactivated.'
    )}
        ${infoBoxHTML([
        { label: '&#x26A0;&#xFE0F; Status', value: '<span style="background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.25); padding:4px 12px; border-radius:16px; font-size:11px; font-weight:700; text-transform:uppercase;">Suspended</span>' },
        { label: '&#x1F4DD; Reason', value: reasonText },
        { label: '&#x1F4C5; Date', value: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) }
    ])}
        ${tipBoxHTML('<strong style="color:#22d3ee;">&#x1F4E9; Appeal:</strong> If you believe this was a mistake, you can reply to this email. Our team will review your case and respond as soon as possible.')}
    `;

    const mailOptions = {
        from: {
            name: 'APKFlow',
            address: process.env.EMAIL_USER
        },
        replyTo: process.env.EMAIL_USER,
        to: to,
        subject: `APKFlow - Your Account Has Been Suspended`,
        text: `Hi ${userName}, your APKFlow account has been suspended. Reason: ${reasonText}. Contact us if you have questions.`,
        html: buildEmail(bodyContent, `Your APKFlow account has been suspended`)
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Suspension email error:', error);
        return { success: false, error: error.message };
    }
};

// ============================
// 7. Account Unsuspended
// ============================
const sendUnsuspensionEmail = async (to, userName, previousReason) => {
    const transporter = createTransporter();
    const reasonText = previousReason || 'Policy violation';

    const bodyContent = `
        ${headingHTML(
        'Account Reinstated',
        '&#x2705;',
        `Welcome Back, ${userName}!`,
        'Good news! Your APKFlow account has been <strong style="color:#4ade80;">reinstated</strong> by our admin team. Your files have been reactivated and your access is fully restored.'
    )}
        ${infoBoxHTML([
        { label: '&#x2705; Status', value: '<span style="background:rgba(34,197,94,0.12); color:#4ade80; border:1px solid rgba(34,197,94,0.25); padding:4px 12px; border-radius:16px; font-size:11px; font-weight:700; text-transform:uppercase;">Active</span>' },
        { label: '&#x1F4DD; Previous Reason', value: reasonText },
        { label: '&#x1F4C5; Reinstated On', value: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) }
    ])}

        <!-- Warning Box -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td style="padding: 16px 36px 0 36px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(251,191,36,0.06); border: 1px solid rgba(251,191,36,0.25); border-radius: 12px;">
                        <tr>
                            <td style="padding: 18px 20px; text-align: center;">
                                <div style="font-size: 28px; margin-bottom: 8px;">&#x26A0;&#xFE0F;</div>
                                <div style="font-size: 14px; font-weight: 700; color: #fbbf24; margin-bottom: 8px;">Important Warning</div>
                                <div style="font-size: 13px; color: #94a3b8; line-height: 1.7;">
                                    Your account was previously suspended for: <strong style="color:#f87171;">${reasonText}</strong>.<br/><br/>
                                    Please <strong style="color:#fbbf24;">do not repeat the same mistake</strong>. If your account is suspended again for a similar reason, it will be <strong style="color:#ef4444;">permanently removed</strong> along with all your data — and this action cannot be undone.
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        ${tipBoxHTML('<strong style="color:#22d3ee;">&#x1F4A1; Tip:</strong> Make sure to follow the APKFlow community guidelines at all times. We want to keep the platform safe and reliable for everyone!')}
        ${buttonHTML('Login to Your Account &rarr;', 'https://apkflow.vercel.app/login')}
    `;

    const mailOptions = {
        from: {
            name: 'APKFlow',
            address: process.env.EMAIL_USER
        },
        replyTo: process.env.EMAIL_USER,
        to: to,
        subject: `APKFlow - Your Account Has Been Reinstated`,
        text: `Hi ${userName}, your APKFlow account has been reinstated. Previous reason for suspension: ${reasonText}. Please do not repeat the same mistake or your account will be permanently removed. Login at https://apkflow.vercel.app/login`,
        html: buildEmail(bodyContent, `Your APKFlow account has been reinstated`)
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Unsuspension email error:', error);
        return { success: false, error: error.message };
    }
};

// ============================
// 8. Account Permanently Removed
// ============================
const sendRemovalEmail = async (to, userName, reason) => {
    const transporter = createTransporter();
    const reasonText = reason || 'Repeated policy violations.';

    const bodyContent = `
        ${headingHTML(
        'Account Permanently Removed',
        '&#x1F6D1;',
        `Hi ${userName},`,
        'Your APKFlow account has been <strong style="color:#ef4444;">permanently removed</strong> by our admin team. All your data, files, and download history have been deleted.'
    )}
        ${infoBoxHTML([
        { label: '&#x1F6D1; Status', value: '<span style="background:rgba(239,68,68,0.12); color:#ef4444; border:1px solid rgba(239,68,68,0.25); padding:4px 12px; border-radius:16px; font-size:11px; font-weight:700; text-transform:uppercase;">Permanently Removed</span>' },
        { label: '&#x1F4DD; Reason', value: reasonText },
        { label: '&#x1F4C5; Date', value: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) }
    ])}

        <!-- Deleted Data Summary -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td style="padding: 16px 36px 0 36px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(239,68,68,0.04); border: 1px solid rgba(239,68,68,0.15); border-radius: 12px;">
                        <tr>
                            <td style="padding: 18px 20px; text-align: center;">
                                <div style="font-size: 28px; margin-bottom: 8px;">&#x1F5D1;&#xFE0F;</div>
                                <div style="font-size: 14px; font-weight: 700; color: #f87171; margin-bottom: 8px;">What Was Deleted</div>
                                <div style="font-size: 13px; color: #94a3b8; line-height: 1.7;">
                                    &#x2022; Your account and profile data<br/>
                                    &#x2022; All uploaded APK files from cloud storage<br/>
                                    &#x2022; All download links and analytics<br/>
                                    &#x2022; Download history and logs
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <!-- Final Notice -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td style="padding: 16px 36px 0 36px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(100,116,139,0.06); border: 1px solid rgba(100,116,139,0.12); border-radius: 10px;">
                        <tr>
                            <td style="padding: 14px 16px; font-size: 12px; color: #94a3b8; line-height: 1.6; text-align: center;">
                                <strong style="color:#cbd5e1;">This action is final and cannot be reversed.</strong><br/>
                                If you believe this was a mistake, you may contact us by replying to this email. However, deleted data cannot be recovered.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    `;

    const mailOptions = {
        from: {
            name: 'APKFlow',
            address: process.env.EMAIL_USER
        },
        replyTo: process.env.EMAIL_USER,
        to: to,
        subject: `APKFlow - Your Account Has Been Permanently Removed`,
        text: `Hi ${userName}, your APKFlow account has been permanently removed. Reason: ${reasonText}. All your files and data have been deleted. This action cannot be undone.`,
        html: buildEmail(bodyContent, `Your APKFlow account has been permanently removed`)
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Removal email error:', error);
        return { success: false, error: error.message };
    }
};

// ============================
// 9. Plan Upgrade Notification
// ============================
const sendPlanUpgradeEmail = async (to, userName, newPlan, oldPlan) => {
    const transporter = createTransporter();

    const planLabels = {
        free: { name: 'Free', color: '#64748b', maxFiles: '1 file', protectedLinks: 'Not included' },
        starter: { name: 'Starter', color: '#7c3aed', maxFiles: '3 files', protectedLinks: 'Included ✓' },
        pro: { name: 'Pro', color: '#f59e0b', maxFiles: 'Unlimited', protectedLinks: 'Included ✓' }
    };
    const p = planLabels[newPlan] || planLabels.free;
    const oldP = planLabels[oldPlan] || planLabels.free;

    const bodyContent = `
        ${headingHTML(
        'Plan Updated',
        '&#x1F680;',
        `Plan Upgrade, ${userName}!`,
        `Your APKFlow plan has been upgraded from <strong style="color:${oldP.color};">${oldP.name}</strong> to <strong style="color:${p.color};">${p.name}</strong>!`
    )}
        ${infoBoxHTML([
        { label: '&#x1F3F7; New Plan', value: `<span style="background:rgba(124,58,237,0.12); color:${p.color}; border:1px solid rgba(124,58,237,0.25); padding:4px 12px; border-radius:16px; font-size:11px; font-weight:700; text-transform:uppercase;">${p.name}</span>` },
        { label: '&#x1F4C1; Max Files', value: p.maxFiles },
        { label: '&#x1F512; Protected Links', value: p.protectedLinks },
        { label: '&#x1F4E6; Storage', value: '5 GB' }
    ])}
        ${tipBoxHTML('Your new plan features are now active. Login to start using them immediately!')}
        ${buttonHTML('Login to Dashboard &rarr;', 'https://apkflow.vercel.app/login')}
    `;

    const mailOptions = {
        from: {
            name: 'APKFlow',
            address: process.env.EMAIL_USER
        },
        replyTo: process.env.EMAIL_USER,
        to: to,
        subject: `Your APKFlow Plan Has Been Upgraded to ${p.name}! 🚀`,
        text: `Great news, ${userName}! Your APKFlow plan has been upgraded from ${oldP.name} to ${p.name}. Login at https://apkflow.vercel.app/login`,
        html: buildEmail(bodyContent, `Your plan has been upgraded to ${p.name}!`)
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Plan upgrade email error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateOTP,
    sendVerificationEmail,
    sendAdminNotificationEmail,
    sendApprovalEmail,
    sendRejectionEmail,
    sendPasswordResetEmail,
    sendSuspensionEmail,
    sendUnsuspensionEmail,
    sendRemovalEmail,
    sendPlanUpgradeEmail
};
