import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import BlogPage from './components/BlogPage';
import BlogPost from './components/BlogPost';
import AboutPage from './components/AboutPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ProfileSettings from './components/ProfileSettings';
import './App.css';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import TermsOfService from './components/legal/TermsOfService';
import DMCAPolicy from './components/legal/DMCAPolicy';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner spinner-lg" />
      <span>Loading...</span>
    </div>
  );
}

function PublicLayout({ children }) {
  return (
    <div className="public-layout">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
      <Route path="/blog" element={<PublicLayout><BlogPage /></PublicLayout>} />
      <Route path="/blog/:id" element={<PublicLayout><BlogPost /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
      <Route path="/privacy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
      <Route path="/terms" element={<PublicLayout><TermsOfService /></PublicLayout>} />
      <Route path="/dmca" element={<PublicLayout><DMCAPolicy /></PublicLayout>} />

      {/* Auth Pages */}
      <Route path="/login" element={
        <PublicOnlyRoute>
          <PublicLayout><Auth mode="login" /></PublicLayout>
        </PublicOnlyRoute>
      } />
      <Route path="/register" element={
        <PublicOnlyRoute>
          <PublicLayout><Auth mode="register" /></PublicLayout>
        </PublicOnlyRoute>
      } />

      {/* Protected Pages */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Dashboard activePage="profile" /></ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
