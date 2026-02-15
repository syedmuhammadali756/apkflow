import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Configure axios defaults
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            if (!token) { setLoading(false); return; }
            try {
                const response = await axios.get(`${API_URL}/api/auth/me`);
                if (response.data.success) {
                    setUser(response.data.user);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                logout();
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
            if (response.data.success) {
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                setToken(token);
                setUser(user);
                setIsAuthenticated(true);
                return { success: true };
            }
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (name, email, password) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
            if (response.data.success) {
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                setToken(token);
                setUser(user);
                setIsAuthenticated(true);
                return { success: true };
            }
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateProfile = async (name, email) => {
        try {
            const response = await axios.put(`${API_URL}/api/auth/profile`, { name, email });
            if (response.data.success) {
                setUser(response.data.user);
                return { success: true };
            }
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Update failed' };
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            const response = await axios.put(`${API_URL}/api/auth/password`, { currentPassword, newPassword });
            return response.data;
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Password change failed' };
        }
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        API_URL
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
