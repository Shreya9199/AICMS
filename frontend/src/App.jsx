import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PublicTrackPage } from './pages/PublicTrackPage';
import { PortalDashboard } from './pages/PortalDashboard';
import { SubmitComplaintPage } from './pages/SubmitComplaintPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { InstitutionPortal } from './pages/InstitutionPortal';

// Protected Route Wrapper for Authenticated Complainants ONLY
const ComplainantRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'institution') return <Navigate to="/institution" replace />;
  if (user.role !== 'complainant') {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

// Protected Route Wrapper for Officials (Officers, Bureau Admins, Super Admins) ONLY
const OfficialRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login?tab=official" replace />;
  if (user.role === 'institution') return <Navigate to="/institution" replace />;
  if (!['officer', 'bureau_admin', 'super_admin'].includes(user.role)) {
    return <Navigate to="/portal" replace />;
  }
  return children;
};

// Protected Route Wrapper for Registered Institutions
const InstitutionRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login?tab=institution" replace />;
  if (user.role !== 'institution' && !['officer', 'bureau_admin', 'super_admin'].includes(user.role)) {
    return <Navigate to="/portal" replace />;
  }
  return children;
};

import { useLocation } from 'react-router-dom';
import { AnimatedBackground } from './components/AnimatedBackground';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 relative selection:bg-blue-600 selection:text-white">
      {/* Background Interactive Animation */}
      <AnimatedBackground variant={isAdminRoute ? 'dark' : 'default'} />

      {!isAdminRoute && <Navbar />}
      
      <main className="flex-1 flex flex-col relative z-10">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/track" element={<PublicTrackPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Complainant Portal Routes */}
          <Route
            path="/portal"
            element={
              <ComplainantRoute>
                <PortalDashboard />
              </ComplainantRoute>
            }
          />
          <Route
            path="/portal/submit"
            element={
              <ComplainantRoute>
                <SubmitComplaintPage />
              </ComplainantRoute>
            }
          />

          {/* Official Dashboard Routes */}
          <Route
            path="/admin"
            element={
              <OfficialRoute>
                <AdminDashboard />
              </OfficialRoute>
            }
          />
          <Route
            path="/admin/complaint/:id"
            element={
              <OfficialRoute>
                <ComplaintDetailPage />
              </OfficialRoute>
            }
          />

          {/* Institutional Compliance Portal */}
          <Route
            path="/institution"
            element={
              <InstitutionRoute>
                <InstitutionPortal />
              </InstitutionRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAdminRoute && (
        <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <strong>AICMS</strong> • AICTE Integrated Case Monitoring System
            </div>
            <div className="text-[11px] text-slate-500">
              Hackathon MVP Demonstration • Strict Complainant Privacy & Role Access Enforcement
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
