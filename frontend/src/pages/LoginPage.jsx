import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff,
  UserCheck, Building2, CheckCircle2, ChevronRight, HelpCircle, Shield,
  AlertTriangle
} from 'lucide-react';

export const LoginPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = ['official', 'institution'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'citizen';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [portalTab, setPortalTab] = useState(initialTab); // 'citizen' | 'official' | 'institution'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  // Keep URL query in sync when toggling tabs
  const handleTabChange = (tab) => {
    setPortalTab(tab);
    setError('');
    setSearchParams({ tab });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      
      const isOfficialRole = ['officer', 'bureau_admin', 'super_admin'].includes(user.role);
      const isInstitutionRole = user.role === 'institution';

      // Smart automatic routing based on authenticated user role:
      if (isOfficialRole) {
        navigate('/admin');
      } else if (isInstitutionRole) {
        navigate('/institution');
      } else {
        navigate('/portal');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Authentication failed. Please check your credentials or click one of the demo buttons below.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-md w-full space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-blue-500/30 mx-auto transition-transform hover:scale-105 duration-200">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              AICMS • {portalTab === 'citizen' ? 'Complainant Portal' : portalTab === 'institution' ? 'Institution Compliance Desk' : 'Official Authority Portal'}
            </h1>
            <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider mt-0.5">
              AICTE Integrated Case Monitoring System
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="glass-card bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
          
          {/* Distinct Tab Selector: Citizen vs Official vs Institution */}
          <div className="grid grid-cols-3 p-1 bg-slate-100/90 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200/70 gap-1">
            <button
              type="button"
              onClick={() => handleTabChange('citizen')}
              className={`py-2 px-1 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 text-center ${
                portalTab === 'citizen'
                  ? 'bg-blue-600 text-white shadow font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-200/60 text-slate-600'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Complainant</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('institution')}
              className={`py-2 px-1 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 text-center ${
                portalTab === 'institution'
                  ? 'bg-amber-600 text-white shadow font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-200/60 text-slate-600'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Institution</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('official')}
              className={`py-2 px-1 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 text-center ${
                portalTab === 'official'
                  ? 'bg-indigo-700 text-white shadow font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-200/60 text-slate-600'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Officer</span>
            </button>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              {portalTab === 'citizen'
                ? 'Complainant Account Sign In'
                : portalTab === 'institution'
                ? 'Educational Institution Sign In'
                : 'Authorized Officer / Bureau Login'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {portalTab === 'citizen'
                ? 'Access your submitted grievances, official timelines, and responses.'
                : portalTab === 'institution'
                ? 'Track grievances filed against your campus, review cell actions, and submit required responses.'
                : 'Dedicated login for Inquiry Officers, Bureau Admins, and Super Administrators.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {portalTab === 'citizen' ? 'Complainant Email Address' : 'Official Government Email'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={portalTab === 'citizen' ? 'student@example.com' : 'officer@nivaran.gov.in'}
                  className="w-full px-4 py-2.5 pl-10 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Please contact the System Administrator or Secretariat Helpdesk to reset password.')}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pl-10 pr-10 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-lg transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 ${
                portalTab === 'citizen'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25'
                  : portalTab === 'institution'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-600/30'
                  : 'bg-gradient-to-r from-indigo-700 to-slate-900 hover:from-indigo-600 hover:to-slate-800 shadow-indigo-600/30'
              }`}
            >
              {loading ? (
                <span>Validating {portalTab === 'citizen' ? 'Complainant' : portalTab === 'institution' ? 'Institution' : 'Officer'} Credentials...</span>
              ) : (
                <>
                  <span>Sign In as {portalTab === 'citizen' ? 'Complainant' : portalTab === 'institution' ? 'Educational Institution' : 'Inquiry Officer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* All Demo Credentials & Quick 1-Click Login */}
          <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Demo Accounts & Quick Login:
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                PW: <span className="font-semibold text-slate-700 bg-slate-200 px-1 py-0.5 rounded">password123</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Super Admin */}
              <button
                type="button"
                onClick={() => {
                  setPortalTab('official');
                  setEmail('superadmin@nivaran.gov.in');
                  setPassword('password123');
                  setError('');
                }}
                className="p-2.5 bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition group shadow-sm"
              >
                <div className="flex items-center justify-between font-semibold text-indigo-900">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Super Admin
                  </span>
                  <span className="text-[10px] text-indigo-600 font-bold group-hover:underline">Autofill</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                  superadmin@nivaran.gov.in
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Access: All 4 Sections (Cases, Overlaps, Institutions, Officers)
                </div>
              </button>

              {/* Inquiry Officer */}
              <button
                type="button"
                onClick={() => {
                  setPortalTab('official');
                  setEmail('officer@nivaran.gov.in');
                  setPassword('password123');
                  setError('');
                }}
                className="p-2.5 bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition group shadow-sm"
              >
                <div className="flex items-center justify-between font-semibold text-blue-900">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    Inquiry Officer
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold group-hover:underline">Autofill</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                  officer@nivaran.gov.in
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Access: RB & PGRC Assigned Cases
                </div>
              </button>

              {/* Educational Institution */}
              <button
                type="button"
                onClick={() => {
                  setPortalTab('institution');
                  setEmail('apex.institute@aicms.ac.in');
                  setPassword('password123');
                  setError('');
                }}
                className="p-2.5 bg-white hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 rounded-lg text-left transition group shadow-sm"
              >
                <div className="flex items-center justify-between font-semibold text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    Institution Desk
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold group-hover:underline">Autofill</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                  apex.institute@aicms.ac.in
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Access: College Compliance & Response Desk
                </div>
              </button>

              {/* Complainant */}
              <button
                type="button"
                onClick={() => {
                  setPortalTab('citizen');
                  setEmail('complainant@nivaran.gov.in');
                  setPassword('password123');
                  setError('');
                }}
                className="p-2.5 bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition group shadow-sm"
              >
                <div className="flex items-center justify-between font-semibold text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Complainant
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold group-hover:underline">Autofill</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                  complainant@nivaran.gov.in
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Access: File & Track Grievance Status
                </div>
              </button>
            </div>
          </div>

          {/* Registration Options */}
          <div className="pt-3 text-center text-xs text-slate-600 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-2">
            <span>Want to test with your own custom account?</span>
            <div className="flex items-center gap-2">
              <Link to="/register" className="font-semibold text-blue-600 hover:underline">
                Register Complainant
              </Link>
              <span>•</span>
              <Link to="/register?type=institution" className="font-semibold text-amber-600 hover:underline">
                Register Institution
              </Link>
            </div>
          </div>

        </div>

        {/* Public Non-Login Tracking Link */}
        <div className="text-center">
          <Link
            to="/track"
            className="inline-flex items-center text-xs text-slate-600 hover:text-blue-600 font-medium transition gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-200/50"
          >
            <span>Have a complaint reference ID? Track status publicly</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
};
