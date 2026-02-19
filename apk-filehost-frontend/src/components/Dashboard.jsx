import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import FileUpload from './FileUpload';
import FileList from './FileList';
import ProfileSettings from './ProfileSettings';
import { BrandLogo, Grid, Upload, User, Settings, LogOut, BarChart, Package, HardDrive, Download, TrendingUp, Menu, X, Bell, Search, Star, Mail, ArrowRight } from './Icons';
import './Dashboard.css';

// WhatsApp icon SVG
const WhatsAppIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

// Phone icon SVG
const PhoneIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

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
    const [showUpgradePopup, setShowUpgradePopup] = useState(false);
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

        // Auto-refresh every 30 seconds — no reload needed
        const interval = setInterval(() => {
            fetchFiles();
            fetchStats();
        }, 30000);

        return () => clearInterval(interval);
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
    const planLimits = { free: 1, starter: 3, pro: 999 };
    const maxFiles = planLimits[user?.plan || 'free'] || 1;
    const uploadsRemaining = Math.max(0, maxFiles - stats.totalFiles);
    const planLabels = { free: 'Free', starter: 'Starter', pro: 'Pro' };
    const planColors = { free: '#94a3b8', starter: '#a78bfa', pro: '#fbbf24' };

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

                    <div className="sidebar-plan-widget">
                        <div className="plan-badge-sm" style={{ borderColor: planColors[user?.plan || 'free'], color: planColors[user?.plan || 'free'] }}>
                            {planLabels[user?.plan || 'free']} Plan
                        </div>
                        {user?.plan === 'free' && (
                            <button onClick={() => setShowUpgradePopup(true)} className="upgrade-link">Upgrade to Starter</button>
                        )}
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
                            <span className="topbar-plan-badge" style={{ background: `${planColors[user?.plan || 'free']}15`, color: planColors[user?.plan || 'free'] }}>
                                {planLabels[user?.plan || 'free']}
                            </span>
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
                                        <span className="dash-stat-value">{stats.totalFiles} / {maxFiles === 999 ? '∞' : maxFiles}</span>
                                        <span style={{ fontSize: '11px', opacity: 0.7, display: 'block', marginTop: '4px' }}>{planLabels[user?.plan || 'free']} Plan Limit</span>
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
                                <FileUpload
                                    onUploadSuccess={handleUploadSuccess}
                                    fileCount={stats.totalFiles}
                                    userPlan={user?.plan || 'free'}
                                />
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
                                        <p>You've used all <strong>{maxFiles === 999 ? '∞' : maxFiles} {planLabels[user?.plan || 'free']} uploads</strong>. Please delete a file or upgrade your plan to upload more.</p>
                                        {user?.plan === 'free' && (
                                            <button onClick={() => setShowUpgradePopup(true)} className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>
                                                Upgrade to Starter
                                            </button>
                                        )}
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
                                <FileList
                                    files={files}
                                    onDelete={handleDelete}
                                    onRename={fetchFiles}
                                    userPlan={user?.plan || 'free'}
                                />
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
            {/* Upgrade Contact Popup */}
            {showUpgradePopup && (
                <div className="upgrade-popup-overlay" onClick={() => setShowUpgradePopup(false)}>
                    <div className="upgrade-popup" onClick={(e) => e.stopPropagation()}>
                        <button className="upgrade-popup-close" onClick={() => setShowUpgradePopup(false)}>
                            <X size={20} />
                        </button>
                        <div className="upgrade-popup-header">
                            <div className="upgrade-popup-icon">
                                <Star size={28} />
                            </div>
                            <h2>Upgrade to Starter</h2>
                            <p className="upgrade-popup-price">Rs 1,000</p>
                        </div>
                        <div className="upgrade-popup-features">
                            <div className="upgrade-feature-item"><Package size={14} /> Upload up to 3 files</div>
                            <div className="upgrade-feature-item"><Download size={14} /> Unlimited downloads</div>
                            <div className="upgrade-feature-item"><HardDrive size={14} /> 5 GB storage</div>
                            <div className="upgrade-feature-item"><ArrowRight size={14} /> Protected download links</div>
                        </div>
                        <div className="upgrade-popup-divider" />
                        <p className="upgrade-popup-contact-label">Contact us to upgrade:</p>
                        <div className="upgrade-popup-contacts">
                            <a href="https://wa.me/923004503618?text=Hi%2C%20I%20want%20to%20upgrade%20to%20Starter%20plan%20on%20APKFlow" target="_blank" rel="noopener noreferrer" className="upgrade-contact-btn whatsapp-btn">
                                <WhatsAppIcon size={18} />
                                <span>WhatsApp</span>
                            </a>
                            <a href="mailto:syedmuhammadalibukhari756@gmail.com?subject=APKFlow%20Starter%20Plan%20Upgrade" className="upgrade-contact-btn email-btn">
                                <Mail size={18} />
                                <span>Email</span>
                            </a>
                            <a href="tel:+923004503618" className="upgrade-contact-btn phone-btn">
                                <PhoneIcon size={18} />
                                <span>Call</span>
                            </a>
                        </div>
                        <div className="upgrade-popup-info">
                            <p>Phone: 0300-4503618</p>
                            <p>Email: syedmuhammadali756@gmail.com</p>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Dashboard;
