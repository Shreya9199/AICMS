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
  const initialTab = searchParams.get('tab') === 'official' ? 'official' : 'citizen';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [portalTab, setPortalTab] = useState(initialTab); // 'citizen' | 'official'
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

      // STRICT PORTAL ISOLATION ENFORCEMENT:
      // 1. If user attempted to log in under "Complainant Portal" tab but has an Official role:
      if (portalTab === 'citizen' && isOfficialRole) {
        logout();
        setError('Access denied: This account belongs to an Authorized Official. Please switch to the Official / Officer Portal to sign in.');
        return;
      }

      // 2. If user attempted to log in under "Official Portal" tab but is a Complainant:
      if (portalTab === 'official' && !isOfficialRole) {
        logout();
        setError('Access denied: Complainant accounts cannot log in to the Official Portal. Please switch to the Complainant Portal.');
        return;
      }

      // Route to designated portal
      if (isOfficialRole) {
        navigate('/admin');
      } else {
        navigate('/portal');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Authentication failed. Please check your credentials and try again.'
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
              AICMS • {portalTab === 'citizen' ? 'Complainant Grievance Portal' : 'Official Authority Portal'}
            </h1>
            <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider mt-0.5">
              AICTE Integrated Case Monitoring System
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="glass-card bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
          
          {/* Distinct Tab Selector: Citizen vs Official */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200/70">
            <button
              type="button"
              onClick={() => handleTabChange('citizen')}
              className={`py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                portalTab === 'citizen'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-200/60 text-slate-600'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Complainant Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('official')}
              className={`py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                portalTab === 'official'
                  ? 'bg-indigo-700 text-white shadow-md font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-200/60 text-slate-600'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Officer Portal</span>
            </button>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              {portalTab === 'citizen' ? 'Complainant Account Sign In' : 'Authorized Officer / Bureau Login'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {portalTab === 'citizen'
                ? 'Access your submitted grievances, official timelines, and responses.'
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
                  : 'bg-gradient-to-r from-indigo-700 to-slate-900 hover:from-indigo-600 hover:to-slate-800 shadow-indigo-600/30'
              }`}
            >
              {loading ? (
                <span>Validating {portalTab === 'citizen' ? 'Complainant' : 'Officer'} Credentials...</span>
              ) : (
                <>
                  <span>Sign In as {portalTab === 'citizen' ? 'Complainant' : 'Officer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Registration Footer for Complainants */}
          {portalTab === 'citizen' && (
            <div className="pt-3 text-center text-xs text-slate-500 border-t border-slate-100">
              Need to file a grievance?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:underline">
                Register Complainant Account
              </Link>
            </div>
          )}

          {/* Official Security Notice */}
          {portalTab === 'official' && (
            <div className="pt-3 text-center text-[11px] text-slate-500 border-t border-slate-100 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-indigo-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Restricted Government Access</span>
              </div>
              <p className="text-slate-400">
                Official accounts are provisioned exclusively by Bureau & Super Administrators.
              </p>
            </div>
          )}

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
