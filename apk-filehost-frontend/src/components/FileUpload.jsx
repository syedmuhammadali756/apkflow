import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Upload, Package, X, Check, Copy, Cloud } from './Icons';
import './FileUpload.css';

const FileUpload = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [uploadedLink, setUploadedLink] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [copied, setCopied] = useState(false);
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
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await axios.post(`${API_URL}/api/files/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
            });
            if (response.data.success) {
                setUploadedLink(response.data.file.downloadLink);
                setFile(null);
                setProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = '';
                onUploadSuccess();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
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
