import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Upload, Package, X, Check, Copy, Cloud, Globe, Shield } from './Icons';
import './FileUpload.css';

const FileUpload = ({ onUploadSuccess }) => {
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
        if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
    };

    const handleFileSelect = (selectedFile) => {
        setError('');
        setUploadedLink('');
        setCopied(false);
        if (!selectedFile.name.endsWith('.apk')) { setError('Only APK files are allowed'); return; }
        const maxSize = 100 * 1024 * 1024;
        if (selectedFile.size > maxSize) { setError('File size must be less than 100MB'); return; }
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError('');
        setProgress(0);

        try {
            // 1. Direct Upload to Supabase using Axios for Progress Tracking
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            // Get Supabase config from env
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const bucketName = 'apk-files';

            // Upload via Axios to get progress events
            await axios.post(
                `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`,
                file,
                {
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': file.type || 'application/octet-stream',
                        'x-upsert': 'false'
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentCompleted);
                    }
                }
            );

            // 2. Get Public URL (Manual construction)
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;

            // 3. Save Metadata to Backend
            const response = await axios.post(`${API_URL}/api/files/upload`, {
                originalName: file.name,
                fileSize: file.size,
                mimetype: file.type,
                storageKey: filePath,
                fileUrl: publicUrl,
                storageType: 'supabase',
                customName: customName.trim(),
                brandName: brandName.trim(),
                allowedDomain: allowedDomain.trim()
            });

            if (response.data.success) {
                setUploadedLink(response.data.file.downloadLink);
                setFile(null);
                setProgress(100);
                setCustomName('');
                setBrandName('');
                setAllowedDomain('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                onUploadSuccess();
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Upload failed');
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
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="upload-section">
            <div className="upload-header">
                <Upload size={22} />
                <h2>Upload APK File</h2>
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
                className={`drop-zone glass-card ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".apk"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    style={{ display: 'none' }}
                />

                {!file ? (
                    <div className="drop-content">
                        <div className="drop-icon">
                            <Cloud size={40} />
                        </div>
                        <p className="drop-text">Drag & drop your APK file here</p>
                        <p className="drop-hint">or <span className="browse-text">click to browse</span> — Max 100MB</p>
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
                        <div className="option-field domain-field">
                            <label htmlFor="allowedDomain">
                                <Shield size={14} />
                                Restrict to Domain
                            </label>
                            <input
                                id="allowedDomain"
                                type="text"
                                placeholder="e.g. example.com"
                                value={allowedDomain}
                                onChange={(e) => setAllowedDomain(e.target.value)}
                            />
                            <span className="domain-hint">Only this domain can use the download link</span>
                        </div>
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
