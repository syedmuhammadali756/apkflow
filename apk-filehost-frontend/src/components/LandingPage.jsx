import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Download, Shield, Zap, Cloud, BarChart, ArrowRight, Check, X, Users, Package, Star, Rocket, Cpu, QrCode, ChevronDown, Lock } from './Icons';
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

// FAQ Item
const FAQItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className={`faq-item ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
            <div className="faq-question">
                <span>{q}</span>
                <ChevronDown size={18} />
            </div>
            {open && <div className="faq-answer">{a}</div>}
        </div>
    );
};

const LandingPage = () => {
    const [filesCount, filesRef] = useCountUp(10000);
    const [downloadsCount, downloadsRef] = useCountUp(50000);
    const [usersCount, usersRef] = useCountUp(2500);
    const [storageCount, storageRef] = useCountUp(48);

    const features = [
        { icon: <Upload size={26} />, title: 'Drag & Drop Upload', desc: 'Drop your APK and get a link in seconds. Supports files up to 1GB.', color: '#7c3aed' },
        { icon: <Zap size={26} />, title: 'Instant Share Links', desc: 'Shareable download links ready immediately. No waiting, no hassle.', color: '#f59e0b' },
        { icon: <Shield size={26} />, title: 'Secure & Encrypted', desc: 'HTTPS everywhere. Your files travel through encrypted tunnels only.', color: '#10b981' },
        { icon: <BarChart size={26} />, title: 'Download Analytics', desc: 'Track download counts and monitor your APK distribution in real time.', color: '#06b6d4' },
        { icon: <Cloud size={26} />, title: '5GB Free Storage', desc: 'Every account gets 5GB free. No credit card, no expiry, no tricks.', color: '#8b5cf6' },
        { icon: <Cpu size={26} />, title: 'AI Smart Rename', desc: 'Our AI suggests a clean, professional name from your raw APK filename.', color: '#ec4899' },
        { icon: <QrCode size={26} />, title: 'QR Code Downloads', desc: 'Generate a QR code for any file. Perfect for sharing at events or demos.', color: '#f97316' },
        { icon: <Download size={26} />, title: 'CDN-Powered Speed', desc: 'Lightning-fast downloads powered by global CDN. Your users get files fast.', color: '#22d3ee' },
    ];

    const steps = [
        { num: '01', title: 'Create Free Account', desc: 'Sign up in seconds. No credit card required. Instant access.', icon: <Rocket size={28} /> },
        { num: '02', title: 'Upload Your APK', desc: 'Drag & drop your APK. AI suggests a clean name. One click to upload.', icon: <Upload size={28} /> },
        { num: '03', title: 'Share the Link', desc: 'Copy your unique download link or QR code and share it anywhere.', icon: <QrCode size={28} /> },
    ];

    const testimonials = [
        {
            name: 'Ahmed Raza',
            role: 'Android Developer',
            avatar: 'A',
            quote: 'I used to waste 10 minutes every build sharing APKs via Google Drive. APKFlow cut that to 30 seconds. Game changer.',
            stars: 5
        },
        {
            name: 'Sara Khan',
            role: 'QA Engineer',
            avatar: 'S',
            quote: 'My clients love it. No more "I can\'t find the download button" messages. Clean page, instant download.',
            stars: 5
        },
        {
            name: 'Usman Ali',
            role: 'Freelance Dev',
            avatar: 'U',
            quote: 'The QR code feature is brilliant. I show it at client meetings and they scan it right there. Professional and fast.',
            stars: 5
        },
    ];

    const faqs = [
        { q: 'Is APKFlow really free?', a: 'Yes, completely free. 5GB storage, unlimited downloads, no ads on download pages, no credit card required. We keep costs low with efficient infrastructure.' },
        { q: 'How do I share my APK with testers?', a: 'Upload your APK, copy the link from your dashboard, and send it via WhatsApp, Slack, or email. Your tester clicks the link and the download starts immediately — no login needed.' },
        { q: 'Is my APK safe from tampering?', a: 'Absolutely. Every file gets a checksum on upload. We verify integrity on download. HTTPS is enforced everywhere. We never modify, repackage, or inject anything into your APK.' },
        { q: 'What is the maximum file size?', a: 'Up to 1GB per file. This covers even the largest Android apps and game APKs. Your 5GB storage limit means you can host multiple large files simultaneously.' },
        { q: 'Do download links expire?', a: 'No. Your download links are permanent as long as your account is active. Unlike WeTransfer (7 days) or temporary file hosts, APKFlow links don\'t expire.' },
        { q: 'What is the AI Smart Rename feature?', a: 'When you upload a file like "com.example.myapp-v2.3.1-release.apk", our AI suggests a clean name like "MyApp v2.3.1". You can accept, edit, or ignore the suggestion.' },
    ];

    const comparison = [
        { feature: 'Free Storage', apkflow: '5 GB', drive: '15 GB (shared)', wetransfer: '2 GB limit' },
        { feature: 'Link Expiry', apkflow: 'Never', drive: 'Never', wetransfer: '7 days' },
        { feature: 'Ads on Download Page', apkflow: 'None', drive: 'None', wetransfer: 'Yes' },
        { feature: 'Direct APK Download', apkflow: '✓ Instant', drive: '✗ Scan delay', wetransfer: '✓' },
        { feature: 'Download Analytics', apkflow: '✓ Built-in', drive: '✗ None', wetransfer: '✗ None' },
        { feature: 'QR Code', apkflow: '✓ Per file', drive: '✗', wetransfer: '✗' },
        { feature: 'No Login for Downloaders', apkflow: '✓', drive: '✗ Sometimes', wetransfer: '✓' },
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
                    <div className="hero-left">
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
                            No ads. No expiry. No login required for downloaders.
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
                                {['S', 'A', 'M', 'R', 'U'].map((letter, i) => (
                                    <div key={i} className="trust-avatar" style={{ '--i': i }}>
                                        {letter}
                                    </div>
                                ))}
                            </div>
                            <div className="trust-text">
                                <div className="trust-stars">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} />)}
                                </div>
                                <span>Trusted by 2,500+ developers</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="hero-phone-mockup">
                            <div className="phone-frame">
                                <div className="phone-notch" />
                                <div className="phone-screen">
                                    <div className="phone-app-header">
                                        <div className="phone-app-logo">APKFlow</div>
                                    </div>
                                    <div className="phone-upload-area">
                                        <div className="phone-upload-icon"><Package size={28} /></div>
                                        <div className="phone-upload-text">myapp-v2.3.apk</div>
                                        <div className="phone-progress-bar">
                                            <div className="phone-progress-fill" />
                                        </div>
                                        <div className="phone-link-box">
                                            <span>apkflow.vercel.app/d/abc123</span>
                                            <div className="phone-copy-btn">Copy</div>
                                        </div>
                                    </div>
                                    <div className="phone-stats-row">
                                        <div className="phone-stat">
                                            <span className="phone-stat-num">247</span>
                                            <span className="phone-stat-lbl">Downloads</span>
                                        </div>
                                        <div className="phone-stat">
                                            <span className="phone-stat-num">12.4 MB</span>
                                            <span className="phone-stat-lbl">File Size</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="phone-glow" />
                            <div className="floating-badge badge-1">
                                <Check size={12} /> Link Copied!
                            </div>
                            <div className="floating-badge badge-2">
                                <Cpu size={12} /> AI: "MyApp v2.3"
                            </div>
                            <div className="floating-badge badge-3">
                                <Download size={12} /> New Download
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-row">
                        <div className="stat-item" ref={filesRef}>
                            <Package size={24} className="stat-icon" />
                            <span className="stat-number">{filesCount.toLocaleString()}+</span>
                            <span className="stat-text">Files Hosted</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item" ref={downloadsRef}>
                            <Download size={24} className="stat-icon" />
                            <span className="stat-number">{downloadsCount.toLocaleString()}+</span>
                            <span className="stat-text">Downloads</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item" ref={usersRef}>
                            <Users size={24} className="stat-icon" />
                            <span className="stat-number">{usersCount.toLocaleString()}+</span>
                            <span className="stat-text">Happy Users</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item" ref={storageRef}>
                            <Cloud size={24} className="stat-icon" />
                            <span className="stat-number">{storageCount}+ GB</span>
                            <span className="stat-text">Storage Served</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="section features-section" id="features">
                <div className="container">
                    <div className="section-header">
                        <div className="section-badge">Features</div>
                        <h2>Everything You Need to <span className="gradient-text">Host APK Files</span></h2>
                        <p>Powerful features designed for developers and publishers who need reliable APK distribution.</p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature, i) => (
                            <div key={i} className="feature-card glass-card" style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className="feature-icon" style={{ background: `${feature.color}18`, color: feature.color }}>
                                    {feature.icon}
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Feature Spotlight */}
            <section className="section ai-section">
                <div className="container">
                    <div className="ai-card">
                        <div className="ai-glow" />
                        <div className="ai-content">
                            <div className="ai-left">
                                <div className="ai-badge">
                                    <Cpu size={14} />
                                    <span>AI Feature</span>
                                </div>
                                <h2>Smart APK <span className="gradient-text">Rename</span></h2>
                                <p>
                                    Raw APK filenames are ugly. Our AI reads your filename and suggests a clean,
                                    professional name automatically — so your download page looks polished.
                                </p>
                                <div className="ai-example">
                                    <div className="ai-before">
                                        <span className="ai-label">Raw filename</span>
                                        <code>com.example.myapp-v2.3.1-release-unsigned.apk</code>
                                    </div>
                                    <div className="ai-arrow">→</div>
                                    <div className="ai-after">
                                        <span className="ai-label">AI Suggestion</span>
                                        <code className="ai-suggested">MyApp v2.3.1</code>
                                    </div>
                                </div>
                                <Link to="/register" className="btn btn-primary">
                                    Try It Free <ArrowRight size={16} />
                                </Link>
                            </div>
                            <div className="ai-right">
                                <div className="ai-demo-card glass-card">
                                    <div className="ai-demo-header">
                                        <Cpu size={16} />
                                        <span>AI Smart Rename</span>
                                        <span className="ai-demo-badge">Live</span>
                                    </div>
                                    <div className="ai-demo-input">
                                        <span className="ai-demo-label">Uploaded file</span>
                                        <div className="ai-demo-file">
                                            <Package size={14} /> com.drwebjr.apkflow-v1.0.0-release.apk
                                        </div>
                                    </div>
                                    <div className="ai-demo-processing">
                                        <div className="ai-dots">
                                            <span /><span /><span />
                                        </div>
                                        <span>Analyzing filename...</span>
                                    </div>
                                    <div className="ai-demo-result">
                                        <span className="ai-demo-label">Suggested name</span>
                                        <div className="ai-demo-suggestion">APKFlow v1.0.0</div>
                                        <div className="ai-demo-actions">
                                            <button className="ai-accept-btn">✓ Accept</button>
                                            <button className="ai-edit-btn">Edit</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Protected Download Links */}
            <section className="section feature-spotlight-section feature-spot-reverse">
                <div className="container">
                    <div className="feature-spot-card">
                        <div className="feature-spot-glow fsg-green" />
                        <div className="feature-spot-content">
                            <div className="feature-spot-right">
                                <div className="feature-spot-badge" style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)' }}>
                                    <Shield size={14} />
                                    <span>Security Feature</span>
                                </div>
                                <h2>Password <span className="gradient-text-green">Protected</span> Links</h2>
                                <p>
                                    Lock your APK downloads with a password. Share with only trusted testers
                                    and clients — nobody else can access your file without the secret key.
                                </p>
                                <ul className="spot-feature-list">
                                    <li><Check size={16} /> Set custom password per file</li>
                                    <li><Check size={16} /> One-click lock / unlock from dashboard</li>
                                    <li><Check size={16} /> Download attempts logged with IP</li>
                                    <li><Check size={16} /> Revoke access anytime instantly</li>
                                </ul>
                                <Link to="/register" className="btn btn-primary">
                                    Get Protected Links <ArrowRight size={16} />
                                </Link>
                            </div>
                            <div className="feature-spot-left">
                                <div className="spot-demo-card glass-card">
                                    <div className="spot-demo-header">
                                        <Shield size={16} />
                                        <span>Protected Link</span>
                                        <span className="spot-demo-badge spot-badge-green">Locked</span>
                                    </div>
                                    <div className="spot-demo-file-row">
                                        <div className="spot-demo-file-icon"><Package size={20} /></div>
                                        <div className="spot-demo-file-info">
                                            <span className="spot-file-name">MyApp v2.3.1.apk</span>
                                            <span className="spot-file-meta">12.4 MB · 3 downloads</span>
                                        </div>
                                        <div className="spot-lock-icon"><Lock size={16} /></div>
                                    </div>
                                    <div className="spot-password-section">
                                        <div className="spot-pass-label">Enter password to download</div>
                                        <div className="spot-pass-input-row">
                                            <div className="spot-pass-input">
                                                <span className="spot-pass-dots">●●●●●●●●</span>
                                            </div>
                                            <button className="spot-pass-btn">Unlock</button>
                                        </div>
                                    </div>
                                    <div className="spot-access-log">
                                        <div className="spot-log-label">Access Log</div>
                                        <div className="spot-log-row spot-log-ok"><span className="spot-log-dot green"></span><span>124.0.0.1 · Unlocked · 2min ago</span></div>
                                        <div className="spot-log-row spot-log-fail"><span className="spot-log-dot red"></span><span>Unknown · Wrong password · 5min ago</span></div>
                                        <div className="spot-log-row spot-log-ok"><span className="spot-log-dot green"></span><span>192.168.1.5 · Unlocked · 1hr ago</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* QR Code Downloads */}
            <section className="section feature-spotlight-section">
                <div className="container">
                    <div className="feature-spot-card">
                        <div className="feature-spot-glow fsg-orange" />
                        <div className="feature-spot-content">
                            <div className="feature-spot-left">
                                <div className="feature-spot-badge" style={{ color: '#f97316', borderColor: 'rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.1)' }}>
                                    <QrCode size={14} />
                                    <span>QR Feature</span>
                                </div>
                                <h2>Instant <span className="gradient-text-orange">QR Code</span> Downloads</h2>
                                <p>
                                    Every file gets a unique QR code — instantly. Perfect for sharing
                                    at client demos, team meetings, or conferences. Scan and it downloads.
                                </p>
                                <ul className="spot-feature-list">
                                    <li><Check size={16} /> Auto-generated QR for every file</li>
                                    <li><Check size={16} /> Download as PNG, share anywhere</li>
                                    <li><Check size={16} /> Works with any QR scanner app</li>
                                    <li><Check size={16} /> Also works with password protection</li>
                                </ul>
                                <Link to="/register" className="btn btn-primary">
                                    Generate Your QR <ArrowRight size={16} />
                                </Link>
                            </div>
                            <div className="feature-spot-right">
                                <div className="spot-demo-card glass-card">
                                    <div className="spot-demo-header">
                                        <QrCode size={16} />
                                        <span>QR Download</span>
                                        <span className="spot-demo-badge spot-badge-orange">Live</span>
                                    </div>
                                    <div className="qr-demo-center">
                                        <div className="qr-demo-wrap">
                                            <div className="qr-demo-grid">
                                                {[...Array(49)].map((_, i) => (
                                                    <div key={i} className={`qr-cell ${Math.random() > 0.5 ? 'filled' : ''}`} />
                                                ))}
                                            </div>
                                            <div className="qr-scan-line" />
                                        </div>
                                        <div className="qr-scan-label">
                                            <span className="qr-scan-pulse" />
                                            Scan to download
                                        </div>
                                    </div>
                                    <div className="qr-demo-stats">
                                        <div className="qr-stat-pill"><Download size={12} /> 247 scans</div>
                                        <div className="qr-stat-pill"><Zap size={12} /> Instant DL</div>
                                    </div>
                                    <div className="qr-share-row">
                                        <button className="qr-share-btn"><Download size={14} /> Save PNG</button>
                                        <button className="qr-share-btn"><ArrowRight size={14} /> Share</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Download Analytics */}
            <section className="section feature-spotlight-section feature-spot-reverse">
                <div className="container">
                    <div className="feature-spot-card">
                        <div className="feature-spot-glow fsg-cyan" />
                        <div className="feature-spot-content">
                            <div className="feature-spot-right">
                                <div className="feature-spot-badge" style={{ color: '#06b6d4', borderColor: 'rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.1)' }}>
                                    <BarChart size={14} />
                                    <span>Analytics</span>
                                </div>
                                <h2>Live Download <span className="gradient-text-cyan">Analytics</span></h2>
                                <p>
                                    Know exactly who downloaded your APK, when, and from where.
                                    Real-time stats help you track distribution and measure reach.
                                </p>
                                <ul className="spot-feature-list">
                                    <li><Check size={16} /> Real-time download counter</li>
                                    <li><Check size={16} /> Geo-location breakdown by region</li>
                                    <li><Check size={16} /> Daily download trend chart</li>
                                    <li><Check size={16} /> Recent activity feed with timestamps</li>
                                </ul>
                                <Link to="/register" className="btn btn-primary">
                                    See Your Analytics <ArrowRight size={16} />
                                </Link>
                            </div>
                            <div className="feature-spot-left">
                                <div className="spot-demo-card glass-card analytics-demo-card">
                                    <div className="spot-demo-header">
                                        <BarChart size={16} />
                                        <span>Analytics · MyApp v2.3.1</span>
                                        <span className="spot-demo-badge spot-badge-cyan">Live</span>
                                    </div>
                                    <div className="analytics-demo-stats">
                                        <div className="analytics-stat-tile">
                                            <span className="ast-num">247</span>
                                            <span className="ast-lbl">Total Downloads</span>
                                        </div>
                                        <div className="analytics-stat-tile">
                                            <span className="ast-num" style={{ color: '#10b981' }}>+18</span>
                                            <span className="ast-lbl">Today</span>
                                        </div>
                                        <div className="analytics-stat-tile">
                                            <span className="ast-num" style={{ color: '#f59e0b' }}>3</span>
                                            <span className="ast-lbl">Countries</span>
                                        </div>
                                    </div>
                                    <div className="analytics-chart-label">Downloads — last 7 days</div>
                                    <div className="analytics-bar-chart">
                                        {[
                                            { day: 'Mon', val: 22, h: 30 },
                                            { day: 'Tue', val: 38, h: 52 },
                                            { day: 'Wed', val: 15, h: 20 },
                                            { day: 'Thu', val: 55, h: 75 },
                                            { day: 'Fri', val: 47, h: 64 },
                                            { day: 'Sat', val: 33, h: 45 },
                                            { day: 'Sun', val: 18, h: 25 },
                                        ].map((d, i) => (
                                            <div key={i} className="abc-wrap">
                                                <div className="abc-tooltip">{d.val}</div>
                                                <div className="abc-bar" style={{ height: `${d.h}%`, animationDelay: `${i * 0.07}s` }} />
                                                <span className="abc-label">{d.day}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="analytics-geo">
                                        <div className="geo-label">Top Regions</div>
                                        {[
                                            { name: 'Pakistan', pct: 68, color: '#7c3aed' },
                                            { name: 'India', pct: 20, color: '#06b6d4' },
                                            { name: 'Other', pct: 12, color: '#f59e0b' },
                                        ].map((g, i) => (
                                            <div key={i} className="geo-row">
                                                <span className="geo-name">{g.name}</span>
                                                <div className="geo-bar">
                                                    <div className="geo-fill" style={{ width: `${g.pct}%`, background: g.color, animationDelay: `${i * 0.15 + 0.3}s` }} />
                                                </div>
                                                <span className="geo-pct">{g.pct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}

            <section className="section how-section" id="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <div className="section-badge">Simple</div>
                        <h2>How It <span className="gradient-text">Works</span></h2>
                        <p>Get started in three simple steps. It takes less than a minute.</p>
                    </div>

                    <div className="steps-grid">
                        {steps.map((step, i) => (
                            <div key={i} className="step-card">
                                <div className="step-icon-wrap">{step.icon}</div>
                                <div className="step-number">{step.num}</div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                                {i < steps.length - 1 && <div className="step-arrow">→</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="section comparison-section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-badge">Comparison</div>
                        <h2>APKFlow vs <span className="gradient-text">The Alternatives</span></h2>
                        <p>See why developers switch from Google Drive and WeTransfer.</p>
                    </div>
                    <div className="comparison-table-wrap">
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th>Feature</th>
                                    <th className="col-apkflow">
                                        <span className="col-badge">APKFlow</span>
                                    </th>
                                    <th>Google Drive</th>
                                    <th>WeTransfer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparison.map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.feature}</td>
                                        <td className="col-apkflow apkflow-val">{row.apkflow}</td>
                                        <td className="other-val">{row.drive}</td>
                                        <td className="other-val">{row.wetransfer}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="section testimonials-section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-badge">Reviews</div>
                        <h2>Loved by <span className="gradient-text">Developers</span></h2>
                        <p>Real feedback from developers who use APKFlow every day.</p>
                    </div>
                    <div className="testimonials-grid">
                        {testimonials.map((t, i) => (
                            <div key={i} className="testimonial-card glass-card">
                                <div className="testimonial-stars">
                                    {[...Array(t.stars)].map((_, j) => <Star key={j} size={14} />)}
                                </div>
                                <p className="testimonial-quote">"{t.quote}"</p>
                                <div className="testimonial-author">
                                    <div className="testimonial-avatar">{t.avatar}</div>
                                    <div>
                                        <div className="testimonial-name">{t.name}</div>
                                        <div className="testimonial-role">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing / Plans */}
            <section className="section pricing-section" id="pricing">
                <div className="container">
                    <div className="section-header">
                        <div className="section-badge">Pricing</div>
                        <h2>Choose Your <span className="gradient-text">Plan</span></h2>
                        <p>Start free, upgrade when you need more power.</p>
                    </div>

                    <div className="pricing-grid">
                        {/* Free Plan */}
                        <div className="pricing-card glass-card pricing-free">
                            <h3>Free</h3>
                            <div className="pricing-amount">
                                <span className="price">₨0</span>
                                <span className="period">/month</span>
                            </div>
                            <ul className="pricing-features">
                                <li><Check size={16} /> 1 File Upload</li>
                                <li><Check size={16} /> 5 GB Storage</li>
                                <li><Check size={16} /> Unlimited Downloads</li>
                                <li><Check size={16} /> Instant Download Links</li>
                                <li><Check size={16} /> Download Analytics</li>
                                <li><Check size={16} /> QR Code per File</li>
                                <li><Check size={16} /> AI Smart Rename</li>
                                <li className="feature-excluded"><X size={16} /> Protected Download Links</li>
                            </ul>
                            <Link to="/register" className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
                                Start Free
                                <ArrowRight size={18} />
                            </Link>
                        </div>

                        {/* Starter Plan */}
                        <div className="pricing-card glass-card pricing-starter">
                            <div className="pricing-badge">Most Popular</div>
                            <div className="pricing-limited-badge"><Zap size={14} /> Limited Time Offer</div>
                            <h3>Starter</h3>
                            <div className="pricing-amount">
                                <span className="price">₨1,000</span>
                                <span className="period">/month</span>
                            </div>
                            <ul className="pricing-features">
                                <li><Check size={16} /> 3 File Uploads</li>
                                <li><Check size={16} /> 5 GB Storage</li>
                                <li><Check size={16} /> Unlimited Downloads</li>
                                <li><Check size={16} /> Instant Download Links</li>
                                <li><Check size={16} /> Download Analytics</li>
                                <li><Check size={16} /> QR Code per File</li>
                                <li><Check size={16} /> AI Smart Rename</li>
                                <li><Check size={16} /> Protected Download Links</li>
                                <li><Check size={16} /> No Ads on Download Pages</li>
                                <li><Check size={16} /> Links Never Expire</li>
                            </ul>
                            <Link to="/register" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                Get Starter
                                <ArrowRight size={18} />
                            </Link>
                        </div>

                        {/* Pro Plan (Blurred / Coming Soon) */}
                        <div className="pricing-card glass-card pricing-pro">
                            <div className="pricing-coming-soon-overlay">
                                <span className="coming-soon-badge"><Rocket size={14} /> Coming Soon</span>
                            </div>
                            <div className="pricing-pro-blur">
                                <h3>Pro</h3>
                                <div className="pricing-amount">
                                    <span className="price">₨???</span>
                                    <span className="period">/month</span>
                                </div>
                                <ul className="pricing-features">
                                    <li><Check size={16} /> Unlimited File Uploads</li>
                                    <li><Check size={16} /> 10 GB Storage</li>
                                    <li><Check size={16} /> Unlimited Downloads</li>
                                    <li><Check size={16} /> All Starter Features</li>
                                    <li><Check size={16} /> Priority Support</li>
                                    <li><Check size={16} /> Custom Branding</li>
                                    <li><Check size={16} /> API Access</li>
                                </ul>
                                <button className="btn btn-secondary btn-lg" style={{ width: '100%' }} disabled>
                                    Coming Soon
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="section faq-section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-badge">FAQ</div>
                        <h2>Frequently Asked <span className="gradient-text">Questions</span></h2>
                        <p>Everything you need to know about APKFlow.</p>
                    </div>
                    <div className="faq-list">
                        {faqs.map((faq, i) => (
                            <FAQItem key={i} q={faq.q} a={faq.a} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <div className="cta-glow" />
                        <div className="cta-badge">
                            <Rocket size={14} /> Ready to start?
                        </div>
                        <h2>Host Your APK Files Today</h2>
                        <p>Join thousands of developers using APKFlow for reliable, fast, and free APK distribution.</p>
                        <div className="cta-actions">
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Create Free Account
                                <ArrowRight size={18} />
                            </Link>
                            <Link to="/blog" className="btn btn-secondary btn-lg">
                                Read the Blog
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
