import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await register(name.trim(), email.trim(), password);
      // Auto login
      await login(email.trim(), password);
      navigate('/portal');
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to backend server. Please verify the backend is running on port 8000.');
      } else {
        setError('Registration failed. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
            <Shield className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black text-slate-900 tracking-tight">
          Create Complainant Account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 max-w-sm mx-auto">
          AICMS • AICTE Integrated Case Monitoring System — File grievances and track real-time resolution
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card bg-white/90 backdrop-blur-xl py-8 px-6 shadow-xl rounded-2xl border border-slate-200/90 sm:px-10 space-y-6">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-2.5 pl-10 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/90 transition"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 pl-10 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/90 transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password (minimum 6 characters)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pl-10 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/90 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 text-center text-xs text-slate-500 border-t border-slate-100">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
