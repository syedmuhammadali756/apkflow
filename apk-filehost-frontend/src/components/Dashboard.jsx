import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import FileUpload from './FileUpload';
import FileList from './FileList';
import ProfileSettings from './ProfileSettings';
import { BrandLogo, Grid, Upload, User, Settings, LogOut, BarChart, Package, HardDrive, Download, TrendingUp, Menu, X, Bell, Search } from './Icons';
import './Dashboard.css';

const Dashboard = ({ activePage = 'overview' }) => {
    const { user, logout, API_URL } = useAuth();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(activePage);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState({
        totalFiles: 0,
        totalDownloads: 0,
        storageUsed: 0,
        storageLimit: 5 * 1024 * 1024 * 1024,
    });

    useEffect(() => {
        setCurrentPage(activePage);
    }, [activePage]);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/files`);
            if (response.data.success) {
                setFiles(response.data.files);
                // Use aggregated stats from backend (with safe fallback)
                const backendStats = response.data.stats || {};
                const safeTotalFiles = backendStats.totalFiles ?? response.data.files.length;
                const safeTotalDownloads = backendStats.totalDownloads ?? response.data.files.reduce((sum, file) => sum + (file.downloadCount || 0), 0);
                const safeStorageUsed = backendStats.totalStorageUsed ?? (user?.storageUsed || 0);

                setStats({
                    totalFiles: safeTotalFiles,
                    totalDownloads: safeTotalDownloads,
                    storageUsed: safeStorageUsed,
                    storageLimit: user?.storageQuota || 5 * 1024 * 1024 * 1024,
                });
            }
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = () => fetchFiles();

    const handleDelete = async (fileId) => {
        if (!window.confirm('Are you sure you want to delete this file?')) return;
        try {
            const response = await axios.delete(`${API_URL}/api/files/${fileId}`);
            if (response.data.success) fetchFiles();
        } catch (error) {
            alert('Error deleting file: ' + (error.response?.data?.message || error.message));
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B'; // Fix NaN/undefined
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const storagePercentage = Math.min((stats.storageUsed / stats.storageLimit) * 100, 100);
    const uploadsRemaining = Math.max(0, 3 - stats.totalFiles);

    const handleLogout = () => { logout(); navigate('/'); };

    const navItems = [
        { id: 'overview', label: 'Dashboard', icon: <Grid size={20} />, action: () => { setCurrentPage('overview'); navigate('/dashboard'); } },
        { id: 'upload', label: 'Upload', icon: <Upload size={20} />, action: () => setCurrentPage('upload') },
        { id: 'profile', label: 'Settings', icon: <Settings size={20} />, action: () => { setCurrentPage('profile'); navigate('/profile'); } },
    ];

    const statsCards = [
        {
            icon: <Package size={22} />,
            label: 'Total Files',
            value: `${stats.totalFiles} / 3`,
            color: '#7c3aed',
            extra: <span style={{ fontSize: '11px', opacity: 0.7, display: 'block', marginTop: '4px' }}>Free Plan Limit</span>
        },
        { icon: <Download size={22} />, label: 'Downloads', value: stats.totalDownloads.toLocaleString(), color: '#06b6d4' },
        {
            icon: <HardDrive size={22} />, label: 'Storage Used', value: formatBytes(stats.storageUsed), color: '#f59e0b', extra: (
                <div className="mini-progress">
                    <div className="mini-progress-bar" style={{ width: `${storagePercentage}%` }} />
                </div>
            )
        },
        { icon: <TrendingUp size={22} />, label: 'Avg. Downloads', value: stats.totalFiles > 0 ? Math.round(stats.totalDownloads / stats.totalFiles) : 0, color: '#10b981' },
    ];

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-brand">
                        <BrandLogo size={32} />
                        <span className="sidebar-brand-text">APKFlow</span>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className={`sidebar-link ${currentPage === item.id ? 'active' : ''}`}
                            onClick={() => { item.action(); setSidebarOpen(false); }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="storage-widget">
                        <div className="storage-info">
                            <span className="storage-label">Storage</span>
                            <span className="storage-value">{formatBytes(stats.storageUsed)} / {formatBytes(stats.storageLimit)}</span>
                        </div>
                        <div className="storage-bar">
                            <div className="storage-fill" style={{ width: `${storagePercentage}%` }} />
                        </div>
                    </div>

                    <button onClick={handleLogout} className="sidebar-link logout-link">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Top Bar */}
                <header className="dashboard-topbar">
                    <button className="topbar-menu" onClick={() => setSidebarOpen(true)}>
                        <Menu size={22} />
                    </button>
                    <div className="topbar-title">
                        <h1>{currentPage === 'overview' ? 'Dashboard' : currentPage === 'upload' ? 'Upload File' : 'Settings'}</h1>
                    </div>
                    <div className="topbar-actions">
                        <div className="topbar-user">
                            <div className="topbar-avatar">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="topbar-username">{user?.name}</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="dashboard-content">
                    {currentPage === 'overview' && (
                        <>
                            {/* Stats Grid */}
                            <div className="dash-stats-grid">
                                {statsCards.map((card, i) => (
                                    <div key={i} className="dash-stat-card glass-card">
                                        <div className="dash-stat-icon" style={{ background: `${card.color}15`, color: card.color }}>
                                            {card.icon}
                                        </div>
                                        <div className="dash-stat-info">
                                            <span className="dash-stat-label">{card.label}</span>
                                            <span className="dash-stat-value">{card.value}</span>
                                            {card.extra}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Quick Upload */}
                            {uploadsRemaining > 0 ? (
                                <FileUpload onUploadSuccess={handleUploadSuccess} fileCount={stats.totalFiles} />
                            ) : (
                                <div className="upload-limit-reached glass-card">
                                    <div className="limit-icon-wrap">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                            <line x1="12" y1="9" x2="12" y2="13" />
                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                        </svg>
                                    </div>
                                    <div className="limit-text-content">
                                        <h3>Upload Limit Reached</h3>
                                        <p>You've used all <strong>3 free uploads</strong>. Delete a file to upload a new one.</p>
                                    </div>
                                </div>
                            )}

                            {/* File List */}
                            {loading ? (
                                <div className="dash-loading">
                                    <div className="spinner spinner-lg" />
                                    <span>Loading files...</span>
                                </div>
                            ) : (
                                <FileList files={files} onDelete={handleDelete} onRename={fetchFiles} />
                            )}
                        </>
                    )}

                    {currentPage === 'upload' && (
                        <FileUpload onUploadSuccess={handleUploadSuccess} fileCount={stats.totalFiles} />
                    )}

                    {currentPage === 'profile' && (
                        <ProfileSettings />
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
