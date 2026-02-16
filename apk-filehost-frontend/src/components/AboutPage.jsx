import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo, Shield, Zap, Heart, Users, ArrowRight, Globe, Mail, Star, Facebook, Linkedin, Instagram } from './Icons';
import './AboutPage.css';
import myPhoto from '../assets/My-Photo.png';

const AboutPage = () => {
    const values = [
        { icon: <Shield size={24} />, title: 'Security First', desc: 'Every file is scanned and served over encrypted connections.' },
        { icon: <Zap size={24} />, title: 'Speed Matters', desc: 'Optimized infrastructure ensures lightning-fast uploads and downloads.' },
        { icon: <Heart size={24} />, title: 'User Focused', desc: 'Built with developers in mind, every feature serves a real need.' },
        { icon: <Globe size={24} />, title: 'Accessible', desc: 'Free for everyone. No credit card. No hidden fees. Just upload and share.' },
    ];

    const techStack = [
        { name: 'React', desc: 'Frontend UI Framework' },
        { name: 'Node.js', desc: 'Backend Runtime' },
        { name: 'Express', desc: 'API Framework' },
        { name: 'MongoDB', desc: 'Database' },
        { name: 'Vite', desc: 'Build Tool' },
        { name: 'JWT', desc: 'Authentication' },
    ];

    return (
        <div className="about-page">
            {/* Hero */}
            <section className="about-hero">
                <div className="container">
                    <div className="about-hero-content">
                        <BrandLogo size={64} />
                        <h1>About <span className="gradient-text">APKFlow</span></h1>
                        <p>
                            We're on a mission to make APK file hosting simple, free, and accessible for every developer and publisher around the world.
                        </p>
                    </div>
                </div>
            </section>

            {/* Story */}
            <section className="section">
                <div className="container">
                    <div className="story-grid">
                        <div className="story-content">
                            <h2>Our <span className="gradient-text">Story</span></h2>
                            <p>
                                APKFlow was born from a simple frustration: hosting APK files shouldn't be
                                complicated or expensive. As developers ourselves, we knew there had to be a better way.
                            </p>
                            <p>
                                We built APKFlow to be the tool we always wanted — a clean, fast, and reliable
                                platform where you can upload your APK files and get instant download links. No ads,
                                no hassle, no hidden costs.
                            </p>
                            <p>
                                Today, thousands of developers trust APKFlow for their APK distribution needs.
                                And we're just getting started.
                            </p>
                        </div>
                        <div className="story-stats-grid">
                            <div className="story-stat glass-card">
                                <span className="story-stat-value gradient-text">10K+</span>
                                <span className="story-stat-label">Files Hosted</span>
                            </div>
                            <div className="story-stat glass-card">
                                <span className="story-stat-value gradient-text">50K+</span>
                                <span className="story-stat-label">Downloads</span>
                            </div>
                            <div className="story-stat glass-card">
                                <span className="story-stat-value gradient-text">2.5K+</span>
                                <span className="story-stat-label">Users</span>
                            </div>
                            <div className="story-stat glass-card">
                                <span className="story-stat-value gradient-text">99.9%</span>
                                <span className="story-stat-label">Uptime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="section values-section">
                <div className="container">
                    <div className="section-header">
                        <h2>What We <span className="gradient-text">Believe In</span></h2>
                        <p>Our core values drive every decision we make.</p>
                    </div>
                    <div className="values-grid">
                        {values.map((value, i) => (
                            <div key={i} className="value-card glass-card">
                                <div className="value-icon">{value.icon}</div>
                                <h3>{value.title}</h3>
                                <p>{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Founder */}
            <section className="section founder-section">
                <div className="container">

                    <div className="founder-card glass-card">
                        <div className="founder-avatar">
                            <img
                                src={myPhoto}
                                alt="Dr Web Jr."
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                            />
                        </div>
                        <div className="founder-info">
                            <h3>Dr Web Jr.</h3>
                            <p className="founder-role">Founder & Developer</p>
                            <p className="founder-bio">
                                Passionate developer dedicated to building tools that make the web a better place.
                                APKFlow is committed to providing free, reliable, and secure file hosting solutions
                                for the developer community.
                            </p>
                            <div className="founder-links">
                                <a href="https://www.facebook.com/SyedMuhammadAli.DrWebJr/" target="_blank" rel="noopener noreferrer" className="social-link"><Facebook size={16} /></a>
                                <a href="https://pk.linkedin.com/in/syed-muhammad-abubaker-dr-web-jr" target="_blank" rel="noopener noreferrer" className="social-link"><Linkedin size={16} /></a>
                                <a href="https://www.instagram.com/syedmuhammadabubaker.drwebjr/" target="_blank" rel="noopener noreferrer" className="social-link"><Instagram size={16} /></a>
                                <a href="mailto:syedmuhammadalibukhari756@gmail.com" className="social-link"><Mail size={16} /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <h2>Built With Modern <span className="gradient-text">Technology</span></h2>
                        <p>We use cutting-edge tools to deliver the best experience.</p>
                    </div>
                    <div className="tech-grid">
                        {techStack.map((tech, i) => (
                            <div key={i} className="tech-card glass-card">
                                <h4>{tech.name}</h4>
                                <p>{tech.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <div className="cta-glow" />
                        <h2>Join the APKFlow Community</h2>
                        <p>Start hosting your APK files today. It's free, fast, and secure.</p>
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Get Started Free <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
