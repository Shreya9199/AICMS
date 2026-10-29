import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, LogOut, LayoutDashboard, FilePlus, Search, Building2, Sparkles } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isOfficial = user && ['officer', 'bureau_admin', 'super_admin'].includes(user.role);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 text-white shadow-xl">
      {/* Top National Header Bar */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 py-1.5 px-4 text-xs text-slate-300 border-b border-slate-800/70">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium tracking-wide">National Institutional Grievance Redressal Network</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative p-2 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition duration-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-blue-200">
                AICMS
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Official
              </span>
            </div>
            <div className="text-[10px] text-slate-400 tracking-tight leading-none mt-0.5">
              AICTE Integrated Case Monitoring System
            </div>
          </div>
        </Link>

        {/* Center / Right Links */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            to="/track"
            className="flex items-center space-x-1.5 text-sm font-medium text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg hover:bg-slate-800/80 transition duration-150"
          >
            <Search className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Track Grievance</span>
          </Link>

          {user ? (
            <>
              {isOfficial ? (
                <Link
                  to="/admin"
                  className="flex items-center space-x-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg shadow-md shadow-indigo-600/30 transition duration-200"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Official Dashboard</span>
                </Link>
              ) : user.role === 'institution' ? (
                <Link
                  to="/institution"
                  className="flex items-center space-x-2 text-sm font-semibold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-4 py-2 rounded-lg shadow-md shadow-amber-600/30 transition duration-200"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Institution Desk</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/portal"
                    className="flex items-center space-x-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
                  >
                    <span>My Complaints</span>
                  </Link>
                  <Link
                    to="/portal/submit"
                    className="flex items-center space-x-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md shadow-blue-600/25 transition duration-150"
                  >
                    <FilePlus className="w-4 h-4" />
                    <span>File Complaint</span>
                  </Link>
                </>
              )}

              {/* User Dropdown / Info */}
              <div className="flex items-center pl-3 space-x-2.5 border-l border-slate-800">
                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
                  <div className="text-[11px] text-slate-400 capitalize">
                    {user.role ? user.role.replace('_', ' ') : 'User'}
                    {user.bureau_name ? ` • ${user.bureau_name}` : ''}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2.5">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg hover:bg-slate-800/80 transition duration-150"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg shadow-md shadow-blue-600/25 hover:shadow-blue-500/40 transition duration-200"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
