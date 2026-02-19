import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Package, Download, Clock, Copy, Check, Trash, Edit, X, Globe, Shield, BarChart, Eye, Search, Grid as GridIcon, List as ListIcon, Folder } from './Icons';
import './FileList.css';

const FileList = ({ files, onDelete, onRename, userPlan = 'free' }) => {
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
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

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
        if (!files) return [];
        let result = [...files];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(f =>
                (f.originalName || '').toLowerCase().includes(q) ||
                (f.customName || '').toLowerCase().includes(q) ||
                (f.brandName || '').toLowerCase().includes(q) ||
                (f.fileId || '').toLowerCase().includes(q)
            );
        }

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
                <div className="filelist-controls">
                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <ListIcon size={16} />
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <GridIcon size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* File Container */}
            <div className={`file-view-mode-${viewMode}`}>
                <div className="filelist-grid">
                    {filteredFiles.map((file) => (
                        <div key={file.fileId} className={`file-card glass-card ${viewMode}`}>
                            {renamingFile === file.fileId ? (
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
                                        <div className="label-with-badge">
                                            <label>Domain Lock</label>
                                            {userPlan === 'free' && (
                                                <span className="locked-badge">Starter Only</span>
                                            )}
                                        </div>
                                        <div className="domain-input-wrapper">
                                            <input
                                                type="text"
                                                value={newDomain}
                                                onChange={(e) => setNewDomain(e.target.value)}
                                                onKeyDown={(e) => handleRenameKeyDown(e, file.fileId)}
                                                placeholder={userPlan === 'free' ? "Upgrade to unlock" : "example.com (optional)"}
                                                disabled={userPlan === 'free'}
                                                className={userPlan === 'free' ? 'disabled-input' : ''}
                                            />
                                            {userPlan === 'free' && (
                                                <Link to="/#pricing" className="unlock-inline-link">Upgrade</Link>
                                            )}
                                        </div>
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
                                                <span className="dot">•</span>
                                                <span>{formatDate(file.uploadedAt)}</span>
                                            </div>
                                        </div>
                                        <div className="file-badges">
                                            {file.brandName && <span className="file-badge brand" title={`Brand: ${file.brandName}`}><Globe size={10} /> {file.brandName}</span>}
                                            {file.allowedDomain && <span className="file-badge locked" title={`Locked to: ${file.allowedDomain}`}><Shield size={10} /> Locked</span>}
                                        </div>
                                    </div>

                                    <div className="file-stats-row">
                                        <div className="file-stat">
                                            <Download size={14} />
                                            <span>{file.downloadCount || 0} hits</span>
                                        </div>
                                        <div className="file-stat">
                                            <Clock size={14} />
                                            <span>{file.lastDownloadAt ? formatDate(file.lastDownloadAt) : 'Never'}</span>
                                        </div>
                                    </div>

                                    {showQR === file.fileId && (
                                        <div className="file-qr-section">
                                            <button
                                                className="qr-close-btn"
                                                onClick={() => setShowQR(null)}
                                                title="Close QR"
                                            >
                                                <X size={18} />
                                            </button>
                                            <div className="qr-container">
                                                <img src={getQRUrl(file.downloadLink)} alt="QR Code" className="file-qr-img" />
                                            </div>
                                            <p className="file-qr-tip">Scan to direct download</p>
                                        </div>
                                    )}

                                    <div className="file-actions">
                                        <button className="file-action-btn copy" onClick={() => copyLink(file.downloadLink, file.fileId)} title="Copy link">
                                            {copiedId === file.fileId ? <Check size={14} /> : <Copy size={14} />}
                                            <span>{copiedId === file.fileId ? 'Copied' : 'Link'}</span>
                                        </button>
                                        <button className={`file-action-btn qr ${showQR === file.fileId ? 'active' : ''}`} onClick={() => setShowQR(showQR === file.fileId ? null : file.fileId)} title="Show QR">
                                            <Eye size={14} />
                                            <span>QR</span>
                                        </button>
                                        <button className="file-action-btn stats" onClick={() => openFileDetails(file)} title="Analytics">
                                            <BarChart size={14} />
                                            <span>Stats</span>
                                        </button>
                                        <button className="file-action-btn edit" onClick={() => startRename(file)} title="Edit">
                                            <Edit size={14} />
                                            <span>Edit</span>
                                        </button>
                                        <button className="file-action-btn delete" onClick={() => onDelete(file.fileId)} title="Delete">
                                            <Trash size={14} />
                                            <span>Del</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedFile && (
                <div className="file-modal-overlay" onClick={closeDetails}>
                    <div className="file-modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="file-modal-header">
                            <div className="file-modal-title">
                                <div className="modal-icon"><Package size={24} /></div>
                                <div>
                                    <h2>{selectedFile.customName || selectedFile.originalName}</h2>
                                    <span className="file-modal-id">FID: {selectedFile.fileId}</span>
                                </div>
                            </div>
                            <button className="file-modal-close" onClick={closeDetails}><X size={20} /></button>
                        </div>

                        {statsLoading ? (
                            <div className="file-modal-loading">
                                <div className="spinner" />
                                <span>Generating analytics...</span>
                            </div>
                        ) : (
                            <div className="file-modal-body">
                                <div className="file-detail-grid">
                                    <div className="file-detail-item">
                                        <span className="detail-label">Size</span>
                                        <span className="detail-value">{formatBytes(selectedFile.fileSize)}</span>
                                    </div>
                                    <div className="file-detail-item">
                                        <span className="detail-label">Total Downloads</span>
                                        <span className="detail-value">{selectedFile.downloadCount || 0}</span>
                                    </div>
                                    <div className="file-detail-item">
                                        <span className="detail-label">Upload Date</span>
                                        <span className="detail-value">{formatDate(selectedFile.uploadedAt)}</span>
                                    </div>
                                    <div className="file-detail-item">
                                        <span className="detail-label">Last Interaction</span>
                                        <span className="detail-value">{selectedFile.lastDownloadAt ? formatDate(selectedFile.lastDownloadAt) : 'None'}</span>
                                    </div>
                                </div>

                                <div className="file-modal-link-section">
                                    <div className="file-modal-link">
                                        <input type="text" value={selectedFile.downloadLink} readOnly />
                                        <button className="btn btn-sm btn-primary" onClick={() => copyLink(selectedFile.downloadLink, selectedFile.fileId)}>
                                            <Copy size={14} /> Copy
                                        </button>
                                    </div>
                                    <div className="file-modal-qr">
                                        <img src={getQRUrl(selectedFile.downloadLink)} alt="QR" />
                                        <span>Scan for mobile install</span>
                                    </div>
                                </div>

                                {fileStats?.analytics && (
                                    <div className="modal-analytics-wrapper">
                                        {fileStats.analytics.countryStats?.length > 0 && (
                                            <div className="file-analytics-section">
                                                <h4><Globe size={16} /> Geo-Distribution</h4>
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

                                        {fileStats.analytics.recentDownloads?.length > 0 && (
                                            <div className="file-analytics-section">
                                                <h4><Download size={16} /> Recent Activity</h4>
                                                <div className="analytics-list recent">
                                                    {fileStats.analytics.recentDownloads.slice(0, 5).map((d, i) => (
                                                        <div key={i} className="analytics-row">
                                                            <span className="analytics-name">{d.country || 'Global'}</span>
                                                            <span className="analytics-meta">{d.ip ? `IP: ${d.ip.substring(0, 8)}...` : '—'}</span>
                                                            <span className="analytics-time">{new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
