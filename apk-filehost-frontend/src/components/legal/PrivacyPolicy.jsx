import React from 'react';
import { Shield, Lock, Eye, Cloud, Database, Mail } from '../Icons';
import './Legal.css';

const PrivacyPolicy = () => {
    return (
        <div className="legal-page">
            <div className="legal-container">
                <div className="legal-header">
                    <h1>Privacy <span className="gradient-text">Policy</span></h1>
                    <p className="legal-updated">Last Updated: February 15, 2026</p>
                </div>

                <div className="legal-content">
                    <div className="legal-glow" />

                    <div className="legal-section">
                        <h2><Shield size={24} className="text-primary" /> Introduction</h2>
                        <p>
                            Welcome to APKFlow ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
                            If you have any questions or concerns about our policy, or our practices with regards to your personal information,
                            please contact us at apkflow.vercel.app@gmail.com.
                        </p>
                        <p>
                            When you visit our website (https://apkflow.com), and use our services, you trust us with your personal information.
                            We take your privacy very seriously. In this privacy policy, we seek to explain to you in the clearest way possible
                            what information we collect, how we use it, and what rights you have in relation to it.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h2><Database size={24} className="text-primary" /> Information We Collect</h2>
                        <p>
                            We collect personal information that you voluntarily provide to us when expressing an interest in obtaining information
                            about us or our products and services, when participating in activities on the Services (such as posting messages in
                            our online forums or entering competitions, contests or giveaways) or otherwise contacting us.
                        </p>
                        <ul>
                            <li><strong>Personal Information Provided by You:</strong> We collect names; email addresses; passwords; and other similar information.</li>
                            <li><strong>Credentials:</strong> We collect passwords, password hints, and similar security information used for authentication and account access.</li>
                            <li><strong>IP Address:</strong> We collect and store your IP address during account registration to prevent abuse and enforce our one-account-per-user policy.</li>
                            <li><strong>Device Fingerprint:</strong> We generate a non-identifying browser fingerprint (based on screen resolution, timezone, and browser characteristics) to prevent duplicate account creation from the same device.</li>
                            <li><strong>Payment Data:</strong> We do NOT collect payment data as our current services are free.</li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h2><Eye size={24} className="text-primary" /> Automatically Collected Information</h2>
                        <p>
                            We automatically collect certain information when you visit, use or navigate the Services. This information does not
                            reveal your specific identity (like your name or contact information) but may include device and usage information,
                            such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs,
                            device name, country, location, information about how and when you use our Services and other technical information.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h2><Cloud size={24} className="text-primary" /> How We Use Your Information</h2>
                        <p>
                            We use personal information collected via our Services for a variety of business purposes described below.
                            We process your personal information for these purposes in reliance on our legitimate business interests,
                            in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
                        </p>
                        <ul>
                            <li><strong>To facilitate account creation and logon process.</strong></li>
                            <li><strong>To send you administrative information.</strong> We may use your personal information to send you product, service and new feature information and/or information about changes to our terms, conditions, and policies.</li>
                            <li><strong>To protect our Services.</strong> We may use your information as part of our efforts to keep our Services safe and secure (for example, for fraud monitoring and prevention).</li>
                            <li><strong>To enforce our terms, conditions and policies.</strong></li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h2><Lock size={24} className="text-primary" /> Data Security</h2>
                        <p>
                            We have implemented appropriate technical and organizational security measures designed to protect the security of any
                            personal information we process. However, please also remember that we cannot guarantee that the internet itself is
                            100% secure. Although we will do our best to protect your personal information, transmission of personal information
                            to and from our Services is at your own risk. You should only access the services within a secure environment.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h2><Mail size={24} className="text-primary" /> Contact Us</h2>
                        <p>
                            If you have questions or comments about this policy, you may email us at apkflow.vercel.app@gmail.com.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
