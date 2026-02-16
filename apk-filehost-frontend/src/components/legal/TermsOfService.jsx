import React from 'react';
import { Shield, FileText, AlertTriangle, CheckCircle, HelpCircle } from '../Icons';
import './Legal.css';

const TermsOfService = () => {
    return (
        <div className="legal-page">
            <div className="legal-container">
                <div className="legal-header">
                    <h1>Terms <span className="gradient-text">of Service</span></h1>
                    <p className="legal-updated">Last Updated: February 15, 2026</p>
                </div>

                <div className="legal-content">
                    <div className="legal-glow" />

                    <div className="legal-section">
                        <h2><FileText size={24} className="text-primary" /> 1. Agreement to Terms</h2>
                        <p>
                            These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf
                            of an entity ("you") and APKFlow ("we," "us" or "our"), concerning your access to and use of the
                            https://apkflow.com website as well as any other media form, media channel, mobile website or mobile
                            application related, linked, or otherwise connected thereto (collectively, the "Site").
                        </p>
                        <p>
                            You agree that by accessing the Site, you have read, understood, and agree to be bound by all of these
                            Terms of Service. If you do not agree with all of these terms of service, then you are expressly prohibited
                            from using the Site and you must discontinue use immediately.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h2><Shield size={24} className="text-primary" /> 2. Intellectual Property Rights</h2>
                        <p>
                            Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality,
                            software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content")
                            and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or
                            licensed to us, and are protected by copyright and trademark laws.
                        </p>
                        <p>
                            The Content and the Marks are provided on the Site "AS IS" for your information and personal use only.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h2><AlertTriangle size={24} className="text-primary" /> 3. User Representations & Prohibited Activities</h2>
                        <p>
                            By using the Site, you represent and warrant that: (1) all registration information you submit will be true,
                            accurate, current, and complete; (2) you will maintain the accuracy of such information; (3) you have the legal
                            capacity and you agree to comply with these Terms of Service.
                        </p>
                        <p>
                            You may not access or use the Site for any purpose other than that for which we make the Site available.
                            The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
                        </p>
                        <ul>
                            <li>Systematically retrieve data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
                            <li>Make any unauthorized use of the Site, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email.</li>
                            <li>Circumvent, disable, or otherwise interfere with security-related features of the Site.</li>
                            <li>Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material, including excessive use of capital letters and spamming (continuous posting of repetitive text), that interferes with any party’s uninterrupted use and enjoyment of the Site.</li>
                            <li>Upload copyrighted material without the express permission of the copyright holder.</li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h2><CheckCircle size={24} className="text-primary" /> 4. User Generated Contributions</h2>
                        <p>
                            The Site may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other
                            functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform,
                            publish, distribute, or broadcast content and materials to us or on the Site, including but not limited to text,
                            writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material
                            (collectively, "Contributions").
                        </p>
                        <p>
                            Contributions may be viewable by other users of the Site and through third-party websites. As such, any Contributions
                            you transmit may be treated as non-confidential and non-proprietary.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h2><HelpCircle size={24} className="text-primary" /> 5. Contact Us</h2>
                        <p>
                            In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site,
                            please contact us at apkflow.vercel.app@gmail.com.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
