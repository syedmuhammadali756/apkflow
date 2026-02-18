import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import FileUpload from './FileUpload';
import FileList from './FileList';
import ProfileSettings from './ProfileSettings';
import { BrandLogo, Grid, Upload, User, Settings, LogOut, BarChart, Package, HardDrive, Download, TrendingUp, Menu, X, Bell, Search } from './Icons';
import './Dashboard.css';

// Simple bar chart component
const MiniChart = ({ data = [] }) => {
    const max = Math.max(...data.map(d => d.downloads), 1);
    return (
        <div className="mini-chart">
            <div className="chart-bars">
                {data.map((d, i) => (
                    <div key={i} className="chart-bar-wrap" title={`${d.label}: ${d.downloads} downloads`}>
                        <div
                            className="chart-bar"
                            style={{
                                height: `${Math.max((d.downloads / max) * 100, 4)}%`,
                                background: d.downloads > 0 ? 'linear-gradient(to top, #7c3aed, #a78bfa)' : 'rgba(124, 58, 237, 0.15)'
                            }}
                        />
                        <span className="chart-label">{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Storage ring component
const StorageRing = ({ used, total, formatBytes }) => {
    const percent = Math.min((used / total) * 100, 100);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (percent / 100) * circumference;
    const color = percent > 90 ? '#ef4444' : percent > 70 ? '#f59e0b' : '#7c3aed';

    return (
        <div className="storage-ring-container">
            <svg viewBox="0 0 100 100" className="storage-ring-svg">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(124,58,237,0.1)" strokeWidth="8" />
                <circle
                    cx="50" cy="50" r={radius} fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
            </svg>
            <div className="storage-ring-text">
                <span className="storage-ring-percent">{Math.round(percent)}%</span>
                <span className="storage-ring-label">used</span>
            </div>
        </div>
    );
};

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
        downloadsToday: 0,
        chartData: [],
        topFiles: [],
        recentActivity: []
    });

    useEffect(() => {
        setCurrentPage(activePage);
    }, [activePage]);

    useEffect(() => {
        fetchFiles();
        fetchStats();
    }, []);

    const fetchFiles = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/files`);
            if (response.data.success) {
                setFiles(response.data.files);
            }
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/stats/overview`);
            if (response.data.success) {
                const s = response.data.stats;
                setStats({
                    totalFiles: s.totalFiles || 0,
                    totalDownloads: s.totalDownloads || 0,
                    storageUsed: s.storageUsed || 0,
                    storageLimit: s.storageQuota || 5 * 1024 * 1024 * 1024,
                    downloadsToday: s.downloadsToday || 0,
                    chartData: s.chartData || [],
                    topFiles: s.topFiles || [],
                    recentActivity: s.recentActivity || []
                });
            }
        } catch (error) {
            console.error('Stats error:', error);
            // Fallback to file-level data
        }
    };

    const handleUploadSuccess = () => { fetchFiles(); fetchStats(); };

    const handleDelete = async (fileId) => {
        if (!window.confirm('Are you sure you want to delete this file?')) return;
        try {
            const response = await axios.delete(`${API_URL}/api/files/${fileId}`);
            if (response.data.success) { fetchFiles(); fetchStats(); }
        } catch (error) {
            alert('Error deleting file: ' + (error.response?.data?.message || error.message));
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
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
                                <div className="dash-stat-card glass-card">
                                    <div className="dash-stat-icon" style={{ background: '#7c3aed15', color: '#7c3aed' }}>
                                        <Package size={22} />
                                    </div>
                                    <div className="dash-stat-info">
                                        <span className="dash-stat-label">Total Files</span>
                                        <span className="dash-stat-value">{stats.totalFiles} / 3</span>
                                        <span style={{ fontSize: '11px', opacity: 0.7, display: 'block', marginTop: '4px' }}>Free Plan Limit</span>
                                    </div>
                                </div>

                                <div className="dash-stat-card glass-card">
                                    <div className="dash-stat-icon" style={{ background: '#06b6d415', color: '#06b6d4' }}>
                                        <Download size={22} />
                                    </div>
                                    <div className="dash-stat-info">
                                        <span className="dash-stat-label">Total Downloads</span>
                                        <span className="dash-stat-value">{stats.totalDownloads.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="dash-stat-card glass-card">
                                    <div className="dash-stat-icon" style={{ background: '#10b98115', color: '#10b981' }}>
                                        <TrendingUp size={22} />
                                    </div>
                                    <div className="dash-stat-info">
                                        <span className="dash-stat-label">Today</span>
                                        <span className="dash-stat-value">{stats.downloadsToday}</span>
                                        <span style={{ fontSize: '11px', opacity: 0.7, display: 'block', marginTop: '4px' }}>downloads today</span>
                                    </div>
                                </div>

                                <div className="dash-stat-card glass-card">
                                    <div className="dash-stat-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}>
                                        <HardDrive size={22} />
                                    </div>
                                    <div className="dash-stat-info">
                                        <span className="dash-stat-label">Storage</span>
                                        <span className="dash-stat-value">{formatBytes(stats.storageUsed)}</span>
                                        <div className="mini-progress">
                                            <div className="mini-progress-bar" style={{ width: `${storagePercentage}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Storage Warning Banner */}
                            {storagePercentage > 85 && (
                                <div className="storage-warning-banner glass-card">
                                    <div className="warning-icon-wrap">
                                        <HardDrive size={24} />
                                    </div>
                                    <div className="warning-text">
                                        <h4>Running out of storage!</h4>
                                        <p>You've used {Math.round(storagePercentage)}% of your free 5GB. Consider deleting old builds.</p>
                                    </div>
                                    <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage('upload')}>Manage Files</button>
                                </div>
                            )}

                            <div className="dash-engagement-row">
                                {/* Quick Actions */}
                                <div className="glass-card dash-engagement-card">
                                    <div className="dash-card-header">
                                        <h3>Quick Actions</h3>
                                    </div>
                                    <div className="quick-actions-grid">
                                        <button className="quick-action-btn" onClick={() => setCurrentPage('upload')}>
                                            <div className="qa-icon" style={{ background: '#7c3aed15', color: '#7c3aed' }}><Upload size={20} /></div>
                                            <span>Upload APK</span>
                                        </button>
                                        <button className="quick-action-btn" onClick={() => navigate('/blog')}>
                                            <div className="qa-icon" style={{ background: '#06b6d415', color: '#06b6d4' }}><Package size={20} /></div>
                                            <span>Guides</span>
                                        </button>
                                        <button className="quick-action-btn" onClick={() => setCurrentPage('profile')}>
                                            <div className="qa-icon" style={{ background: '#10b98115', color: '#10b981' }}><Settings size={20} /></div>
                                            <span>Settings</span>
                                        </button>
                                        <button className="quick-action-btn" onClick={() => navigate('/')}>
                                            <div className="qa-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><Bell size={20} /></div>
                                            <span>Updates</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="glass-card dash-engagement-card">
                                    <div className="dash-card-header">
                                        <h3>Recent Activity</h3>
                                        <span className="dash-chart-total">Live Feed</span>
                                    </div>
                                    <div className="activity-feed">
                                        {stats.recentActivity.map(act => (
                                            <div key={act.id} className="activity-item">
                                                <div className={`activity-icon-dot ${act.type}`} />
                                                <div className="activity-content">
                                                    <p className="activity-text">{act.text}</p>
                                                    <span className="activity-time">{act.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="dash-charts-row">
                                {/* Downloads Chart */}
                                <div className="glass-card dash-chart-card">
                                    <div className="dash-chart-header">
                                        <h3><BarChart size={18} /> Downloads — Last 7 Days</h3>
                                        <span className="dash-chart-total">
                                            {stats.chartData.reduce((s, d) => s + d.downloads, 0)} total
                                        </span>
                                    </div>
                                    <MiniChart data={stats.chartData} />
                                </div>

                                {/* Storage Ring + Top Files */}
                                <div className="glass-card dash-chart-card">
                                    <div className="dash-chart-header">
                                        <h3><HardDrive size={18} /> Storage & Top Files</h3>
                                    </div>
                                    <div className="dash-storage-top">
                                        <StorageRing
                                            used={stats.storageUsed}
                                            total={stats.storageLimit}
                                            formatBytes={formatBytes}
                                        />
                                        <div className="top-files-list">
                                            {stats.topFiles.length > 0 ? stats.topFiles.map((f, i) => (
                                                <div key={i} className="top-file-item">
                                                    <span className="top-file-rank">#{i + 1}</span>
                                                    <div className="top-file-info">
                                                        <span className="top-file-name">{f.name}</span>
                                                        <span className="top-file-meta">{f.downloads} downloads • {formatBytes(f.size)}</span>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="top-files-empty">No files yet. Upload your first APK!</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
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
            </main >
        </div >
    );
};

export default Dashboard;
