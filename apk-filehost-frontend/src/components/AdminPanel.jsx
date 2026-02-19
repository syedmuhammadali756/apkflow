import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Shield, User, Mail, Package, HardDrive, Download, Clock, X, AlertCircle, Check, Search, Eye, EyeOff, Copy, LogOut, TrendingUp } from './Icons';
import './AdminPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://apkflow-6e1q.vercel.app';

// Trash icon (not in Icons.jsx)
const Trash2 = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

const AdminPanel = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userFiles, setUserFiles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [suspendReason, setSuspendReason] = useState('');
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [removeConfirmText, setRemoveConfirmText] = useState('');
    const [targetUserId, setTargetUserId] = useState(null);
    const [targetUserName, setTargetUserName] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [planFilter, setPlanFilter] = useState('all');
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState('');
    const [pendingUsers, setPendingUsers] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [approvePlan, setApprovePlan] = useState({});

    const getToken = () => sessionStorage.getItem('admin_token');

    const adminApi = axios.create({ baseURL: API_URL });
    adminApi.interceptors.request.use((config) => {
        const token = getToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });

    // Toast system
    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    // Login
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/admin/login`, { code });
            sessionStorage.setItem('admin_token', res.data.token);
            setIsAuthenticated(true);
            fetchUsers();
            fetchPendingUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = getToken();
        if (token) {
            setIsAuthenticated(true);
            fetchUsers();
            fetchPendingUsers();

            // Auto-refresh every 10 seconds — no reload needed
            const interval = setInterval(() => {
                fetchUsers();
                fetchPendingUsers();
            }, 10000);

            return () => clearInterval(interval);
        }
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await adminApi.get('/api/admin/users');
            if (res.data.success) setUsers(res.data.users);
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                sessionStorage.removeItem('admin_token');
                setIsAuthenticated(false);
            }
        }
    };

    const fetchPendingUsers = async () => {
        try {
            const res = await adminApi.get('/api/admin/pending');
            if (res.data.success) setPendingUsers(res.data.users);
        } catch (err) {
            console.error('Error fetching pending users:', err);
        }
    };

    const handleApprove = async (userId) => {
        setActionLoading(true);
        try {
            const plan = approvePlan[userId] || 'free';
            const res = await adminApi.post(`/api/admin/approve/${userId}`, { plan });
            showToast(res.data.message || 'User approved successfully');
            fetchPendingUsers();
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to approve', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangePlan = async (userId, newPlan) => {
        setActionLoading(true);
        try {
            const res = await adminApi.post(`/api/admin/users/${userId}/change-plan`, { plan: newPlan });
            showToast(res.data.message || 'Plan changed successfully');
            fetchUsers();
            // Refresh selected user details if open
            if (selectedUser && selectedUser.id === userId) {
                viewUser(userId);
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to change plan', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (userId) => {
        setActionLoading(true);
        try {
            const res = await adminApi.post(`/api/admin/reject/${userId}`);
            showToast(res.data.message || 'User rejected', 'warning');
            fetchPendingUsers();
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to reject', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const viewUser = async (userId) => {
        try {
            const res = await adminApi.get(`/api/admin/users/${userId}`);
            if (res.data.success) {
                setSelectedUser(res.data.user);
                setUserFiles(res.data.files);
                setShowPassword(false);
            }
        } catch (err) {
            showToast('Failed to load user details', 'error');
        }
    };

    const handleSuspend = async () => {
        if (!targetUserId) return;
        setActionLoading(true);
        try {
            const res = await adminApi.post(`/api/admin/users/${targetUserId}/suspend`, {
                reason: suspendReason || 'Violated terms of service'
            });
            showToast(res.data.message || 'User suspended & email sent', 'warning');
            setShowSuspendModal(false);
            setSuspendReason('');
            setTargetUserId(null);
            fetchUsers();
            if (selectedUser && selectedUser.id === targetUserId) viewUser(targetUserId);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to suspend', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnsuspend = async (userId) => {
        setActionLoading(true);
        try {
            const res = await adminApi.post(`/api/admin/users/${userId}/unsuspend`);
            showToast(res.data.message || 'User unsuspended', 'success');
            fetchUsers();
            if (selectedUser && selectedUser.id === userId) viewUser(userId);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to unsuspend', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Permanent removal
    const handleRemovePermanently = async () => {
        if (!targetUserId || removeConfirmText !== 'DELETE') return;
        setActionLoading(true);
        try {
            const res = await adminApi.delete(`/api/admin/users/${targetUserId}`);
            showToast(
                `${res.data.message} — ${res.data.deletedFiles} files, ${res.data.deletedLogs} logs removed`,
                'success'
            );
            setShowRemoveModal(false);
            setRemoveConfirmText('');
            setTargetUserId(null);
            setTargetUserName('');
            setSelectedUser(null);
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to remove user', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeFilter === 'suspended') return matchesSearch && u.isSuspended;
        if (activeFilter === 'active') return matchesSearch && !u.isSuspended;
        if (activeFilter === 'pending') return matchesSearch && (u.accountStatus === 'pending_approval' || u.accountStatus === 'pending_verification');
        // Plan filters
        if (planFilter !== 'all') return matchesSearch && (u.plan || 'free') === planFilter;
        return matchesSearch;
    });

    const planColors = { free: '#64748b', starter: '#a78bfa', pro: '#fbbf24' };
    const planLabels = { free: 'Free', starter: 'Starter', pro: 'Pro' };

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(''), 2000);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('admin_token');
        setIsAuthenticated(false);
        setUsers([]);
        setSelectedUser(null);
    };

    const totalStorage = users.reduce((s, u) => s + (u.stats?.totalStorage || 0), 0);
    const totalFiles = users.reduce((s, u) => s + (u.stats?.totalFiles || 0), 0);
    const totalDownloads = users.reduce((s, u) => s + (u.stats?.totalDownloads || 0), 0);

    // =================== LOGIN GATE ===================
    if (!isAuthenticated) {
        return (
            <div className="admin-login-page">
                <div className="admin-glow purple" />
                <div className="admin-glow cyan" />
                <div className="admin-login-card">
                    <div className="admin-login-header">
                        <div className="admin-shield-icon">
                            <Shield size={32} />
                        </div>
                        <h1>Admin Access</h1>
                        <p>Enter the admin code to continue</p>
                    </div>
                    <form onSubmit={handleLogin}>
                        <div className="admin-code-input-wrap">
                            <input
                                type="password"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Enter admin code"
                                autoFocus
                                className="admin-code-input"
                            />
                        </div>
                        {error && (
                            <div className="admin-error">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                        <button type="submit" className="admin-login-btn" disabled={loading || !code}>
                            {loading ? 'Verifying...' : 'Enter Admin Panel'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // =================== ADMIN DASHBOARD ===================
    return (
        <div className="admin-page">
            {/* Toast Notifications */}
            <div className="admin-toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`admin-toast admin-toast-${t.type}`}>
                        {t.type === 'success' && <Check size={16} />}
                        {t.type === 'error' && <AlertCircle size={16} />}
                        {t.type === 'warning' && <AlertCircle size={16} />}
                        <span>{t.message}</span>
                        <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Header */}
            <header className="admin-header">
                <div className="admin-header-left">
                    <div className="admin-header-logo">
                        <Shield size={22} />
                    </div>
                    <div>
                        <h1>APKFlow Admin</h1>
                        <span className="admin-header-subtitle">Management Console</span>
                    </div>
                </div>
                <div className="admin-header-right">
                    <div className="admin-header-badge">
                        <User size={14} />
                        <span>{users.length} Users</span>
                    </div>
                    <button className="admin-logout-btn" onClick={handleLogout}>
                        <LogOut size={14} />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <div className="admin-body">
                {/* Stats Grid */}
                <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon-wrap" style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa' }}>
                            <User size={20} />
                        </div>
                        <div className="admin-stat-content">
                            <span className="admin-stat-val">{users.length}</span>
                            <span className="admin-stat-label">Total Users</span>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon-wrap" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                            <AlertCircle size={20} />
                        </div>
                        <div className="admin-stat-content">
                            <span className="admin-stat-val">{users.filter(u => u.isSuspended).length}</span>
                            <span className="admin-stat-label">Suspended</span>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon-wrap" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
                            <Clock size={20} />
                        </div>
                        <div className="admin-stat-content">
                            <span className="admin-stat-val">{pendingUsers.length}</span>
                            <span className="admin-stat-label">Pending</span>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon-wrap" style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee' }}>
                            <Package size={20} />
                        </div>
                        <div className="admin-stat-content">
                            <span className="admin-stat-val">{totalFiles}</span>
                            <span className="admin-stat-label">Total Files</span>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>
                            <Download size={20} />
                        </div>
                        <div className="admin-stat-content">
                            <span className="admin-stat-val">{totalDownloads.toLocaleString()}</span>
                            <span className="admin-stat-label">Downloads</span>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon-wrap" style={{ background: 'rgba(249,115,22,0.1)', color: '#fb923c' }}>
                            <HardDrive size={20} />
                        </div>
                        <div className="admin-stat-content">
                            <span className="admin-stat-val">{formatBytes(totalStorage)}</span>
                            <span className="admin-stat-label">Storage Used</span>
                        </div>
                    </div>
                </div>

                {/* Search + Filters */}
                <div className="admin-toolbar">
                    <div className="admin-search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="admin-search-clear" onClick={() => setSearchTerm('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="admin-filter-tabs">
                        {[
                            { id: 'all', label: 'All', count: users.length },
                            { id: 'active', label: 'Active', count: users.filter(u => !u.isSuspended).length },
                            { id: 'suspended', label: 'Suspended', count: users.filter(u => u.isSuspended).length },
                            { id: 'pending', label: 'Pending', count: pendingUsers.length }
                        ].map(f => (
                            <button
                                key={f.id}
                                className={`admin-filter-tab ${activeFilter === f.id ? 'active' : ''}`}
                                onClick={() => { setActiveFilter(f.id); setPlanFilter('all'); }}
                            >
                                {f.label} <span className="admin-filter-count">{f.count}</span>
                            </button>
                        ))}
                        <span style={{ width: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />
                        {[
                            { id: 'all', label: '📋 All Plans' },
                            { id: 'free', label: '🆓 Free', count: users.filter(u => (u.plan || 'free') === 'free').length },
                            { id: 'starter', label: '⭐ Starter', count: users.filter(u => u.plan === 'starter').length },
                            { id: 'pro', label: '🚀 Pro', count: users.filter(u => u.plan === 'pro').length }
                        ].map(f => (
                            <button
                                key={`plan-${f.id}`}
                                className={`admin-filter-tab ${planFilter === f.id ? 'active' : ''}`}
                                onClick={() => { setPlanFilter(f.id); setActiveFilter('all'); }}
                            >
                                {f.label} {f.count !== undefined && <span className="admin-filter-count">{f.count}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pending Approvals Section */}
                {activeFilter === 'pending' && pendingUsers.length > 0 && (
                    <div className="admin-pending-section">
                        <h3 className="admin-pending-title">
                            <Clock size={18} /> Pending Approvals
                        </h3>
                        <div className="admin-pending-list">
                            {pendingUsers.map(u => (
                                <div key={u.id} className="admin-pending-card">
                                    <div className="admin-user-avatar">
                                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="admin-pending-info">
                                        <strong>{u.name}</strong>
                                        <span>{u.email}</span>
                                        <span className="admin-pending-meta">
                                            IP: {u.registrationIP || 'N/A'} · {formatDate(u.createdAt)}
                                        </span>
                                    </div>
                                    <div className="admin-pending-actions">
                                        <select
                                            className="admin-plan-select"
                                            value={approvePlan[u.id] || 'free'}
                                            onChange={(e) => setApprovePlan(prev => ({ ...prev, [u.id]: e.target.value }))}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="free">🆓 Free Plan</option>
                                            <option value="starter">⭐ Starter Plan</option>
                                        </select>
                                        <button
                                            className="admin-btn admin-btn-success admin-btn-sm"
                                            onClick={() => handleApprove(u.id)}
                                            disabled={actionLoading}
                                        >
                                            <Check size={14} /> Approve
                                        </button>
                                        <button
                                            className="admin-btn admin-btn-danger admin-btn-sm"
                                            onClick={() => handleReject(u.id)}
                                            disabled={actionLoading}
                                        >
                                            <X size={14} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* User List */}
                <div className="admin-user-list">
                    {filteredUsers.map(user => (
                        <div
                            key={user.id}
                            className={`admin-user-card ${user.isSuspended ? 'suspended' : ''} ${selectedUser?.id === user.id ? 'selected' : ''}`}
                            onClick={() => viewUser(user.id)}
                        >
                            <div className="admin-user-avatar">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="admin-user-info">
                                <div className="admin-user-name">
                                    {user.name}
                                    {user.isSuspended && <span className="badge-suspended">Suspended</span>}
                                    {user.accountStatus === 'pending_approval' && <span className="badge-pending">Pending</span>}
                                    {user.accountStatus === 'pending_verification' && <span className="badge-unverified">Unverified</span>}
                                    {user.accountStatus === 'rejected' && <span className="badge-rejected">Rejected</span>}
                                    <span className="badge-plan" style={{ background: `${planColors[user.plan || 'free']}22`, color: planColors[user.plan || 'free'], borderColor: `${planColors[user.plan || 'free']}44` }}>
                                        {planLabels[user.plan || 'free']}
                                    </span>
                                </div>
                                <div className="admin-user-email">{user.email}</div>
                            </div>
                            <div className="admin-user-meta">
                                <span><Package size={12} /> {user.stats.totalFiles}</span>
                                <span><HardDrive size={12} /> {formatBytes(user.stats.totalStorage)}</span>
                                <span><Download size={12} /> {user.stats.totalDownloads}</span>
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div className="admin-empty">
                            <Search size={32} />
                            <p>No users found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>User Details</h2>
                            <button className="admin-modal-close" onClick={() => setSelectedUser(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="admin-modal-body">
                            {/* User Profile Section */}
                            <div className="admin-detail-profile">
                                <div className="admin-detail-avatar">
                                    {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="admin-detail-info">
                                    <h3>{selectedUser.name}</h3>
                                    <p className="admin-detail-email">
                                        <Mail size={14} /> {selectedUser.email}
                                    </p>
                                    <div className="admin-status-badges">
                                        {selectedUser.isSuspended ? (
                                            <span className="badge-suspended-lg">
                                                <AlertCircle size={12} /> Suspended
                                            </span>
                                        ) : (
                                            <span className="badge-active-lg">
                                                <Check size={12} /> Active
                                            </span>
                                        )}
                                        <span className={`badge-status-${selectedUser.accountStatus}`}>
                                            {selectedUser.accountStatus}
                                        </span>
                                        <span className="badge-plan-lg" style={{ background: `${planColors[selectedUser.plan || 'free']}22`, color: planColors[selectedUser.plan || 'free'], borderColor: `${planColors[selectedUser.plan || 'free']}44` }}>
                                            {planLabels[selectedUser.plan || 'free']} Plan
                                        </span>
                                    </div>
                                    {selectedUser.isSuspended && selectedUser.suspendReason && (
                                        <div className="admin-suspend-reason">
                                            Reason: {selectedUser.suspendReason}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Login Credentials */}
                            <div className="admin-credentials">
                                <h4><Eye size={14} /> Login Credentials</h4>
                                <div className="admin-cred-row">
                                    <span className="admin-cred-label">Email</span>
                                    <span className="admin-cred-value">{selectedUser.email}</span>
                                    <button
                                        className="admin-copy-btn"
                                        onClick={() => copyToClipboard(selectedUser.email, 'email')}
                                        title="Copy"
                                    >
                                        {copied === 'email' ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                                <div className="admin-cred-row">
                                    <span className="admin-cred-label">Password</span>
                                    <span className="admin-cred-value">
                                        {showPassword ? (selectedUser.password || '—') : '••••••••'}
                                    </span>
                                    <button
                                        className="admin-copy-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? 'Hide' : 'Show'}
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    {showPassword && selectedUser.password && (
                                        <button
                                            className="admin-copy-btn"
                                            onClick={() => copyToClipboard(selectedUser.password, 'password')}
                                            title="Copy"
                                        >
                                            {copied === 'password' ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Detail Stats */}
                            <div className="admin-detail-meta">
                                <div className="admin-meta-item">
                                    <Clock size={14} />
                                    <span>Joined: {formatDate(selectedUser.createdAt)}</span>
                                </div>
                                <div className="admin-meta-item">
                                    <Clock size={14} />
                                    <span>Last Login: {formatDate(selectedUser.lastLogin)}</span>
                                </div>
                                {selectedUser.registrationIP && (
                                    <div className="admin-meta-item">
                                        <TrendingUp size={14} />
                                        <span>IP: {selectedUser.registrationIP}</span>
                                    </div>
                                )}
                            </div>

                            {/* Files */}
                            <div className="admin-files-section">
                                <h4><Package size={14} /> Files ({userFiles.length})</h4>
                                {userFiles.length > 0 ? (
                                    <div className="admin-files-list">
                                        {userFiles.map(file => (
                                            <div key={file.id} className={`admin-file-row ${!file.isActive ? 'inactive' : ''}`}>
                                                <Package size={14} />
                                                <div className="admin-file-info">
                                                    <span className="admin-file-name">{file.originalName}</span>
                                                    <span className="admin-file-meta">
                                                        {formatBytes(file.fileSize)} · {file.downloadCount} downloads
                                                        {!file.isActive && ' · Deactivated'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="admin-empty-small">No files uploaded</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="admin-actions">
                                {/* Change Plan */}
                                <div className="admin-change-plan-row">
                                    <label>Change Plan:</label>
                                    <select
                                        className="admin-plan-select"
                                        value={selectedUser.plan || 'free'}
                                        onChange={(e) => handleChangePlan(selectedUser.id, e.target.value)}
                                        disabled={actionLoading}
                                    >
                                        <option value="free">🆓 Free</option>
                                        <option value="starter">⭐ Starter</option>
                                        <option value="pro">🚀 Pro (Coming Soon)</option>
                                    </select>
                                </div>
                                <div className="admin-actions-row">
                                    {selectedUser.isSuspended ? (
                                        <button
                                            className="admin-btn admin-btn-success"
                                            onClick={() => handleUnsuspend(selectedUser.id)}
                                            disabled={actionLoading}
                                        >
                                            <Check size={16} />
                                            {actionLoading ? 'Processing...' : 'Unsuspend Account'}
                                        </button>
                                    ) : (
                                        <button
                                            className="admin-btn admin-btn-warning"
                                            onClick={() => {
                                                setTargetUserId(selectedUser.id);
                                                setShowSuspendModal(true);
                                            }}
                                        >
                                            <AlertCircle size={16} />
                                            Suspend Account
                                        </button>
                                    )}
                                    <button
                                        className="admin-btn admin-btn-danger"
                                        onClick={() => {
                                            setTargetUserId(selectedUser.id);
                                            setTargetUserName(selectedUser.name);
                                            setRemoveConfirmText('');
                                            setShowRemoveModal(true);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        Remove Permanently
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspend Confirmation Modal */}
            {showSuspendModal && (
                <div className="admin-modal-overlay" onClick={() => setShowSuspendModal(false)}>
                    <div className="admin-confirm-modal admin-confirm-warning" onClick={e => e.stopPropagation()}>
                        <div className="admin-confirm-icon warning">
                            <AlertCircle size={28} />
                        </div>
                        <h3>Suspend User</h3>
                        <p>This will block login, deactivate all files, and send a suspension email to the user.</p>
                        <input
                            type="text"
                            placeholder="Reason for suspension (optional)"
                            value={suspendReason}
                            onChange={e => setSuspendReason(e.target.value)}
                            className="admin-confirm-input"
                        />
                        <div className="admin-confirm-actions">
                            <button className="admin-btn admin-btn-ghost" onClick={() => setShowSuspendModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="admin-btn admin-btn-warning"
                                onClick={handleSuspend}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Suspending...' : 'Confirm Suspend'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Permanently Confirmation Modal */}
            {showRemoveModal && (
                <div className="admin-modal-overlay" onClick={() => setShowRemoveModal(false)}>
                    <div className="admin-confirm-modal admin-confirm-danger" onClick={e => e.stopPropagation()}>
                        <div className="admin-confirm-icon danger">
                            <Trash2 size={28} />
                        </div>
                        <h3>Remove User Permanently</h3>
                        <p>
                            This will <strong>permanently delete</strong> <em>{targetUserName}</em> and all their data:
                        </p>
                        <ul className="admin-remove-list">
                            <li>User account and credentials</li>
                            <li>All uploaded files (from cloud storage)</li>
                            <li>All download logs and analytics</li>
                        </ul>
                        <div className="admin-remove-warning">
                            ⚠️ This action is <strong>irreversible</strong>. Type <code>DELETE</code> to confirm.
                        </div>
                        <input
                            type="text"
                            placeholder='Type "DELETE" to confirm'
                            value={removeConfirmText}
                            onChange={e => setRemoveConfirmText(e.target.value.toUpperCase())}
                            className="admin-confirm-input admin-confirm-input-danger"
                        />
                        <div className="admin-confirm-actions">
                            <button className="admin-btn admin-btn-ghost" onClick={() => setShowRemoveModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="admin-btn admin-btn-danger"
                                onClick={handleRemovePermanently}
                                disabled={actionLoading || removeConfirmText !== 'DELETE'}
                            >
                                {actionLoading ? 'Removing...' : 'Remove Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
