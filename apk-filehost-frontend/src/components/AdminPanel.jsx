import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, User, Mail, Package, HardDrive, Download, Clock, X, AlertCircle, Check, Search, Eye, EyeOff, Copy } from './Icons';
import './AdminPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://apkflow-6e1q.vercel.app';

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
    const [targetUserId, setTargetUserId] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState('');
    const [pendingUsers, setPendingUsers] = useState([]);

    const getToken = () => sessionStorage.getItem('admin_token');

    const adminApi = axios.create({
        baseURL: API_URL,
    });

    adminApi.interceptors.request.use((config) => {
        const token = getToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });

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

    // Check existing session
    useEffect(() => {
        const token = getToken();
        if (token) {
            setIsAuthenticated(true);
            fetchUsers();
            fetchPendingUsers();
        }
    }, []);

    // Fetch all users
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

    // Fetch pending approval users
    const fetchPendingUsers = async () => {
        try {
            const res = await adminApi.get('/api/admin/pending');
            if (res.data.success) setPendingUsers(res.data.users);
        } catch (err) {
            console.error('Error fetching pending users:', err);
        }
    };

    // Approve user
    const handleApprove = async (userId) => {
        setActionLoading(true);
        try {
            await adminApi.post(`/api/admin/approve/${userId}`);
            fetchPendingUsers();
            fetchUsers();
        } catch (err) {
            console.error('Approve error:', err);
        } finally {
            setActionLoading(false);
        }
    };

    // Reject user
    const handleReject = async (userId) => {
        setActionLoading(true);
        try {
            await adminApi.post(`/api/admin/reject/${userId}`);
            fetchPendingUsers();
            fetchUsers();
        } catch (err) {
            console.error('Reject error:', err);
        } finally {
            setActionLoading(false);
        }
    };

    // View user details
    const viewUser = async (userId) => {
        try {
            const res = await adminApi.get(`/api/admin/users/${userId}`);
            if (res.data.success) {
                setSelectedUser(res.data.user);
                setUserFiles(res.data.files);
            }
        } catch (err) {
            console.error('Error fetching user:', err);
        }
    };

    // Suspend user
    const handleSuspend = async () => {
        if (!targetUserId) return;
        setActionLoading(true);
        try {
            await adminApi.post(`/api/admin/users/${targetUserId}/suspend`, {
                reason: suspendReason || 'Violated terms of service'
            });
            setShowSuspendModal(false);
            setSuspendReason('');
            setTargetUserId(null);
            fetchUsers();
            if (selectedUser && selectedUser.id === targetUserId) {
                viewUser(targetUserId);
            }
        } catch (err) {
            console.error('Suspend error:', err);
        } finally {
            setActionLoading(false);
        }
    };

    // Unsuspend user
    const handleUnsuspend = async (userId) => {
        setActionLoading(true);
        try {
            await adminApi.post(`/api/admin/users/${userId}/unsuspend`);
            fetchUsers();
            if (selectedUser && selectedUser.id === userId) {
                viewUser(userId);
            }
        } catch (err) {
            console.error('Unsuspend error:', err);
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
        return matchesSearch;
    });

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
            {/* Header */}
            <header className="admin-header">
                <div className="admin-header-left">
                    <Shield size={24} />
                    <h1>APKFlow Admin</h1>
                </div>
                <div className="admin-header-right">
                    <span className="admin-user-count">{users.length} Users</span>
                    <button className="admin-logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div className="admin-body">
                {/* Search */}
                <div className="admin-search-bar">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Stats Row */}
                <div className="admin-stats-row">
                    <div className="admin-stat">
                        <User size={18} />
                        <div>
                            <span className="admin-stat-val">{users.length}</span>
                            <span className="admin-stat-label">Total Users</span>
                        </div>
                    </div>
                    <div className="admin-stat">
                        <AlertCircle size={18} />
                        <div>
                            <span className="admin-stat-val">{users.filter(u => u.isSuspended).length}</span>
                            <span className="admin-stat-label">Suspended</span>
                        </div>
                    </div>
                    <div className="admin-stat">
                        <Clock size={18} />
                        <div>
                            <span className="admin-stat-val">{pendingUsers.length}</span>
                            <span className="admin-stat-label">Pending</span>
                        </div>
                    </div>
                    <div className="admin-stat">
                        <Package size={18} />
                        <div>
                            <span className="admin-stat-val">{users.reduce((s, u) => s + u.stats.totalFiles, 0)}</span>
                            <span className="admin-stat-label">Total Files</span>
                        </div>
                    </div>
                    <div className="admin-stat">
                        <Download size={18} />
                        <div>
                            <span className="admin-stat-val">{users.reduce((s, u) => s + u.stats.totalDownloads, 0)}</span>
                            <span className="admin-stat-label">Total Downloads</span>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="admin-filter-tabs">
                    <button
                        className={`admin-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        All ({users.length})
                    </button>
                    <button
                        className={`admin-filter-tab ${activeFilter === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('active')}
                    >
                        Active ({users.filter(u => !u.isSuspended).length})
                    </button>
                    <button
                        className={`admin-filter-tab ${activeFilter === 'suspended' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('suspended')}
                    >
                        Suspended ({users.filter(u => u.isSuspended).length})
                    </button>
                    <button
                        className={`admin-filter-tab ${activeFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('pending')}
                    >
                        Pending ({pendingUsers.length})
                    </button>
                </div>

                {/* Pending Approvals Section */}
                {activeFilter === 'pending' && pendingUsers.length > 0 && (
                    <div className="admin-pending-section">
                        <h3 className="admin-pending-title">
                            <Clock size={18} /> Pending Approvals ({pendingUsers.length})
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
                                            IP: {u.registrationIP || 'N/A'} · Registered: {formatDate(u.createdAt)}
                                        </span>
                                    </div>
                                    <div className="admin-pending-actions">
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
                                </div>
                                <div className="admin-user-email">{user.email}</div>
                            </div>
                            <div className="admin-user-meta">
                                <span>{user.stats.totalFiles} files</span>
                                <span>{formatBytes(user.stats.totalStorage)}</span>
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div className="admin-empty">No users found</div>
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
                            {/* User Info */}
                            <div className="admin-detail-section">
                                <div className="admin-detail-avatar">
                                    {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h3>{selectedUser.name}</h3>
                                    <p className="admin-detail-email">
                                        <Mail size={14} /> {selectedUser.email}
                                    </p>
                                    {selectedUser.isSuspended && (
                                        <div className="admin-suspended-badge">
                                            <AlertCircle size={14} />
                                            Suspended — {selectedUser.suspendReason || 'No reason'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Login Credentials */}
                            <div className="admin-credentials">
                                <h4>Login Credentials</h4>
                                <div className="admin-cred-row">
                                    <span className="admin-cred-label">Email:</span>
                                    <span className="admin-cred-value">{selectedUser.email}</span>
                                    <button
                                        className="admin-copy-btn"
                                        onClick={() => copyToClipboard(selectedUser.email, 'email')}
                                    >
                                        {copied === 'email' ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                                <div className="admin-cred-row">
                                    <span className="admin-cred-label">Password:</span>
                                    <span className="admin-cred-value">
                                        {showPassword ? (selectedUser.password || '—') : '••••••••'}
                                    </span>
                                    <button
                                        className="admin-copy-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    {showPassword && selectedUser.password && (
                                        <button
                                            className="admin-copy-btn"
                                            onClick={() => copyToClipboard(selectedUser.password, 'password')}
                                        >
                                            {copied === 'password' ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Detail Stats */}
                            <div className="admin-detail-stats">
                                <div className="admin-detail-stat">
                                    <Clock size={16} />
                                    <span>Joined: {formatDate(selectedUser.createdAt)}</span>
                                </div>
                                <div className="admin-detail-stat">
                                    <Clock size={16} />
                                    <span>Last Login: {formatDate(selectedUser.lastLogin)}</span>
                                </div>
                            </div>

                            {/* Files */}
                            <div className="admin-files-section">
                                <h4>Files ({userFiles.length})</h4>
                                {userFiles.length > 0 ? (
                                    <div className="admin-files-list">
                                        {userFiles.map(file => (
                                            <div key={file.id} className={`admin-file-row ${!file.isActive ? 'inactive' : ''}`}>
                                                <Package size={16} />
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
                                        className="admin-btn admin-btn-danger"
                                        onClick={() => {
                                            setTargetUserId(selectedUser.id);
                                            setShowSuspendModal(true);
                                        }}
                                    >
                                        <AlertCircle size={16} />
                                        Suspend Account
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspend Confirmation Modal */}
            {showSuspendModal && (
                <div className="admin-modal-overlay" onClick={() => setShowSuspendModal(false)}>
                    <div className="admin-suspend-modal" onClick={e => e.stopPropagation()}>
                        <h3>Suspend User</h3>
                        <p>This will block login and deactivate all files.</p>
                        <input
                            type="text"
                            placeholder="Reason for suspension (optional)"
                            value={suspendReason}
                            onChange={e => setSuspendReason(e.target.value)}
                            className="admin-suspend-input"
                        />
                        <div className="admin-suspend-actions">
                            <button className="admin-btn admin-btn-ghost" onClick={() => setShowSuspendModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="admin-btn admin-btn-danger"
                                onClick={handleSuspend}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Suspending...' : 'Confirm Suspend'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
