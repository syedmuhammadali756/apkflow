import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Upload, Package, X, Check, Copy, Cloud, Globe, Shield } from './Icons';
import './FileUpload.css';

const FileUpload = ({ onUploadSuccess, fileCount = 0 }) => {
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

    // Limits
    const MAX_UPLOADS = 3;
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
        if (uploadsRemaining <= 0) { setError('Upload limit reached. Please delete a file first.'); return; }
        if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
    };

    const handleFileSelect = (selectedFile) => {
        setError('');
        if (uploadsRemaining <= 0) { setError('Upload limit reached. Please delete a file first.'); return; }

        setUploadedLink('');
        setCopied(false);
        if (!selectedFile.name.endsWith('.apk')) { setError('Only APK files are allowed'); return; }
        const maxSize = 1024 * 1024 * 1024; // 1GB with Tebi.io
        if (selectedFile.size > maxSize) { setError('File size must be less than 1GB'); return; }
        setFile(selectedFile);
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
                                <p className="drop-hint">or <span className="browse-text">click to browse</span> — Max 100MB</p>
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
                                <span className="help-icon">🛡️</span>
                                <div>
                                    <strong>Prevent Theft</strong>
                                    <p>Stops other websites from copying your direct download link.</p>
                                </div>
                            </div>
                            <div className="help-item">
                                <span className="help-icon">🔒</span>
                                <div>
                                    <strong>Traffic Security</strong>
                                    <p>Ensures that users must visit YOUR website to download the file.</p>
                                </div>
                            </div>
                            <div className="help-item">
                                <span className="help-icon">💰</span>
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
        </div>
    );
};

export default FileUpload;
