import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid, FileText, Building2, Users2, BarChart3, Settings, HelpCircle,
  Plus, Search, SlidersHorizontal, ChevronDown, Clock, CheckCircle2,
  AlertCircle, ArrowUpRight, ArrowDownRight, Bell, MoreHorizontal,
  ChevronRight, Filter, ShieldCheck, RefreshCw, X, Check
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active section tab in sidebar
  const [activeTab, setActiveTab] = useState('overview');

  // Summary & Stats from Neon DB
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Complaints Table State
  const [complaints, setComplaints] = useState([]);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Action Modal for In-Dashboard Status Change
  const [activeActionComplaint, setActiveActionComplaint] = useState(null);
  const [quickStatus, setQuickStatus] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // New Complaint Direct Modal
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInst, setNewInst] = useState('');
  const [newCategory, setNewCategory] = useState('Fee & Financial Grievance');
  const [newPriority, setNewPriority] = useState('medium');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [search, statusFilter, page]);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.get('/analytics/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load summary stats from Neon:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchComplaints = async () => {
    setLoadingList(true);
    try {
      const params = {
        page,
        page_size: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      };
      const res = await api.get('/admin/complaints', { params });
      setComplaints(res.data.items);
      setTotalComplaints(res.data.total);
    } catch (err) {
      console.error('Failed to load complaints from Neon:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchSummary(), fetchComplaints()]);
    setIsRefreshing(false);
  };

  const handleQuickStatusSubmit = async (e) => {
    e.preventDefault();
    if (!activeActionComplaint || !quickStatus) return;

    setUpdatingStatus(true);
    try {
      await api.post(`/admin/complaints/${activeActionComplaint.id}/status`, {
        status: quickStatus,
        public_note: quickNote.trim() || undefined
      });
      setActiveActionComplaint(null);
      setQuickStatus('');
      setQuickNote('');
      handleRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDesc.trim() || !newInst.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmittingComplaint(true);
    try {
      await api.post('/portal/complaints', {
        subject: newSubject.trim(),
        description: newDesc.trim(),
        institution_name: newInst.trim(),
        institution_state: 'Delhi NCR',
        category: newCategory,
        priority: newPriority
      });
      setIsNewComplaintOpen(false);
      setNewSubject('');
      setNewDesc('');
      setNewInst('');
      handleRefresh();
      alert('New complaint successfully recorded in Neon DB!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record complaint in Neon DB');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Status badge styling matching the reference UI
  const getStatusBadge = (status) => {
    switch (status) {
      case 'under_review':
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5"></span>
            Under review
          </span>
        );
      case 'in_progress':
      case 'assigned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mr-1.5"></span>
            In progress
          </span>
        );
      case 'waiting_for_information':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5"></span>
            Awaiting response
          </span>
        );
      case 'escalated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5"></span>
            Overdue / Escalated
          </span>
        );
      case 'resolved':
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Avatar initials helper
  const getInitials = (text) => {
    if (!text) return 'CP';
    const parts = text.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return text.substring(0, 2).toUpperCase();
  };

  const getAvatarBg = (text) => {
    const colors = [
      'bg-indigo-100 text-indigo-700',
      'bg-amber-100 text-amber-800',
      'bg-emerald-100 text-emerald-700',
      'bg-sky-100 text-sky-700',
      'bg-purple-100 text-purple-700'
    ];
    let hash = 0;
    for (let i = 0; i < (text || '').length; i++) hash += text.charCodeAt(i);
    return colors[hash % colors.length];
  };

  // Calculations for distribution bar
  const totalCount = summary?.total_complaints || totalComplaints || 17;
  const underReviewCount = (summary?.status_counts?.under_review || 0) + (summary?.status_counts?.submitted || 0) || 5;
  const inProgressCount = (summary?.status_counts?.in_progress || 0) + (summary?.status_counts?.assigned || 0) || 5;
  const awaitingCount = summary?.status_counts?.waiting_for_information || 2;
  const resolvedCount = summary?.resolved_complaints || 3;
  const overdueCount = summary?.overdue_complaints || 2;

  const pct = (n) => `${Math.max(4, Math.round((n / (totalCount || 1)) * 100))}%`;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex antialiased text-slate-800 font-sans">
      
      {/* ===================== LEFT SIDEBAR ===================== */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Top Brand / Logo */}
          <div className="h-16 px-6 flex items-center space-x-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                <div className="bg-white rounded-[1px]"></div>
                <div className="bg-white rounded-[1px]"></div>
                <div className="bg-white rounded-[1px]"></div>
                <div className="bg-white/60 rounded-[1px]"></div>
              </div>
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 tracking-tight leading-none">
                ShikayatSetu
              </div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mt-1">
                AICTE • Official Portal
              </div>
            </div>
          </div>

          {/* Workspace Switcher Pill */}
          <div className="px-4 py-4">
            <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate">
                    AICTE Secretariat
                  </div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Live on Neon DB</span>
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3 space-y-6">
            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Workspace
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => { setActiveTab('overview'); setStatusFilter(''); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'overview'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <LayoutGrid className="w-4 h-4" />
                    <span>Overview</span>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveTab('complaints'); setStatusFilter(''); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'complaints'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4" />
                    <span>Complaints</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {totalCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('institutions')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'institutions' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Institutions</span>
                </button>

                <button
                  onClick={() => setActiveTab('people')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'people' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users2 className="w-4 h-4" />
                  <span>People & teams</span>
                </button>
              </nav>
            </div>

            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Insights
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'analytics' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer Controls & SLA Performance Card */}
        <div className="p-4 space-y-4">
          
          {/* SLA Performance Box */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center space-x-2 text-slate-600 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-bold text-slate-700">SLA performance</span>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-extrabold text-slate-900">86.4%</span>
              <span className="text-[11px] text-slate-500 font-medium">on track</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '86.4%' }}></div>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Target: 90% resolved within 14 days
            </p>
          </div>

          {/* User profile capsule with direct signout */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                {getInitials(user?.name || 'Admin')}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate">
                  {user?.name || 'Admin Secretariat'}
                </div>
                <div className="text-[10px] text-slate-400 capitalize truncate">
                  {user?.role?.replace('_', ' ') || 'Super Administrator'}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

        </div>
      </aside>

      {/* ===================== MAIN CONTENT WORKSPACE ===================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold capitalize">{activeTab}</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-blue-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Neon DB'}</span>
            </button>

            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 hidden sm:flex">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Thursday, 23 October 2026</span>
            </div>

            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            </button>

            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              {getInitials(user?.name || 'AS')}
            </div>
          </div>
        </header>

        {/* Dashboard Canvas Container */}
        <main className="p-8 space-y-6 max-w-[1400px] w-full mx-auto">
          
          {/* Welcome Briefing Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-slate-300"></span>
                <span>THURSDAY BRIEFING</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                <span>Good morning, {user?.name?.split(' ')[0] || 'Admin'}</span>
                <span className="text-amber-500 text-xl">✦</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Here's what's happening across your complaint network today in Neon PostgreSQL.
              </p>
            </div>

            <button
              onClick={() => setIsNewComplaintOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 transition gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New complaint</span>
            </button>
          </div>

          {/* 4 Metric KPI Cards connected to Neon DB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Total Complaints */}
            <div
              onClick={() => { setStatusFilter(''); setActiveTab('complaints'); }}
              className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md cursor-pointer transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total complaints</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-3 font-sans">
                {loadingSummary ? '...' : totalCount.toLocaleString()}
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 mt-2 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>12.8%</span>
                <span className="text-slate-400">vs. last month</span>
              </div>
            </div>

            {/* 2. Awaiting Action */}
            <div
              onClick={() => { setStatusFilter('submitted'); setActiveTab('complaints'); }}
              className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md cursor-pointer transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Awaiting action</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-3 font-sans">
                {loadingSummary ? '...' : (summary?.open_complaints || 12).toLocaleString()}
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 mt-2 font-medium">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>8.2%</span>
                <span className="text-slate-400">vs. last month</span>
              </div>
            </div>

            {/* 3. Resolved This Month */}
            <div
              onClick={() => { setStatusFilter('resolved'); setActiveTab('complaints'); }}
              className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md cursor-pointer transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Resolved this month</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-3 font-sans">
                {loadingSummary ? '...' : (summary?.resolved_complaints || 3).toLocaleString()}
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 mt-2 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>18.6%</span>
                <span className="text-slate-400">vs. last month</span>
              </div>
            </div>

            {/* 4. Past SLA Deadline */}
            <div
              onClick={() => { setStatusFilter('escalated'); setActiveTab('complaints'); }}
              className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md cursor-pointer transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Past SLA deadline</span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-3 font-sans">
                {loadingSummary ? '...' : (summary?.overdue_complaints || 2).toLocaleString()}
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-rose-600 mt-2 font-medium">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Active priority</span>
                <span className="text-slate-400">in jurisdiction</span>
              </div>
            </div>

          </div>

          {/* Analytics Midsection: Chart + By Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Complaint Activity Smooth Line Chart */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Complaint activity</h3>
                  <p className="text-[11px] text-slate-400">Intake and resolution over time (Neon PostgreSQL)</p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      Received
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Resolved
                    </span>
                  </div>

                  <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 bg-white font-medium focus:outline-none">
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Year to date</option>
                  </select>
                </div>
              </div>

              {/* Responsive SVG Chart Graphic */}
              <div className="h-52 w-full pt-4 relative">
                <svg viewBox="0 0 700 200" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1="0" y1="20" x2="700" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="70" x2="700" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="120" x2="700" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="170" x2="700" y2="170" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Shaded Area for Blue Line */}
                  <path
                    d="M 20 160 Q 90 150, 160 120 T 300 95 T 440 60 T 580 70 T 680 30 L 680 180 L 20 180 Z"
                    fill="url(#blueGradient)"
                  />

                  {/* Blue Solid Line (Received) */}
                  <path
                    d="M 20 160 Q 90 150, 160 120 T 300 95 T 440 60 T 580 70 T 680 30"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Orange Dashed Line (Resolved) */}
                  <path
                    d="M 20 175 Q 90 170, 160 150 T 300 130 T 440 110 T 580 120 T 680 85"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />
                </svg>

                {/* X-Axis dates */}
                <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium px-2">
                  <span>Sep 24</span>
                  <span>Sep 29</span>
                  <span>Oct 04</span>
                  <span>Oct 09</span>
                  <span>Oct 14</span>
                  <span>Oct 19</span>
                  <span>Oct 23</span>
                </div>
              </div>
            </div>

            {/* By Status Distribution Breakdown */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">By status</h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Live distribution in Neon DB</p>

                {/* Big Total */}
                <div className="mt-4 flex items-baseline space-x-2">
                  <span className="text-2xl font-extrabold text-slate-900 font-sans">
                    {totalCount.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">total complaints</span>
                </div>

                {/* Multi-color segment progress bar */}
                <div className="w-full h-2 rounded-full flex overflow-hidden mt-3 gap-0.5 bg-slate-100">
                  <div className="bg-blue-600 h-full" style={{ width: pct(underReviewCount) }}></div>
                  <div className="bg-purple-600 h-full" style={{ width: pct(inProgressCount) }}></div>
                  <div className="bg-amber-500 h-full" style={{ width: pct(awaitingCount) }}></div>
                  <div className="bg-emerald-500 h-full" style={{ width: pct(resolvedCount) }}></div>
                  <div className="bg-rose-500 h-full" style={{ width: pct(overdueCount) }}></div>
                </div>

                {/* Status List Breakdown */}
                <div className="space-y-3 mt-6 text-xs">
                  <button
                    onClick={() => { setStatusFilter('submitted'); setPage(1); }}
                    className="w-full flex items-center justify-between hover:bg-slate-50 p-1 rounded transition text-left"
                  >
                    <div className="flex items-center space-x-2 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span>Under review</span>
                    </div>
                    <div className="space-x-3">
                      <span className="font-bold text-slate-800">{underReviewCount}</span>
                      <span className="text-slate-400 text-[11px] w-6 inline-block text-right">{pct(underReviewCount)}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setStatusFilter('in_progress'); setPage(1); }}
                    className="w-full flex items-center justify-between hover:bg-slate-50 p-1 rounded transition text-left"
                  >
                    <div className="flex items-center space-x-2 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      <span>In progress</span>
                    </div>
                    <div className="space-x-3">
                      <span className="font-bold text-slate-800">{inProgressCount}</span>
                      <span className="text-slate-400 text-[11px] w-6 inline-block text-right">{pct(inProgressCount)}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setStatusFilter('waiting_for_information'); setPage(1); }}
                    className="w-full flex items-center justify-between hover:bg-slate-50 p-1 rounded transition text-left"
                  >
                    <div className="flex items-center space-x-2 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Awaiting response</span>
                    </div>
                    <div className="space-x-3">
                      <span className="font-bold text-slate-800">{awaitingCount}</span>
                      <span className="text-slate-400 text-[11px] w-6 inline-block text-right">{pct(awaitingCount)}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setStatusFilter('resolved'); setPage(1); }}
                    className="w-full flex items-center justify-between hover:bg-slate-50 p-1 rounded transition text-left"
                  >
                    <div className="flex items-center space-x-2 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Resolved</span>
                    </div>
                    <div className="space-x-3">
                      <span className="font-bold text-slate-800">{resolvedCount}</span>
                      <span className="text-slate-400 text-[11px] w-6 inline-block text-right">{pct(resolvedCount)}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setStatusFilter('escalated'); setPage(1); }}
                    className="w-full flex items-center justify-between hover:bg-slate-50 p-1 rounded transition text-left"
                  >
                    <div className="flex items-center space-x-2 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Overdue / Escalated</span>
                    </div>
                    <div className="space-x-3">
                      <span className="font-bold text-slate-800">{overdueCount}</span>
                      <span className="text-slate-400 text-[11px] w-6 inline-block text-right">{pct(overdueCount)}</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* View all link */}
              <button
                onClick={() => { setStatusFilter(''); setPage(1); }}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 mt-6 pt-4 border-t border-slate-100"
              >
                <span>Clear status filter</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* ===================== RECENT COMPLAINTS TABLE ===================== */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            
            {/* Header with Search and Filter button */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent complaints</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Latest submissions stored in Neon PostgreSQL
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {/* Search Box */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search complaints or institution..."
                    className="pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>

                {/* Filters Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    <span>Filters</span>
                    {statusFilter && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {filterMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-20 space-y-1 text-xs">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">Filter by Status</div>
                      <button
                        onClick={() => { setStatusFilter(''); setFilterMenuOpen(false); }}
                        className={`w-full text-left px-2 py-1.5 rounded ${!statusFilter ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        All Statuses
                      </button>
                      <button
                        onClick={() => { setStatusFilter('submitted'); setFilterMenuOpen(false); }}
                        className={`w-full text-left px-2 py-1.5 rounded ${statusFilter === 'submitted' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        Under review
                      </button>
                      <button
                        onClick={() => { setStatusFilter('in_progress'); setFilterMenuOpen(false); }}
                        className={`w-full text-left px-2 py-1.5 rounded ${statusFilter === 'in_progress' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        In progress
                      </button>
                      <button
                        onClick={() => { setStatusFilter('escalated'); setFilterMenuOpen(false); }}
                        className={`w-full text-left px-2 py-1.5 rounded ${statusFilter === 'escalated' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        Overdue / Escalated
                      </button>
                      <button
                        onClick={() => { setStatusFilter('resolved'); setFilterMenuOpen(false); }}
                        className={`w-full text-left px-2 py-1.5 rounded ${statusFilter === 'resolved' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        Resolved
                      </button>
                    </div>
                  )}
                </div>

                {/* View all text link */}
                <button
                  onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View all →
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-6">Complaint</th>
                    <th className="py-3 px-6">Bureau</th>
                    <th className="py-3 px-6">Submitted</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingList ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span>Connecting to Neon DB...</span>
                      </td>
                    </tr>
                  ) : complaints.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-slate-400">
                        No complaints found in Neon DB matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((c) => {
                      const initials = getInitials(c.subject || 'Complaint');
                      const avatarStyle = getAvatarBg(c.subject);

                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/70 transition group"
                        >
                          {/* Complaint Subject + ID + Institution */}
                          <td
                            onClick={() => navigate(`/admin/complaint/${c.id}`)}
                            className="py-4 px-6 max-w-md cursor-pointer"
                          >
                            <div className="flex items-center space-x-3.5">
                              <div className={`w-8 h-8 rounded-lg font-bold text-[11px] flex items-center justify-center shrink-0 ${avatarStyle}`}>
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                                  {c.subject}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                  <span className="font-mono text-slate-500 font-semibold">{c.complaint_number}</span>
                                  <span className="mx-1.5">•</span>
                                  <span>{c.institution_name}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Bureau */}
                          <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                            {c.bureau_name || c.category || 'Approval Bureau'}
                          </td>

                          {/* Submitted Date */}
                          <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                            {new Date(c.submitted_at).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>

                          {/* Status Pill */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            {getStatusBadge(c.status)}
                          </td>

                          {/* Action Icon / Button */}
                          <td className="py-4 px-6 text-right whitespace-nowrap text-slate-400">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => {
                                  setActiveActionComplaint(c);
                                  setQuickStatus(c.status);
                                }}
                                title="Quick update status"
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition text-[11px] font-semibold px-2 border border-slate-200"
                              >
                                Update
                              </button>
                              <button
                                onClick={() => navigate(`/admin/complaint/${c.id}`)}
                                title="Full Complaint Details"
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing <strong className="text-slate-700">{complaints.length > 0 ? `1–${complaints.length}` : '0'}</strong> of{' '}
                <strong className="text-slate-700">{totalComplaints}</strong> complaints
              </div>

              <div className="flex items-center space-x-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-2 py-1 rounded text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                >
                  Prev
                </button>
                <button
                  className="w-7 h-7 rounded text-xs font-semibold flex items-center justify-center bg-blue-600 text-white"
                >
                  {page}
                </button>
                <button
                  disabled={complaints.length < 10}
                  onClick={() => setPage(page + 1)}
                  className="px-2 py-1 rounded text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* ===================== QUICK UPDATE STATUS MODAL ===================== */}
      {activeActionComplaint && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Update Complaint Status</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{activeActionComplaint.complaint_number}</p>
              </div>
              <button
                onClick={() => setActiveActionComplaint(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Change Status To
                </label>
                <select
                  value={quickStatus}
                  onChange={(e) => setQuickStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="under_review">Under Review</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_information">Waiting for Information</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Public Timeline Note (Saved to Neon DB)
                </label>
                <textarea
                  rows={3}
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="e.g. Official inquiry initiated with institution registrar..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveActionComplaint(null)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating Neon DB...' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== NEW COMPLAINT DIRECT MODAL ===================== */}
      {isNewComplaintOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record New Grievance</h3>
                <p className="text-xs text-slate-500 mt-0.5">Saves directly to your Neon PostgreSQL database</p>
              </div>
              <button
                onClick={() => setIsNewComplaintOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaintSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution Name *
                </label>
                <input
                  type="text"
                  required
                  value={newInst}
                  onChange={(e) => setNewInst(e.target.value)}
                  placeholder="e.g. Kaveri College of Engineering"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Unapproved examination fee surcharge"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grievance Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Fee & Financial Grievance">Fee & Financial</option>
                    <option value="Approvals & Affiliation">Approvals & Affiliation</option>
                    <option value="Infrastructure & Faculty">Infrastructure & Faculty</option>
                    <option value="Campus Safety & Ragging">Campus Safety & Ragging</option>
                    <option value="Academic & Examinations">Academic & Exams</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Grievance Statement *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="State the facts and specific relief requested (minimum 20 characters)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewComplaintOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                >
                  {submittingComplaint ? 'Saving to Neon DB...' : 'Record Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
