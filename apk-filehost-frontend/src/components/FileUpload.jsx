import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Upload, Package, X, Check, Copy, Cloud, Globe, Shield, Cpu, Lock, Zap } from './Icons';

// AI Smart Rename: extract clean name from APK filename
const suggestApkName = (filename) => {
    // Remove .apk extension
    let name = filename.replace(/\.apk$/i, '');
    // Extract version (e.g., v1.2.3, 1.2.3, -v2.3.1)
    const versionMatch = name.match(/[-_]v?(\d+\.\d+(?:\.\d+)?(?:\.\d+)?)/i);
    const version = versionMatch ? versionMatch[1] : null;
    // Remove common suffixes
    name = name.replace(/[-_](release|debug|unsigned|signed|final|prod|staging|qa|test|v?\d+\.\d+(?:\.\d+)?(?:\.\d+)?)/gi, '');
    // Remove package prefix (com.example.app -> app)
    if (name.includes('.')) {
        const parts = name.split('.');
        name = parts[parts.length - 1];
    }
    // Remove remaining separators and capitalize
    name = name.replace(/[-_]+/g, ' ').trim();
    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    if (!name || name.length < 2) return null;
    return version ? `${name} v${version}` : name;
};
import './FileUpload.css';

const FileUpload = ({ onUploadSuccess, fileCount = 0, userPlan = 'free' }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [uploadedLink, setUploadedLink] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [copied, setCopied] = useState(false);
    const [customName, setCustomName] = useState('');
    const [brandName, setBrandName] = useState('');
    const [allowedDomain, setAllowedDomain] = useState('');
    const [isDomainLocked, setIsDomainLocked] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [aiDismissed, setAiDismissed] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Limits
    const planLimits = { free: 1, starter: 3, pro: 999 };
    const MAX_UPLOADS = planLimits[userPlan] || 1;
    const uploadsRemaining = Math.max(0, MAX_UPLOADS - fileCount);

    const fileInputRef = useRef(null);
    const { API_URL } = useAuth();

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (uploadsRemaining <= 0) {
            if (userPlan === 'free') setShowUpgradeModal(true);
            else setError(`Upload limit reached for ${userPlan} plan. Please delete a file first.`);
            return;
        }
        if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
    };

    const handleFileSelect = (selectedFile) => {
        setError('');
        if (uploadsRemaining <= 0) {
            if (userPlan === 'free') setShowUpgradeModal(true);
            else setError(`Upload limit reached for ${userPlan} plan. Please delete a file first.`);
            return;
        }

        setUploadedLink('');
        setCopied(false);
        if (!selectedFile.name.endsWith('.apk')) { setError('Only APK files are allowed'); return; }
        const maxSize = 1024 * 1024 * 1024; // 1GB with Tebi.io
        if (selectedFile.size > maxSize) { setError('File size must be less than 1GB'); return; }
        setFile(selectedFile);
        // AI Smart Rename
        const suggestion = suggestApkName(selectedFile.name);
        setAiSuggestion(suggestion);
        setAiDismissed(false);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError('');
        setProgress(0);

        try {
            // Check if file is large enough for multipart (e.g., > 10MB)
            if (file.size > 10 * 1024 * 1024) {
                // === MULTIPART UPLOAD STRATEGY ===
                const chunkSize = 10 * 1024 * 1024; // 10MB chunks
                const totalParts = Math.ceil(file.size / chunkSize);

                // 1. Init Multipart Upload
                const initRes = await axios.post(`${API_URL}/api/files/multipart/init`, {
                    fileName: file.name,
                    contentType: file.type || 'application/octet-stream'
                }, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });

                const { uploadId, key } = initRes.data;
                const uploadedParts = [];
                let uploadedBytes = 0;

                // 2. Upload Parts
                for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
                    const start = (partNumber - 1) * chunkSize;
                    const end = Math.min(start + chunkSize, file.size);
                    const chunk = file.slice(start, end);

                    // Get presigned URL for this part
                    const signRes = await axios.post(`${API_URL}/api/files/multipart/sign-part`, {
                        key,
                        uploadId,
                        partNumber
                    }, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });

                    // Upload part via XHR
                    await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('PUT', signRes.data.uploadUrl, true);
                        xhr.timeout = 120000; // 2 min timeout per chunk

                        // Track progress relative to total file size
                        xhr.upload.onprogress = (e) => {
                            if (e.lengthComputable) {
                                const partProgress = e.loaded;
                                const totalProgress = uploadedBytes + partProgress;
                                const percentCompleted = Math.round((totalProgress * 100) / file.size);
                                setProgress(percentCompleted);
                            }
                        };

                        xhr.onload = () => {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                // ETag is needed for completion
                                const etag = xhr.getResponseHeader('ETag');
                                uploadedParts.push({ PartNumber: partNumber, ETag: etag.replaceAll('"', '') });
                                uploadedBytes += chunk.size;
                                resolve();
                            } else {
                                reject(new Error(`Part ${partNumber} failed: ${xhr.status}`));
                            }
                        };

                        xhr.onerror = () => reject(new Error(`Network error on part ${partNumber}`));
                        xhr.ontimeout = () => reject(new Error(`Timeout on part ${partNumber}`));
                        xhr.send(chunk);
                    });
                }

                // 3. Complete Multipart Upload
                const completeRes = await axios.post(`${API_URL}/api/files/multipart/complete`, {
                    key,
                    uploadId,
                    parts: uploadedParts
                }, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });

                // 4. Save Metadata
                const response = await axios.post(`${API_URL}/api/files/upload`, {
                    originalName: file.name,
                    fileSize: file.size,
                    mimetype: file.type,
                    storageKey: key,
                    fileUrl: completeRes.data.location,
                    storageType: 'tebi',
                    customName: customName.trim(),
                    brandName: brandName.trim(),
                    allowedDomain: isDomainLocked ? allowedDomain.trim() : ''
                });

                if (response.data.success) {
                    setUploadedLink(response.data.file.downloadLink);
                    setFile(null);
                    setProgress(100);
                    setCustomName('');
                    setBrandName('');
                    setAllowedDomain('');
                    setIsDomainLocked(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    onUploadSuccess();
                }

            } else {
                // === EXISTING STANDARD UPLOAD (Small Files) ===
                // 1. Get presigned upload URL from backend
                const presignRes = await axios.post(`${API_URL}/api/files/presign`, {
                    fileName: file.name,
                    contentType: file.type || 'application/octet-stream'
                }, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });

                const { uploadUrl, storageKey, publicUrl } = presignRes.data;

                // 2. Upload directly to Tebi.io using presigned URL (with progress via XHR)
                await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('PUT', uploadUrl, true);
                    xhr.timeout = 300000; // 5 minute timeout

                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            setProgress(Math.round((e.loaded * 100) / e.total));
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve();
                        } else {
                            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
                        }
                    };

                    xhr.onerror = () => reject(new Error('Network error during upload'));
                    xhr.ontimeout = () => reject(new Error('Upload timed out after 5 minutes'));

                    xhr.send(file);
                });

                // 3. Save Metadata to Backend
                const response = await axios.post(`${API_URL}/api/files/upload`, {
                    originalName: file.name,
                    fileSize: file.size,
                    mimetype: file.type,
                    storageKey: storageKey,
                    fileUrl: publicUrl,
                    storageType: 'tebi',
                    customName: customName.trim(),
                    brandName: brandName.trim(),
                    allowedDomain: isDomainLocked ? allowedDomain.trim() : ''
                });

                if (response.data.success) {
                    setUploadedLink(response.data.file.downloadLink);
                    setFile(null);
                    setProgress(100);
                    setCustomName('');
                    setBrandName('');
                    setAllowedDomain('');
                    setIsDomainLocked(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    onUploadSuccess();
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(uploadedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="upload-section">
            <div className="upload-header">
                <div className="upload-title-row">
                    <Upload size={22} />
                    <h2>Upload APK File</h2>
                </div>
                <span className={`limit-badge ${uploadsRemaining === 0 ? 'limit-zero' : ''}`}>
                    {uploadsRemaining} uploads remaining
                </span>
            </div>

            {/* Success State */}
            {uploadedLink && (
                <div className="upload-success glass-card">
                    <div className="success-icon-wrapper">
                        <Check size={24} />
                    </div>
                    <div className="success-info">
                        <h3>File Uploaded Successfully!</h3>
                        <div className="link-row">
                            <input type="text" value={uploadedLink} readOnly className="link-input" />
                            <button onClick={copyToClipboard} className="btn btn-primary btn-sm">
                                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Drop Zone */}
            <div
                className={`drop-zone glass-card ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''} ${uploadsRemaining <= 0 && !file ? 'disabled' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => uploadsRemaining > 0 && !file && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".apk"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    style={{ display: 'none' }}
                    disabled={uploadsRemaining <= 0}
                />

                {!file ? (
                    <div className="drop-content">
                        <div className="drop-icon">
                            <Cloud size={40} />
                        </div>
                        {uploadsRemaining > 0 ? (
                            <>
                                <p className="drop-text">Drag & drop your APK file here</p>
                                <p className="drop-hint">or <span className="browse-text">click to browse</span> — Max 1GB</p>
                            </>
                        ) : (
                            <>
                                <p className="drop-text">Upload limit reached</p>
                                <p className="drop-hint">Please delete an existing file to upload more.</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="file-preview">
                        <div className="file-preview-icon">
                            <Package size={24} />
                        </div>
                        <div className="file-preview-info">
                            <span className="file-preview-name">{file.name}</span>
                            <span className="file-preview-size">{formatBytes(file.size)}</span>
                        </div>
                        <button
                            className="file-remove-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* AI Smart Rename Suggestion */}
            {file && !uploading && aiSuggestion && !aiDismissed && (
                <div className="ai-rename-card">
                    <div className="ai-rename-header">
                        <Cpu size={14} />
                        <span>AI Smart Rename</span>
                        <span className="ai-rename-badge">Suggestion</span>
                    </div>
                    <div className="ai-rename-body">
                        <div className="ai-rename-suggestion">{aiSuggestion}</div>
                        <div className="ai-rename-actions">
                            <button
                                className="ai-accept-btn"
                                onClick={() => { setCustomName(aiSuggestion); setAiDismissed(true); }}
                            >
                                ✓ Use This Name
                            </button>
                            <button
                                className="ai-dismiss-btn"
                                onClick={() => setAiDismissed(true)}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Options (shown when file is selected) */}
            {file && !uploading && (
                <div className="upload-options glass-card">
                    <div className="upload-options-header">
                        <h3>Download Options</h3>
                        <span className="options-hint">Optional — customize how your file is downloaded</span>
                    </div>
                    <div className="upload-options-fields">
                        <div className="option-field">
                            <label htmlFor="customName">
                                <Package size={14} />
                                Custom Filename
                            </label>
                            <input
                                id="customName"
                                type="text"
                                placeholder="e.g. Instander"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                            />
                        </div>
                        <div className="option-field">
                            <label htmlFor="brandName">
                                <Globe size={14} />
                                Brand / Website Name
                            </label>
                            <input
                                id="brandName"
                                type="text"
                                placeholder="e.g. MyWebsite"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                            />
                        </div>

                        {/* Domain Lock Toggle */}
                        <div className="domain-lock-section">
                            <div className="toggle-row">
                                <div className="toggle-label-group">
                                    <div className="toggle-icon-wrap"><Shield size={16} /></div>
                                    <div className="toggle-text">
                                        <label className="toggle-title">Protect File</label>
                                        <button className="help-link" onClick={() => setShowHelp(true)}>Why it's important?</button>
                                    </div>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={isDomainLocked}
                                        onChange={(e) => setIsDomainLocked(e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            {isDomainLocked && (
                                <div className="option-field domain-field slide-down">
                                    <input
                                        id="allowedDomain"
                                        type="text"
                                        placeholder="e.g. example.com"
                                        value={allowedDomain}
                                        onChange={(e) => setAllowedDomain(e.target.value)}
                                        autoFocus
                                    />
                                    <span className="domain-hint">Only this domain can use the download link</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Help Modal */}
            {showHelp && (
                <div className="modal-overlay" onClick={() => setShowHelp(false)}>
                    <div className="help-modal glass-card" onClick={e => e.stopPropagation()}>
                        <div className="help-header">
                            <h3>Why Protect Your File?</h3>
                            <button onClick={() => setShowHelp(false)}><X size={18} /></button>
                        </div>
                        <div className="help-content">
                            <div className="help-item">
                                <span className="help-icon"><Shield size={18} /></span>
                                <div>
                                    <strong>Prevent Theft</strong>
                                    <p>Stops other websites from copying your direct download link.</p>
                                </div>
                            </div>
                            <div className="help-item">
                                <span className="help-icon"><Lock size={18} /></span>
                                <div>
                                    <strong>Traffic Security</strong>
                                    <p>Ensures that users must visit YOUR website to download the file.</p>
                                </div>
                            </div>
                            <div className="help-item">
                                <span className="help-icon"><Zap size={18} /></span>
                                <div>
                                    <strong>Save Bandwidth</strong>
                                    <p>Prevents hotlinking which uses up your storage bandwidth.</p>
                                </div>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-full" onClick={() => setShowHelp(false)}>Got it</button>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="upload-error">
                    <span>{error}</span>
                </div>
            )}

            {/* Progress */}
            {uploading && (
                <div className="upload-progress">
                    <div className="progress-track">
                        <div className="progress-bar" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="progress-text">{progress}%</span>
                </div>
            )}

            {/* Upload Button */}
            {file && !uploading && (
                <button onClick={handleUpload} className="btn btn-primary btn-lg upload-submit">
                    <Upload size={18} />
                    Upload File
                </button>
            )}

            {/* Help Modal */}
            {showHelp && (
                <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
                    <div className="help-modal" onClick={e => e.stopPropagation()}>
                        <div className="help-header">
                            <h3><Globe size={20} /> Domain Protection</h3>
                            <button className="close-help" onClick={() => setShowHelp(false)}><X size={20} /></button>
                        </div>
                        <div className="help-body">
                            <p>This feature allows you to restrict downloads to a specific domain (e.g., <code>example.com</code>).</p>
                            <p>When active, the download link will <strong>only work</strong> when clicked from your website. This prevents hotlinking and unauthorized sharing of your direct download links.</p>
                            <div className="help-tip">
                                <strong>Pro Tip:</strong> Use this to ensure users visit your site before downloading.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="help-modal-overlay" onClick={() => setShowUpgradeModal(false)}>
                    <div className="help-modal" onClick={e => e.stopPropagation()}>
                        <div className="help-header">
                            <h3><Star size={20} style={{ color: '#fbbf24' }} /> Upgrade Your Plan</h3>
                            <button className="close-help" onClick={() => setShowUpgradeModal(false)}><X size={20} /></button>
                        </div>
                        <div className="help-body">
                            <div className="upgrade-icon-large">
                                <Rocket size={48} />
                            </div>
                            <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '15px' }}>
                                You've reached the limit for the <strong>Free Plan</strong> (1 file).
                                <br />Step up to <strong>Starter</strong> for more power!
                            </p>

                            <div className="upgrade-features-list">
                                <div className="up-feat"><Check size={16} /> 3 Active File Uploads</div>
                                <div className="up-feat"><Check size={16} /> Protected Download Links</div>
                                <div className="up-feat"><Check size={16} /> Premium Support</div>
                            </div>

                            <div className="admin-contact-box">
                                <h4>Ready to Upgrade?</h4>
                                <p>Contact us on WhatsApp to activate your <strong>Starter Plan (₨1,000/mo)</strong>:</p>
                                <a href="https://wa.me/923004503618" target="_blank" rel="noopener noreferrer" className="wa-contact-btn">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.658 1.43 5.632 1.43h.008c6.547 0 11.88-5.335 11.883-11.892a11.826 11.826 0 00-3.488-8.412z" /></svg>
                                    0300 4503618
                                </a>
                                <div style={{ fontSize: '12px', marginTop: '10px', opacity: 0.8 }}>
                                    Message us to upgrade instantly!
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
