import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrandLogo, Mail, Lock, User, Eye, EyeOff, ArrowRight, Shield, Zap, Cloud } from './Icons';
import './Auth.css';

const Auth = ({ mode = 'login' }) => {
    const [isLogin, setIsLogin] = useState(mode === 'login');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login, register } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let result;
            if (isLogin) {
                result = await login(formData.email, formData.password);
            } else {
                if (!formData.name) { setError('Name is required'); setLoading(false); return; }
                result = await register(formData.name, formData.email, formData.password);
            }
            if (result && !result.success) setError(result.message);
            else navigate('/dashboard');
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        navigate(isLogin ? '/register' : '/login', { replace: true });
    };

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
