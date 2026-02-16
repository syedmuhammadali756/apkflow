import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Download, Shield, Zap, Cloud, BarChart, ArrowRight, Check, Users, Package, Star, Rocket } from './Icons';
import './LandingPage.css';

// Animated counter hook
const useCountUp = (end, duration = 2000) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!visible) return;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [visible, end, duration]);

    return [count, ref];
};

const LandingPage = () => {
    const [filesCount, filesRef] = useCountUp(10000);
    const [downloadsCount, downloadsRef] = useCountUp(50000);
    const [usersCount, usersRef] = useCountUp(2500);

    const features = [
        { icon: <Upload size={28} />, title: 'Easy Upload', desc: 'Drag & drop your APK files. Upload up to 1GB per file with instant processing.' },
        { icon: <Zap size={28} />, title: 'Instant Links', desc: 'Get shareable download links immediately after upload. No waiting, no hassle.' },
        { icon: <Shield size={28} />, title: 'Secure Storage', desc: 'Your files are protected with enterprise-grade security and encrypted transfers.' },
        { icon: <BarChart size={28} />, title: 'Analytics', desc: 'Track download counts, monitor traffic, and understand your audience.' },
        { icon: <Cloud size={28} />, title: '5GB Free Storage', desc: 'Every user gets 5GB of free storage. More than enough for most use cases.' },
        { icon: <Download size={28} />, title: 'Fast Downloads', desc: 'Lightning-fast CDN-powered downloads. Your users get files in seconds.' },
    ];

    const steps = [
        { num: '01', title: 'Create Account', desc: 'Sign up for free in seconds. No credit card required.' },
        { num: '02', title: 'Upload Your APK', desc: 'Drag & drop your APK file or click to browse. We handle the rest.' },
        { num: '03', title: 'Share the Link', desc: 'Copy your unique download link and share it anywhere.' },
    ];

    return (
        <div className="landing">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-glow hero-glow-1" />
                    <div className="hero-glow hero-glow-2" />
                    <div className="hero-grid" />
                </div>

                <div className="container hero-content">
                    <div className="hero-badge">
                        <Rocket size={14} />
                        <span>Free APK Hosting Platform</span>
                    </div>

                    <h1 className="hero-title">
                        Host Your APK Files
                        <br />
                        <span className="gradient-text">Fast, Free & Secure</span>
                    </h1>

                    <p className="hero-subtitle">
                        Upload your Android APK files and get instant download links.
                        Professional file hosting built for developers and publishers.
                    </p>

                    <div className="hero-actions">
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Get Started Free
                            <ArrowRight size={18} />
                        </Link>
                        <Link to="/about" className="btn btn-secondary btn-lg">
                            Learn More
                        </Link>
                    </div>

                    <div className="hero-trust">
                        <div className="trust-avatars">
                            {['S', 'A', 'M', 'R'].map((letter, i) => (
                                <div key={i} className="trust-avatar" style={{ '--i': i }}>
                                    {letter}
                                </div>
                            ))}
                        </div>
                        <div className="trust-text">
                            <div className="trust-stars">
                                {[...Array(5)].map((_, i) => <Star key={i} size={14} />)}
                            </div>
                            <span>Trusted by 2,500+ users</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-row">
                        <div className="stat-item" ref={filesRef}>
                            <span className="stat-number">{filesCount.toLocaleString()}+</span>
                            <span className="stat-text">Files Hosted</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item" ref={downloadsRef}>
                            <span className="stat-number">{downloadsCount.toLocaleString()}+</span>
                            <span className="stat-text">Downloads</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item" ref={usersRef}>
                            <span className="stat-number">{usersCount.toLocaleString()}+</span>
                            <span className="stat-text">Happy Users</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="section features-section" id="features">
                <div className="container">
                    <div className="section-header">
                        <h2>Everything You Need to <span className="gradient-text">Host APK Files</span></h2>
                        <p>Powerful features designed for developers and publishers who need reliable APK distribution.</p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature, i) => (
                            <div key={i} className="feature-card glass-card" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="feature-icon">{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="section how-section" id="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <h2>How It <span className="gradient-text">Works</span></h2>
                        <p>Get started in three simple steps. It takes less than a minute.</p>
                    </div>

                    <div className="steps-grid">
                        {steps.map((step, i) => (
                            <div key={i} className="step-card">
                                <div className="step-number">{step.num}</div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                                {i < steps.length - 1 && <div className="step-connector" />}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing / Free Tier */}
            <section className="section pricing-section" id="pricing">
                <div className="container">
                    <div className="section-header">
                        <h2>Simple & <span className="gradient-text">Free</span> Pricing</h2>
                        <p>Everything you need, completely free. No hidden charges.</p>
                    </div>

                    <div className="pricing-card glass-card">
                        <div className="pricing-badge">Most Popular</div>
                        <h3>Free Forever</h3>
                        <div className="pricing-amount">
                            <span className="price">$0</span>
                            <span className="period">/month</span>
                        </div>
                        <ul className="pricing-features">
                            <li><Check size={16} /> 5 GB Storage</li>
                            <li><Check size={16} /> Unlimited Downloads</li>
                            <li><Check size={16} /> Instant Download Links</li>
                            <li><Check size={16} /> Download Analytics</li>
                            <li><Check size={16} /> Secure File Hosting</li>
                            <li><Check size={16} /> No Ads on Download Pages</li>
                        </ul>
                        <Link to="/register" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                            Start Free
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <div className="cta-glow" />
                        <h2>Ready to Host Your APK Files?</h2>
                        <p>Join thousands of developers using APKFlow for reliable APK distribution.</p>
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Create Free Account
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
