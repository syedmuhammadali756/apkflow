import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo, Mail, Globe, Heart, Facebook, Linkedin, Instagram } from './Icons';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="footer-inner container">
                <div className="footer-grid">
                    {/* Brand */}
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <BrandLogo size={40} />
                            <span className="brand-name">APKFlow</span>
                        </div>
                        <p className="footer-tagline">
                            Free, fast, and secure APK file hosting. Upload your files and get instant download links.
                        </p>
                        <div className="footer-social">
                            <a href="/" className="social-link" aria-label="Website">
                                <Globe size={18} />
                            </a>
                            <a href="mailto:apkflow.vercel.app@gmail.com" className="social-link" aria-label="Email">
                                <Mail size={18} />
                            </a>
                            <a href="https://www.facebook.com/SyedMuhammadAli.DrWebJr/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                                <Facebook size={18} />
                            </a>
                            <a href="https://pk.linkedin.com/in/syed-muhammad-abubaker-dr-web-jr" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                                <Linkedin size={18} />
                            </a>
                            <a href="https://www.instagram.com/syedmuhammadabubaker.drwebjr/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                                <Instagram size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-links">
                        <h4>Product</h4>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/register">Get Started</Link></li>
                            <li><Link to="/blog">Blog</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                        </ul>
                    </div>

                    {/* Features */}
                    {/* Features */}
                    <div className="footer-links">
                        <h4>Features</h4>
                        <ul>
                            <li><a href="/#features">APK Hosting</a></li>
                            <li><a href="/#how-it-works">Instant Links</a></li>
                            <li><a href="/#features">Download Tracking</a></li>
                            <li><a href="/#pricing">Free Plan</a></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="footer-newsletter">
                        <h4>Stay Updated</h4>
                        <p>Get the latest news and updates from APKFlow.</p>
                        <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Thanks for subscribing!'); }}>
                            <input type="email" placeholder="Enter your email" required />
                            <button type="submit" className="btn btn-primary btn-sm">Subscribe</button>
                        </form>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2026 APKFlow. All rights reserved.</p>
                    <div className="footer-legal-links">
                        <Link to="/privacy">Privacy</Link>
                        <Link to="/terms">Terms</Link>
                        <Link to="/dmca">DMCA</Link>
                    </div>
                    <p className="made-with">
                        Made with <Heart size={14} className="heart-icon" /> by Dr Web Jr.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
