import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Folder, Package, Download, Copy, Trash, Check, Clock, Search, Edit, X, Globe, Shield } from './Icons';
import './FileList.css';

const FileList = ({ files, onDelete, onRename }) => {
    const [copied, setCopied] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingFile, setEditingFile] = useState(null);
    const [newName, setNewName] = useState('');
    const [renameLoading, setRenameLoading] = useState(false);
    const [renameError, setRenameError] = useState('');
    const { API_URL } = useAuth();

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const copyLink = (link, fileId) => {
        navigator.clipboard.writeText(link);
        setCopied(fileId);
        setTimeout(() => setCopied(null), 2000);
    };

    const startRename = (file) => {
        // Remove .apk extension for editing
        const nameWithoutExt = file.originalName.replace(/\.apk$/i, '');
        setEditingFile(file.fileId);
        setNewName(nameWithoutExt);
        setRenameError('');
    };

    const cancelRename = () => {
        setEditingFile(null);
        setNewName('');
        setRenameError('');
    };

    const handleRename = async (fileId) => {
        if (!newName.trim()) {
            setRenameError('Name cannot be empty');
            return;
        }
        setRenameLoading(true);
        setRenameError('');
        try {
            const response = await axios.put(`${API_URL}/api/files/${fileId}/rename`, {
                newName: newName.trim()
            });
            if (response.data.success) {
                setEditingFile(null);
                setNewName('');
                if (onRename) onRename();
            }
        } catch (err) {
            setRenameError(err.response?.data?.message || 'Rename failed');
        } finally {
            setRenameLoading(false);
        }
    };

    const handleRenameKeyDown = (e, fileId) => {
        if (e.key === 'Enter') handleRename(fileId);
        if (e.key === 'Escape') cancelRename();
    };

    const filteredFiles = files.filter(f =>
        f.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (files.length === 0) {
        return (
            <div className="filelist-section">
                <div className="filelist-header">
                    <Folder size={22} />
                    <h2>Your Files</h2>
                </div>
                <div className="empty-state glass-card">
                    <div className="empty-icon">
                        <Package size={48} />
                    </div>
                    <h3>No files yet</h3>
                    <p>Upload your first APK file to get started!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="filelist-section">
            <div className="filelist-header">
                <div className="filelist-title">
                    <Folder size={22} />
                    <h2>Your Files</h2>
                    <span className="file-count">{files.length}</span>
                </div>
                {files.length > 2 && (
                    <div className="filelist-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className="file-cards">
                {filteredFiles.map((file) => (
                    <div key={file.fileId} className="file-card glass-card">
                        <div className="file-card-icon">
                            <Package size={22} />
                        </div>

                        <div className="file-card-info">
                            {editingFile === file.fileId ? (
                                <div className="rename-form">
                                    <div className="rename-input-row">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            onKeyDown={(e) => handleRenameKeyDown(e, file.fileId)}
                                            className="rename-input"
                                            autoFocus
                                            placeholder="Enter new name"
                                        />
                                        <span className="rename-ext">.apk</span>
                                        <button
                                            onClick={() => handleRename(file.fileId)}
                                            className="action-btn copy"
                                            disabled={renameLoading}
                                            title="Save"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={cancelRename}
                                            className="action-btn delete"
                                            title="Cancel"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {renameError && <span className="rename-error">{renameError}</span>}
                                </div>
                            ) : (
                                <>
                                    <span className="file-card-name">{file.originalName}</span>
                                    <div className="file-card-meta">
                                        <span className="meta-item">{formatBytes(file.fileSize)}</span>
                                        <span className="meta-dot">•</span>
                                        <span className="meta-item">
                                            <Download size={12} /> {file.downloadCount}
                                        </span>
                                        <span className="meta-dot">•</span>
                                        <span className="meta-item">
                                            <Clock size={12} /> {formatDate(file.uploadedAt)}
                                        </span>
                                    </div>
                                    {/* File Detail Badges */}
                                    {(file.customName || file.brandName || file.allowedDomain) && (
                                        <div className="file-detail-badges">
                                            {file.customName && (
                                                <span className="detail-badge badge-name" title="Custom download name">
                                                    <Package size={11} /> {file.customName}
                                                </span>
                                            )}
                                            {file.brandName && (
                                                <span className="detail-badge badge-brand" title="Brand name">
                                                    <Globe size={11} /> {file.brandName}
                                                </span>
                                            )}
                                            {file.allowedDomain && (
                                                <span className="detail-badge badge-domain" title="Restricted to this domain">
                                                    <Shield size={11} /> {file.allowedDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {editingFile !== file.fileId && (
                            <div className="file-card-actions">
                                <button
                                    onClick={() => startRename(file)}
                                    className="action-btn rename"
                                    title="Rename"
                                >
                                    <Edit size={16} />
                                </button>

                                <button
                                    onClick={() => copyLink(file.downloadLink, file.fileId)}
                                    className="action-btn copy"
                                    title="Copy link"
                                >
                                    {copied === file.fileId ? <Check size={16} /> : <Copy size={16} />}
                                </button>

                                <a
                                    href={file.downloadLink}
                                    download
                                    className="action-btn download"
                                    title="Download"
                                >
                                    <Download size={16} />
                                </a>

                                <button
                                    onClick={() => onDelete(file.fileId)}
                                    className="action-btn delete"
                                    title="Delete"
                                >
                                    <Trash size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredFiles.length === 0 && searchTerm && (
                <div className="no-results">
                    <p>No files match "{searchTerm}"</p>
                </div>
            )}
        </div>
    );
};

export default FileList;
