import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Folder, Package, Download, Copy, Trash, Check, Clock, Search, Edit, X, Globe, Shield, BarChart, Eye } from './Icons';
import './FileList.css';

const FileList = ({ files, onDelete, onRename }) => {
    const { API_URL } = useAuth();
    const [copiedId, setCopiedId] = useState(null);
    const [renamingFile, setRenamingFile] = useState(null);
    const [newName, setNewName] = useState('');
    const [newBrand, setNewBrand] = useState('');
    const [newDomain, setNewDomain] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileStats, setFileStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [showQR, setShowQR] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const copyLink = (link, fileId) => {
        navigator.clipboard.writeText(link);
        setCopiedId(fileId);
        showToast('Download link copied!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const startRename = (file) => {
        setRenamingFile(file.fileId);
        setNewName(file.customName || file.originalName.replace(/\.apk$/i, ''));
        setNewBrand(file.brandName || '');
        setNewDomain(file.allowedDomain || '');
    };

    const cancelRename = () => {
        setRenamingFile(null);
        setNewName('');
        setNewBrand('');
        setNewDomain('');
    };

    const handleRename = async (fileId) => {
        try {
            const response = await axios.put(`${API_URL}/api/files/${fileId}/rename`, {
                newName: newName.trim(),
                brandName: newBrand.trim(),
                allowedDomain: newDomain.trim()
            });
            if (response.data.success) {
                showToast('File updated successfully!');
                cancelRename();
                onRename?.();
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Error updating file', 'error');
        }
    };

    const handleRenameKeyDown = (e, fileId) => {
        if (e.key === 'Enter') handleRename(fileId);
        if (e.key === 'Escape') cancelRename();
    };

    // Open file detail modal
    const openFileDetails = async (file) => {
        setSelectedFile(file);
        setStatsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/stats/file/${file.fileId}`);
            if (response.data.success) {
                setFileStats(response.data);
            }
        } catch (error) {
            console.error('Error loading file stats');
            setFileStats(null);
        } finally {
            setStatsLoading(false);
        }
    };

    const closeDetails = () => {
        setSelectedFile(null);
        setFileStats(null);
    };

    // QR Code URL (using free API)
    const getQRUrl = (link) => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}&bgcolor=0a0a14&color=a78bfa&format=png`;
    };

    // Search and Sort
    const filteredFiles = useMemo(() => {
        let result = [...files];

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(f =>
                (f.originalName || '').toLowerCase().includes(q) ||
                (f.customName || '').toLowerCase().includes(q) ||
                (f.brandName || '').toLowerCase().includes(q) ||
                (f.fileId || '').toLowerCase().includes(q)
            );
        }

        // Sort
        switch (sortBy) {
            case 'newest': result.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)); break;
            case 'oldest': result.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt)); break;
            case 'name': result.sort((a, b) => (a.customName || a.originalName).localeCompare(b.customName || b.originalName)); break;
            case 'size': result.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0)); break;
            case 'downloads': result.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0)); break;
            default: break;
        }

        return result;
    }, [files, searchQuery, sortBy]);

    if (!files || files.length === 0) {
        return (
            <div className="filelist-empty glass-card">
                <Folder size={48} />
                <h3>No files uploaded yet</h3>
                <p>Upload your first APK to get started with APKFlow.</p>
            </div>
        );
    }

    return (
        <div className="filelist-container">
            {/* Toast */}
            {toast && (
                <div className={`filelist-toast ${toast.type}`}>
                    {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="filelist-header glass-card">
                <div className="filelist-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={() => setSearchQuery('')}><X size={14} /></button>
                    )}
                </div>
                <div className="filelist-sort">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="name">Name A-Z</option>
                        <option value="size">Largest First</option>
                        <option value="downloads">Most Downloads</option>
                    </select>
                </div>
                <span className="filelist-count">{filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}</span>
            </div>

            {/* File Cards */}
            <div className="filelist-grid">
                {filteredFiles.map((file) => (
                    <div key={file.fileId} className="file-card glass-card">
                        {renamingFile === file.fileId ? (
                            /* Edit Mode */
                            <div className="file-edit-mode">
                                <div className="file-edit-group">
                                    <label>App Name</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onKeyDown={(e) => handleRenameKeyDown(e, file.fileId)}
                                        placeholder="Custom filename"
                                        autoFocus
                                    />
                                </div>
                                <div className="file-edit-group">
                                    <label>Brand Name</label>
                                    <input
                                        type="text"
                                        value={newBrand}
                                        onChange={(e) => setNewBrand(e.target.value)}
                                        onKeyDown={(e) => handleRenameKeyDown(e, file.fileId)}
                                        placeholder="Brand prefix (optional)"
                                    />
                                </div>
                                <div className="file-edit-group">
                                    <label>Domain Lock</label>
                                    <input
                                        type="text"
                                        value={newDomain}
                                        onChange={(e) => setNewDomain(e.target.value)}
                                        onKeyDown={(e) => handleRenameKeyDown(e, file.fileId)}
                                        placeholder="example.com (optional)"
                                    />
                                </div>
                                <div className="file-edit-actions">
                                    <button className="btn btn-sm btn-primary" onClick={() => handleRename(file.fileId)}>
                                        <Check size={14} /> Save
                                    </button>
                                    <button className="btn btn-sm btn-ghost" onClick={cancelRename}>
                                        <X size={14} /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Normal Mode */
                            <>
                                <div className="file-card-top">
                                    <div className="file-icon-wrap">
                                        <Package size={20} />
                                    </div>
                                    <div className="file-info">
                                        <span className="file-name" title={file.customName || file.originalName}>
                                            {file.customName || file.originalName}
                                        </span>
                                        <div className="file-meta">
                                            <span>{formatBytes(file.fileSize)}</span>
                                            <span>•</span>
                                            <span>{formatDate(file.uploadedAt)}</span>
                                        </div>
                                    </div>
                                    <div className="file-badges">
                                        {file.brandName && <span className="file-badge brand"><Globe size={10} /> {file.brandName}</span>}
                                        {file.allowedDomain && <span className="file-badge locked"><Shield size={10} /> Locked</span>}
                                    </div>
                                </div>

                                <div className="file-stats-row">
                                    <div className="file-stat">
                                        <Download size={14} />
                                        <span>{file.downloadCount || 0} downloads</span>
                                    </div>
                                    <div className="file-stat">
                                        <Clock size={14} />
                                        <span>{file.lastDownloadAt ? formatDate(file.lastDownloadAt) : 'Never'}</span>
                                    </div>
                                </div>

                                {/* QR Code */}
                                {showQR === file.fileId && (
                                    <div className="file-qr-section">
                                        <img src={getQRUrl(file.downloadLink)} alt="QR Code" className="file-qr-img" />
                                        <p className="file-qr-tip">Scan to download</p>
                                    </div>
                                )}

                                <div className="file-actions">
                                    <button
                                        className="file-action-btn"
                                        onClick={() => copyLink(file.downloadLink, file.fileId)}
                                        title="Copy download link"
                                    >
                                        {copiedId === file.fileId ? <Check size={14} /> : <Copy size={14} />}
                                        <span>{copiedId === file.fileId ? 'Copied!' : 'Copy Link'}</span>
                                    </button>
                                    <button
                                        className="file-action-btn"
                                        onClick={() => setShowQR(showQR === file.fileId ? null : file.fileId)}
                                        title="Show QR Code"
                                    >
                                        <Eye size={14} />
                                        <span>QR</span>
                                    </button>
                                    <button
                                        className="file-action-btn"
                                        onClick={() => openFileDetails(file)}
                                        title="View Details"
                                    >
                                        <BarChart size={14} />
                                        <span>Stats</span>
                                    </button>
                                    <button className="file-action-btn" onClick={() => startRename(file)} title="Edit file">
                                        <Edit size={14} />
                                        <span>Edit</span>
                                    </button>
                                    <button className="file-action-btn danger" onClick={() => onDelete(file.fileId)} title="Delete file">
                                        <Trash size={14} />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* File Detail Modal */}
            {selectedFile && (
                <div className="file-modal-overlay" onClick={closeDetails}>
                    <div className="file-modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="file-modal-header">
                            <div className="file-modal-title">
                                <Package size={22} />
                                <div>
                                    <h2>{selectedFile.customName || selectedFile.originalName}</h2>
                                    <span className="file-modal-id">ID: {selectedFile.fileId}</span>
                                </div>
                            </div>
                            <button className="file-modal-close" onClick={closeDetails}>
                                <X size={20} />
                            </button>
                        </div>

                        {statsLoading ? (
                            <div className="file-modal-loading">
                                <div className="spinner" />
                                <span>Loading analytics...</span>
                            </div>
                        ) : (
                            <div className="file-modal-body">
                                {/* File Info Grid */}
                                <div className="file-detail-grid">
                                    <div className="file-detail-item">
                                        <span className="detail-label">File Size</span>
                                        <span className="detail-value">{formatBytes(selectedFile.fileSize)}</span>
                                    </div>
                                    <div className="file-detail-item">
                                        <span className="detail-label">Downloads</span>
                                        <span className="detail-value">{selectedFile.downloadCount || 0}</span>
                                    </div>
                                    <div className="file-detail-item">
                                        <span className="detail-label">Uploaded</span>
                                        <span className="detail-value">{formatDate(selectedFile.uploadedAt)}</span>
                                    </div>
                                    <div className="file-detail-item">
                                        <span className="detail-label">Last Download</span>
                                        <span className="detail-value">{selectedFile.lastDownloadAt ? formatDate(selectedFile.lastDownloadAt) : 'Never'}</span>
                                    </div>
                                    {selectedFile.brandName && (
                                        <div className="file-detail-item">
                                            <span className="detail-label">Brand</span>
                                            <span className="detail-value">{selectedFile.brandName}</span>
                                        </div>
                                    )}
                                    {selectedFile.allowedDomain && (
                                        <div className="file-detail-item">
                                            <span className="detail-label">Domain Lock</span>
                                            <span className="detail-value">{selectedFile.allowedDomain}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Download Link + QR */}
                                <div className="file-modal-link-section">
                                    <div className="file-modal-link">
                                        <input type="text" value={selectedFile.downloadLink} readOnly />
                                        <button className="btn btn-sm btn-primary" onClick={() => copyLink(selectedFile.downloadLink, selectedFile.fileId)}>
                                            <Copy size={14} /> Copy
                                        </button>
                                    </div>
                                    <div className="file-modal-qr">
                                        <img src={getQRUrl(selectedFile.downloadLink)} alt="QR Code" />
                                        <span>Scan to download</span>
                                    </div>
                                </div>

                                {/* Analytics */}
                                {fileStats?.analytics && (
                                    <>
                                        {fileStats.analytics.countryStats?.length > 0 && (
                                            <div className="file-analytics-section">
                                                <h4>📍 Top Countries</h4>
                                                <div className="analytics-list">
                                                    {fileStats.analytics.countryStats.map((c, i) => (
                                                        <div key={i} className="analytics-row">
                                                            <span className="analytics-name">{c.country}</span>
                                                            <span className="analytics-count">{c.count}</span>
                                                            <div className="analytics-bar">
                                                                <div style={{ width: `${(c.count / (fileStats.analytics.countryStats[0]?.count || 1)) * 100}%` }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {fileStats.analytics.refererStats?.length > 0 && (
                                            <div className="file-analytics-section">
                                                <h4>🔗 Top Referrers</h4>
                                                <div className="analytics-list">
                                                    {fileStats.analytics.refererStats.map((r, i) => (
                                                        <div key={i} className="analytics-row">
                                                            <span className="analytics-name">{new URL(r.referer).hostname || r.referer}</span>
                                                            <span className="analytics-count">{r.count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {fileStats.analytics.recentDownloads?.length > 0 && (
                                            <div className="file-analytics-section">
                                                <h4>📥 Recent Downloads</h4>
                                                <div className="analytics-list recent">
                                                    {fileStats.analytics.recentDownloads.slice(0, 10).map((d, i) => (
                                                        <div key={i} className="analytics-row">
                                                            <span className="analytics-name">{d.country || 'Unknown'}</span>
                                                            <span className="analytics-meta">{d.ip ? d.ip.substring(0, 12) + '...' : '—'}</span>
                                                            <span className="analytics-time">{new Date(d.timestamp).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileList;
