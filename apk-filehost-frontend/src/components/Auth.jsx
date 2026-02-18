import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrandLogo, Mail, Lock, User, Eye, EyeOff, ArrowRight, Shield, Zap, Cloud, Check, Clock } from './Icons';
import './Auth.css';

// Simple browser fingerprint generator
const generateFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('APKFlow-FP', 2, 2);
    const canvasData = canvas.toDataURL();

    const data = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        canvasData
    ].join('|');

    // Simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'fp_' + Math.abs(hash).toString(36);
};

const Auth = ({ mode = 'login' }) => {
    const [isLogin, setIsLogin] = useState(mode === 'login');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login, API_URL } = useAuth();

    // Multi-step registration state
    const [regStep, setRegStep] = useState('form'); // 'form' | 'verify' | 'pending'
    const [userId, setUserId] = useState(null);
    const [otpCode, setOtpCode] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Forgot password state
    const [forgotStep, setForgotStep] = useState(null); // null | 'email' | 'code' | 'newpass' | 'done'
    const [resetEmail, setResetEmail] = useState('');
    const [resetUserId, setResetUserId] = useState(null);
    const [resetCode, setResetCode] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                const result = await login(formData.email, formData.password);
                if (result && !result.success) setError(result.message);
                else navigate('/dashboard');
            } else {
                // Registration — multi-step
                if (!formData.name) { setError('Name is required'); setLoading(false); return; }

                const fingerprint = generateFingerprint();
                const axios = (await import('axios')).default;
                const response = await axios.post(`${API_URL}/api/auth/register`, {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    deviceFingerprint: fingerprint
                });

                if (response.data.success && response.data.step === 'verify_email') {
                    setUserId(response.data.userId);
                    setRegStep('verify');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const axios = (await import('axios')).default;
            const response = await axios.post(`${API_URL}/api/auth/verify-email`, {
                userId,
                code: otpCode
            });

            if (response.data.success && response.data.step === 'pending_approval') {
                setRegStep('pending');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0) return;
        setResendLoading(true);
        setError('');
        try {
            const axios = (await import('axios')).default;
            await axios.post(`${API_URL}/api/auth/resend-code`, { userId });
            setResendCooldown(60);
            const timer = setInterval(() => {
                setResendCooldown(prev => {
                    if (prev <= 1) { clearInterval(timer); return 0; }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend code.');
        } finally {
            setResendLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setRegStep('form');
        setForgotStep(null);
        navigate(isLogin ? '/register' : '/login', { replace: true });
    };

    // === FORGOT PASSWORD HANDLERS ===
    const handleForgotSubmitEmail = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const axios = (await import('axios')).default;
            const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email: resetEmail });
            if (response.data.success) {
                setResetUserId(response.data.userId);
                setForgotStep('code');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset code.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotVerifyCode = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const axios = (await import('axios')).default;
            const response = await axios.post(`${API_URL}/api/auth/verify-reset-code`, {
                userId: resetUserId,
                code: resetCode
            });
            if (response.data.success) {
                setResetToken(response.data.resetToken);
                setForgotStep('newpass');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid code.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            const axios = (await import('axios')).default;
            const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
                resetToken,
                newPassword
            });
            if (response.data.success) {
                setForgotStep('done');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    // ===== FORGOT PASSWORD STEPS =====
    if (forgotStep === 'email') {
        return (
            <div className="auth-page">
                <div className="auth-visual">
                    <div className="auth-visual-bg">
                        <div className="auth-glow auth-glow-1" />
                        <div className="auth-glow auth-glow-2" />
                    </div>
                    <div className="auth-visual-content">
                        <BrandLogo size={56} />
                        <h2>APKFlow</h2>
                        <p>Reset your password securely.</p>
                    </div>
                </div>
                <div className="auth-form-panel">
                    <div className="auth-form-container">
                        <div className="auth-form-header">
                            <div className="auth-step-icon">
                                <Lock size={32} />
                            </div>
                            <h1>Forgot Password</h1>
                            <p>Enter your email and we'll send you a reset code</p>
                        </div>
                        <form onSubmit={handleForgotSubmitEmail} className="auth-form">
                            <div className="input-group">
                                <label>Email Address</label>
                                <div className="input-wrapper">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => { setResetEmail(e.target.value); setError(''); }}
                                        placeholder="you@example.com"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            {error && <div className="auth-error"><span>{error}</span></div>}
                            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                                {loading ? (
                                    <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Sending...</>
                                ) : (
                                    <>Send Reset Code <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>
                        <div className="auth-switch">
                            <span>Remember your password?</span>
                            <button onClick={() => { setForgotStep(null); setError(''); }} className="auth-switch-btn">Back to Login</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (forgotStep === 'code') {
        return (
            <div className="auth-page">
                <div className="auth-visual">
                    <div className="auth-visual-bg">
                        <div className="auth-glow auth-glow-1" />
                        <div className="auth-glow auth-glow-2" />
                    </div>
                    <div className="auth-visual-content">
                        <BrandLogo size={56} />
                        <h2>APKFlow</h2>
                        <p>Check your email for the code.</p>
                    </div>
                </div>
                <div className="auth-form-panel">
                    <div className="auth-form-container">
                        <div className="auth-form-header">
                            <div className="auth-step-icon">
                                <Shield size={32} />
                            </div>
                            <h1>Enter Reset Code</h1>
                            <p>We've sent a 6-digit code to <strong>{resetEmail}</strong></p>
                            <p className="auth-spam-tip">💡 Check your <strong>Spam</strong> or <strong>Junk</strong> folder if you can't find it.</p>
                        </div>
                        <form onSubmit={handleForgotVerifyCode} className="auth-form">
                            <div className="input-group">
                                <label>Reset Code</label>
                                <div className="input-wrapper">
                                    <Shield size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        value={resetCode}
                                        onChange={(e) => { setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                                        placeholder="Enter 6-digit code"
                                        maxLength={6}
                                        required
                                        autoFocus
                                        style={{ letterSpacing: '4px', fontSize: '18px', fontWeight: '700', textAlign: 'center' }}
                                    />
                                </div>
                            </div>
                            {error && <div className="auth-error"><span>{error}</span></div>}
                            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading || resetCode.length !== 6}>
                                {loading ? (
                                    <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Verifying...</>
                                ) : (
                                    <>Verify Code <Check size={18} /></>
                                )}
                            </button>
                        </form>
                        <div className="auth-switch">
                            <span>Didn't receive code?</span>
                            <button onClick={() => setForgotStep('email')} className="auth-switch-btn">Try Again</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (forgotStep === 'newpass') {
        return (
            <div className="auth-page">
                <div className="auth-visual">
                    <div className="auth-visual-bg">
                        <div className="auth-glow auth-glow-1" />
                        <div className="auth-glow auth-glow-2" />
                    </div>
                    <div className="auth-visual-content">
                        <BrandLogo size={56} />
                        <h2>APKFlow</h2>
                        <p>Set your new password.</p>
                    </div>
                </div>
                <div className="auth-form-panel">
                    <div className="auth-form-container">
                        <div className="auth-form-header">
                            <div className="auth-step-icon auth-step-success">
                                <Lock size={32} />
                            </div>
                            <h1>New Password</h1>
                            <p>Create a strong password for your account</p>
                        </div>
                        <form onSubmit={handleForgotResetPassword} className="auth-form">
                            <div className="input-group">
                                <label>New Password</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                                        placeholder="Min. 6 characters"
                                        minLength={6}
                                        required
                                        autoFocus
                                    />
                                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Confirm Password</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                        placeholder="Repeat password"
                                        minLength={6}
                                        required
                                    />
                                </div>
                            </div>
                            {error && <div className="auth-error"><span>{error}</span></div>}
                            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                                {loading ? (
                                    <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Resetting...</>
                                ) : (
                                    <>Reset Password <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (forgotStep === 'done') {
        return (
            <div className="auth-page">
                <div className="auth-visual">
                    <div className="auth-visual-bg">
                        <div className="auth-glow auth-glow-1" />
                        <div className="auth-glow auth-glow-2" />
                    </div>
                    <div className="auth-visual-content">
                        <BrandLogo size={56} />
                        <h2>APKFlow</h2>
                        <p>Your password has been reset!</p>
                    </div>
                </div>
                <div className="auth-form-panel">
                    <div className="auth-form-container">
                        <div className="auth-form-header">
                            <div className="auth-step-icon auth-step-success">
                                <Check size={32} />
                            </div>
                            <h1>Password Reset! 🎉</h1>
                            <p>Your password has been changed successfully. You can now login with your new password.</p>
                        </div>
                        <button onClick={() => { setForgotStep(null); setError(''); setIsLogin(true); navigate('/login', { replace: true }); }} className="btn btn-primary btn-lg auth-submit">
                            Go to Login <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // OTP Verification Step (Registration)
    if (!isLogin && regStep === 'verify') {
        return (
            <div className="auth-page">
                <div className="auth-visual">
                    <div className="auth-visual-bg">
                        <div className="auth-glow auth-glow-1" />
                        <div className="auth-glow auth-glow-2" />
                    </div>
                    <div className="auth-visual-content">
                        <BrandLogo size={56} />
                        <h2>APKFlow</h2>
                        <p>Almost there! Verify your email to continue.</p>
                    </div>
                </div>
                <div className="auth-form-panel">
                    <div className="auth-form-container">
                        <div className="auth-form-header">
                            <div className="auth-step-icon">
                                <Mail size={32} />
                            </div>
                            <h1>Verify Your Email</h1>
                            <p>We've sent a 6-digit code to <strong>{formData.email}</strong></p>
                            <p className="auth-spam-tip">💡 Can't find it? Check your <strong>Spam</strong> or <strong>Junk</strong> folder.</p>
                        </div>

                        <form onSubmit={handleVerifyOTP} className="auth-form">
                            <div className="input-group">
                                <label>Verification Code</label>
                                <div className="input-wrapper">
                                    <Shield size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        value={otpCode}
                                        onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                                        placeholder="Enter 6-digit code"
                                        maxLength={6}
                                        required
                                        autoFocus
                                        style={{ letterSpacing: '4px', fontSize: '18px', fontWeight: '700', textAlign: 'center' }}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="auth-error">
                                    <span>{error}</span>
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading || otpCode.length !== 6}>
                                {loading ? (
                                    <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Verifying...</>
                                ) : (
                                    <>Verify Email <Check size={18} /></>
                                )}
                            </button>

                            <div className="auth-resend">
                                <span>Didn't receive the code? </span>
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={resendLoading || resendCooldown > 0}
                                    className="auth-switch-btn"
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resendLoading ? 'Sending...' : 'Resend Code'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Pending Approval Step
    if (!isLogin && regStep === 'pending') {
        return (
            <div className="auth-page">
                <div className="auth-visual">
                    <div className="auth-visual-bg">
                        <div className="auth-glow auth-glow-1" />
                        <div className="auth-glow auth-glow-2" />
                    </div>
                    <div className="auth-visual-content">
                        <BrandLogo size={56} />
                        <h2>APKFlow</h2>
                        <p>Your email has been verified successfully!</p>
                    </div>
                </div>
                <div className="auth-form-panel">
                    <div className="auth-form-container">
                        <div className="auth-form-header">
                            <div className="auth-step-icon auth-step-success">
                                <Clock size={32} />
                            </div>
                            <h1>Pending Approval</h1>
                            <p>Your account is waiting for admin review</p>
                        </div>

                        <div className="auth-pending-info">
                            <div className="auth-pending-card">
                                <Check size={20} className="auth-pending-check" />
                                <div>
                                    <strong>Email Verified ✅</strong>
                                    <span>{formData.email}</span>
                                </div>
                            </div>
                            <div className="auth-pending-card">
                                <Clock size={20} className="auth-pending-clock" />
                                <div>
                                    <strong>Waiting for Admin Approval</strong>
                                    <span>Your account has been submitted for review. An admin will approve it shortly.</span>
                                </div>
                            </div>
                            <div className="auth-pending-card">
                                <Mail size={20} className="auth-pending-clock" />
                                <div>
                                    <strong>Email Notification</strong>
                                    <span>You'll receive an email at <strong>{formData.email}</strong> as soon as your account is approved.</span>
                                </div>
                            </div>
                        </div>

                        <p className="auth-pending-note">
                            ⚠️ You cannot login until your account is approved by an admin. Once approved, you'll get an email and can login immediately.
                        </p>

                        <button onClick={() => { setIsLogin(true); setRegStep('form'); navigate('/login', { replace: true }); }} className="btn btn-primary btn-lg auth-submit">
                            Go to Login <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default: Login / Register Form
    return (
        <div className="auth-page">
            {/* Left Panel - Brand Visual */}
            <div className="auth-visual">
                <div className="auth-visual-bg">
                    <div className="auth-glow auth-glow-1" />
                    <div className="auth-glow auth-glow-2" />
                </div>
                <div className="auth-visual-content">
                    <BrandLogo size={56} />
                    <h2>APKFlow</h2>
                    <p>Free APK file hosting for developers & publishers.</p>

                    <div className="auth-features">
                        <div className="auth-feature">
                            <Shield size={20} />
                            <span>Secure & Encrypted</span>
                        </div>
                        <div className="auth-feature">
                            <Zap size={20} />
                            <span>Lightning Fast</span>
                        </div>
                        <div className="auth-feature">
                            <Cloud size={20} />
                            <span>5GB Free Storage</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="auth-form-panel">
                <div className="auth-form-container">
                    <div className="auth-form-header">
                        <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                        <p>{isLogin ? 'Sign in to your account to continue' : 'Start hosting your APK files for free'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {!isLogin && (
                            <div className="input-group">
                                <label>Full Name</label>
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="input-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min. 6 characters"
                                    minLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="auth-error">
                                <span>{error}</span>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                            {loading ? (
                                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing...</>
                            ) : (
                                <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
                            )}
                        </button>

                        {isLogin && (
                            <div className="auth-forgot">
                                <button type="button" onClick={() => { setForgotStep('email'); setError(''); }} className="auth-switch-btn">
                                    Forgot Password?
                                </button>
                            </div>
                        )}
                    </form>

                    <div className="auth-switch">
                        <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
                        <button onClick={toggleMode} className="auth-switch-btn">
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>

                    <p className="auth-footer-text">
                        By continuing, you agree to APKFlow's Terms of Service.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
