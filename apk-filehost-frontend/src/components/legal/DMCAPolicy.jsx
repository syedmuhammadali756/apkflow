import React from 'react';
import { Shield, Mail, FileText, AlertTriangle } from '../Icons';
import './Legal.css';

const DMCAPolicy = () => {
    return (
        <div className="legal-page">
            <div className="legal-container">
                <div className="legal-header">
                    <h1>DMCA <span className="gradient-text">Policy</span></h1>
                    <p className="legal-updated">Last Updated: February 15, 2026</p>
                </div>

                <div className="legal-content">
                    <div className="legal-glow" />

                    <div className="legal-section">
                        <h2><Shield size={24} className="text-primary" /> Copyright Infringement Notification</h2>
                        <p>
                            APKFlow respects the intellectual property rights of others and expects its users to do the same.
                            In accordance with the Digital Millennium Copyright Act of 1998, the text of which may be found on the
                            U.S. Copyright Office website at http://www.copyright.gov/legislation/dmca.pdf, APKFlow will respond
                            expeditiously to claims of copyright infringement committed using the APKFlow service and/or the APKFlow website
                            (the "Site") if such claims are reported to APKFlow's Designated Copyright Agent identified in the sample notice below.
                        </p>
                    </div>

                    <div className="legal-section">
                        <h2><FileText size={24} className="text-primary" /> Filing a DMCA Notice</h2>
                        <p>
                            If you are a copyright owner, authorized to act on behalf of one, or authorized to act under any exclusive right
                            under copyright, please report alleged copyright infringements taking place on or through the Site by completing
                            the following DMCA Notice of Alleged Infringement and delivering it to APKFlow's Designated Copyright Agent.
                            Upon receipt of Notice as described below, APKFlow will take whatever action, in its sole discretion, it deems
                            appropriate, including removal of the challenged use from the Site and/or termination of the APKFlow user's account
                            in appropriate circumstances.
                        </p>
                        <ul>
                            <li>Identify the copyrighted work that you claim has been infringed, or - if multiple copyrighted works are covered by this Notice - you may provide a representative list of the copyrighted works that you claim have been infringed.</li>
                            <li>Identify the material or link you claim is infringing (or the subject of infringing activity) and that access to which is to be disabled, including at a minimum, if applicable, the URL of the link shown on the Site.</li>
                            <li>Provide your mailing address, telephone number, and, if available, email address.</li>
                            <li>Include both of the following statements in the body of the Notice:</li>
                            <ul>
                                <li>"I hereby state that I have a good faith belief that the disputed use of the copyrighted material is not authorized by the copyright owner, its agent, or the law (e.g., as a fair use)."</li>
                                <li>"I hereby state that the information in this Notice is accurate and, under penalty of perjury, that I am the owner, or authorized to act on behalf of the owner, of the copyright or of an exclusive right under the copyright that is allegedly infringed."</li>
                            </ul>
                            <li>Provide your full legal name and your electronic or physical signature.</li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h2><AlertTriangle size={24} className="text-primary" /> Counter-Notice</h2>
                        <p>
                            If you believe that your content that was removed (or to which access was disabled) is not infringing, or that you have
                            the authorization from the copyright owner, the copyright owner's agent, or pursuant to the law, to post and use the
                            material in your content, you may send a counter-notice containing the following information to the Copyright Agent:
                        </p>
                        <ul>
                            <li>Your physical or electronic signature.</li>
                            <li>Identification of the content that has been removed or to which access has been disabled and the location at which the content appeared before it was removed or disabled.</li>
                            <li>A statement that you have a good faith belief that the content was removed or disabled as a result of mistake or a misidentification of the content.</li>
                            <li>Your name, address, telephone number, and email address, a statement that you consent to the jurisdiction of the federal court in [Jurisdiction], and a statement that you will accept service of process from the person who provided notification of the alleged infringement.</li>
                        </ul>
                    </div>

                    <div className="legal-section">
                        <h2><Mail size={24} className="text-primary" /> Contact Designated Agent</h2>
                        <p>
                            All DMCA notices should be sent to our designated agent at:
                        </p>
                        <p><strong>Email:</strong> apkflow.vercel.app@gmail.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DMCAPolicy;
