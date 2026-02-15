import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrandLogo, Menu, X, User, ChevronDown, LogOut, Settings } from './Icons';
import './Header.css';

const Header = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
        setDropdownOpen(false);
    }, [location]);

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/blog', label: 'Blog' },
        { path: '/about', label: 'About' },
    ];

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
    };

    return (
        <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
            <div className="header-inner container">
                <Link to="/" className="header-brand">
                    <BrandLogo size={36} />
                    <span className="brand-name">APKFlow</span>
                </Link>

                <nav className={`header-nav ${mobileOpen ? 'open' : ''}`}>
                    <ul className="nav-list">
                        {navLinks.map((link) => (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="nav-actions">
                        {isAuthenticated ? (
                            <div className="user-dropdown">
                                <button
                                    className="user-trigger"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                >
                                    <div className="user-avatar">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="user-name">{user?.name}</span>
                                    <ChevronDown size={16} />
                                </button>

                                {dropdownOpen && (
                                    <div className="dropdown-menu">
                                        <Link to="/dashboard" className="dropdown-item">
                                            <User size={16} />
                                            Dashboard
                                        </Link>
                                        <Link to="/profile" className="dropdown-item">
                                            <Settings size={16} />
                                            Settings
                                        </Link>
                                        <div className="dropdown-divider" />
                                        <button className="dropdown-item logout" onClick={handleLogout}>
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login" className="btn btn-ghost">Log In</Link>
                                <Link to="/register" className="btn btn-primary">Get Started</Link>
                            </div>
                        )}
                    </div>
                </nav>

                <button
                    className="mobile-toggle"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </header>
    );
};

export default Header;
