import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { User, Mail, Lock, Check, AlertCircle, HardDrive, Package, Clock } from './Icons';
import './ProfileSettings.css';

const ProfileSettings = () => {
    const { user, API_URL } = useAuth();
    const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [stats, setStats] = useState({
        filesCount: 0,
        storageUsed: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch stats from files API to ensure they are live
                const response = await axios.get(`${API_URL}/api/files?limit=1`);
                if (response.data.success) {
                    const backendStats = response.data.stats || {};
                    setStats({
                        filesCount: backendStats.totalFiles || 0,
                        storageUsed: backendStats.totalStorageUsed || 0
                    });
                }
            } catch (error) {
                console.error('Error fetching profile stats:', error);
            }
        };

        if (user) {
            setProfile({ name: user.name || '', email: user.email || '' });
            fetchStats();
        }
    }, [user, API_URL]);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMsg({ type: '', text: '' });
        try {
            const response = await axios.put(`${API_URL}/api/auth/profile`, profile);
            if (response.data.success) {
                setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
            }
        } catch (err) {
            setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (passwords.new.length < 6) {
            setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }
        setSavingPassword(true);
        setPasswordMsg({ type: '', text: '' });
        try {
            const response = await axios.put(`${API_URL}/api/auth/password`, {
                currentPassword: passwords.current,
                newPassword: passwords.new,
            });
            if (response.data.success) {
                setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
                setPasswords({ current: '', new: '', confirm: '' });
            }
        } catch (err) {
            setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
        } finally {
            setSavingPassword(false);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    };

    return (
        <div className="profile-page">
            {/* Profile Header */}
            <div className="profile-header glass-card">
                <div className="profile-avatar-lg">
                    {getInitials(user?.name)}
                </div>
                <div className="profile-header-info">
                    <h2>{user?.name}</h2>
                    <p>{user?.email}</p>
                    <div className="profile-badges">
                        <span className="badge">Free Plan</span>
                        <span className="badge">Active</span>
                    </div>
                </div>
            </div>

            {/* Account Stats */}
            <div className="profile-stats">
                <div className="profile-stat glass-card">
                    <Package size={20} />
                    <div>
                        <span className="ps-label">Files</span>
                        <span className="ps-value">{stats.filesCount}</span>
                    </div>
                </div>
                <div className="profile-stat glass-card">
                    <HardDrive size={20} />
                    <div>
                        <span className="ps-label">Storage</span>
                        <span className="ps-value">{formatBytes(stats.storageUsed)}</span>
                    </div>
                </div>
                <div className="profile-stat glass-card">
                    <Clock size={20} />
                    <div>
                        <span className="ps-label">Joined</span>
                        <span className="ps-value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className="settings-grid">
                {/* Profile Info */}
                <div className="settings-card glass-card">
                    <h3>Profile Information</h3>
                    <form onSubmit={handleProfileSave}>
                        <div className="settings-field">
                            <label>Full Name</label>
                            <div className="input-wrapper">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    placeholder="Your name"
                                />
                            </div>
                        </div>
                        <div className="settings-field">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>
                        {profileMsg.text && (
                            <div className={`settings-msg ${profileMsg.type}`}>
                                {profileMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                {profileMsg.text}
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                            {savingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="settings-card glass-card">
                    <h3>Change Password</h3>
                    <form onSubmit={handlePasswordChange}>
                        <div className="settings-field">
                            <label>Current Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>
                        </div>
                        <div className="settings-field">
                            <label>New Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                    placeholder="Min. 6 characters"
                                    required
                                />
                            </div>
                        </div>
                        <div className="settings-field">
                            <label>Confirm New Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                        </div>
                        {passwordMsg.text && (
                            <div className={`settings-msg ${passwordMsg.type}`}>
                                {passwordMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                {passwordMsg.text}
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                            {savingPassword ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
