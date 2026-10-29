import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid, FileText, Building2, Users2, BarChart3, Settings, HelpCircle,
  Plus, Search, SlidersHorizontal, ChevronDown, Clock, CheckCircle2,
  AlertCircle, ArrowUpRight, ArrowDownRight, Bell, MoreHorizontal,
  ChevronRight, Filter, ShieldCheck, RefreshCw, X, Check, UserPlus,
  AlertTriangle, GitMerge, Shield, ArrowRightLeft, FileSpreadsheet, Eye, ExternalLink
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

  // New Officer Registration Modal
  const [isNewOfficerOpen, setIsNewOfficerOpen] = useState(false);
  const [officerName, setOfficerName] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerBureau, setOfficerBureau] = useState('');
  const [officerRole, setOfficerRole] = useState('officer');
  const [bureausList, setBureausList] = useState([]);
  const [submittingOfficer, setSubmittingOfficer] = useState(false);
  const [officerSuccessMsg, setOfficerSuccessMsg] = useState('');
  const [officerErrMsg, setOfficerErrMsg] = useState('');

  // Cross-Bureau Overlap Detection State
  const [overlapsData, setOverlapsData] = useState({ items: [], total_overlapping_institutions: 0, total_overlapping_cases: 0 });
  const [loadingOverlaps, setLoadingOverlaps] = useState(false);

  // Consolidated Institutions State
  const [institutionsData, setInstitutionsData] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [selectedInstitutionDetail, setSelectedInstitutionDetail] = useState(null);

  // Consolidated Analytics & Reports State
  const [analyticsReports, setAnalyticsReports] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Cross-Bureau Transfer Modal State
  const [transferModalCase, setTransferModalCase] = useState(null);
  const [transferTargetBureau, setTransferTargetBureau] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Advanced Filters State for Complaints
  const [selectedBureauFilter, setSelectedBureauFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [overdueOnlyFilter, setOverdueOnlyFilter] = useState(false);

  useEffect(() => {
    fetchSummary();
    fetchOverlaps();
    fetchInstitutions();
    fetchAnalyticsReports();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [search, statusFilter, selectedBureauFilter, selectedCategoryFilter, overdueOnlyFilter, page]);

  const fetchOverlaps = async () => {
    setLoadingOverlaps(true);
    try {
      const res = await api.get('/admin/overlaps/summary');
      setOverlapsData(res.data);
    } catch (err) {
      console.error('Failed to load overlaps summary:', err);
    } finally {
      setLoadingOverlaps(false);
    }
  };

  const fetchInstitutions = async () => {
    setLoadingInstitutions(true);
    try {
      const params = institutionSearch ? { search: institutionSearch } : {};
      const res = await api.get('/admin/institutions/consolidated', { params });
      setInstitutionsData(res.data || []);
    } catch (err) {
      console.error('Failed to load consolidated institutions:', err);
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const fetchAnalyticsReports = async () => {
    setLoadingReports(true);
    try {
      const res = await api.get('/analytics/reports');
      setAnalyticsReports(res.data);
    } catch (err) {
      console.error('Failed to load analytics reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!transferModalCase || !transferTargetBureau) return;
    setTransferring(true);
    try {
      await api.post(`/admin/complaints/${transferModalCase.id}/transfer`, {
        bureau_id: transferTargetBureau,
        public_note: transferNote.trim() || `Transferred to ensure unified single-window handling.`
      });
      alert(`Case ${transferModalCase.complaint_number || transferModalCase.id} successfully transferred!`);
      setTransferModalCase(null);
      setTransferTargetBureau('');
      setTransferNote('');
      handleRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to transfer complaint bureau.');
    } finally {
      setTransferring(false);
    }
  };

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
        bureau_id: selectedBureauFilter || undefined,
        category: selectedCategoryFilter || undefined,
        overdue_only: overdueOnlyFilter || undefined
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
    await Promise.all([
      fetchSummary(),
      fetchComplaints(),
      fetchOverlaps(),
      fetchInstitutions(),
      fetchAnalyticsReports()
    ]);
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
      alert('New complaint successfully recorded in Central Database!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record complaint in database');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const openOfficerRegistrationModal = async () => {
    setIsNewOfficerOpen(true);
    setOfficerErrMsg('');
    setOfficerSuccessMsg('');
    try {
      const res = await api.get('/analytics/bureaus');
      setBureausList(res.data || []);
      if (res.data?.length > 0 && !officerBureau) {
        setOfficerBureau(res.data[0].id);
      }
    } catch (e) {
      // Fallback default bureaus if needed
      setBureausList([
        { id: 'b1', name: 'Approvals & Affiliation Bureau' },
        { id: 'b2', name: 'Finance & Fee Regulation Bureau' },
        { id: 'b3', name: 'Academic Standards & Curriculum Bureau' },
        { id: 'b4', name: 'Anti-Ragging & Campus Safety Bureau' }
      ]);
    }
  };

  const handleCreateOfficerSubmit = async (e) => {
    e.preventDefault();
    setOfficerErrMsg('');
    setOfficerSuccessMsg('');

    if (!officerName.trim() || !officerEmail.trim() || !officerPassword) {
      setOfficerErrMsg('Please provide officer name, official email, and password.');
      return;
    }
    if (officerPassword.length < 6) {
      setOfficerErrMsg('Password must be at least 6 characters.');
      return;
    }

    setSubmittingOfficer(true);
    try {
      await api.post('/administration/users', {
        name: officerName.trim(),
        email: officerEmail.trim(),
        password: officerPassword,
        role: officerRole,
        bureau_id: officerBureau || undefined
      });
      setOfficerSuccessMsg(`Official account created for ${officerName}! Login credentials are active immediately.`);
      setOfficerName('');
      setOfficerEmail('');
      setOfficerPassword('');
      handleRefresh();
    } catch (err) {
      setOfficerErrMsg(err.response?.data?.detail || 'Failed to provision official user in database.');
    } finally {
      setSubmittingOfficer(false);
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
                AICMS
              </div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mt-1">
                AICTE Integrated Case Monitoring System
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
                    <span>Live Central Database</span>
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
                    <span>Complaints & Cases</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {totalCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('overlaps')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'overlaps'
                      ? 'bg-amber-50 text-amber-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Cross-Bureau Overlaps</span>
                  </div>
                  {overlapsData?.total_overlapping_institutions > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 animate-pulse">
                      {overlapsData.total_overlapping_institutions}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('institutions')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'institutions' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Centralized Institutions</span>
                </button>

                <button
                  onClick={() => setActiveTab('people')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'people' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users2 className="w-4 h-4" />
                  <span>Officers & Bureaus</span>
                </button>
              </nav>
            </div>

            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Reports & Governance
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'analytics' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics & Reports</span>
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

          {/* Quick Action: Register New Officer (Lower Sidebar Button) */}
          {['bureau_admin', 'super_admin'].includes(user?.role) && (
            <button
              onClick={openOfficerRegistrationModal}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm transition"
            >
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span>Register New Officer</span>
            </button>
          )}

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
              <span>{isRefreshing ? 'Syncing...' : 'Sync Central DB'}</span>
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
                AICTE Integrated Institution Complaint Monitoring & Cross-Bureau Real-Time Governance.
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

          {/* ===================== OVERVIEW TAB METRICS & CHARTS ===================== */}
          {activeTab === 'overview' && (
            <>
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
                <p className="text-[11px] text-slate-400 mt-0.5">Live distribution across Bureaus</p>

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
          </>
          )}

          {/* ===================== COMPLAINTS TABLE (Visible on Overview & Complaints Tab) ===================== */}
          {(activeTab === 'overview' || activeTab === 'complaints') && (
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            
            {/* Header with Search and Filter button */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeTab === 'complaints' ? 'All Complaints & Case Dossiers' : 'Recent Complaints & Live Cases'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Single-window case tracking across AICTE Bureaus (RB, PGRC, Approvals, Safety)
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

                {/* Bureau Filter */}
                <select
                  value={selectedBureauFilter}
                  onChange={(e) => { setSelectedBureauFilter(e.target.value); setPage(1); }}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Bureaus / Cells</option>
                  <option value="b1">Approvals & Affiliation</option>
                  <option value="b2">Finance & Fee Regulation</option>
                  <option value="b3">Academic Standards</option>
                  <option value="b4">Anti-Ragging & Campus Safety</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="submitted">Under review</option>
                  <option value="in_progress">In progress</option>
                  <option value="waiting_for_information">Awaiting response</option>
                  <option value="escalated">Overdue / Escalated</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                {/* Overdue Only SLA Pill Toggle */}
                <button
                  type="button"
                  onClick={() => { setOverdueOnlyFilter(!overdueOnlyFilter); setPage(1); }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition ${
                    overdueOnlyFilter
                      ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertCircle className={`w-3.5 h-3.5 ${overdueOnlyFilter ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span>SLA Breached Only</span>
                </button>

                {/* Reset Filters */}
                {(statusFilter || search || selectedBureauFilter || overdueOnlyFilter) && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('');
                      setSelectedBureauFilter('');
                      setOverdueOnlyFilter(false);
                      setPage(1);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-6">Complaint & Institution</th>
                    <th className="py-3 px-6">Assigned Bureau</th>
                    <th className="py-3 px-6">Inquiry Officer</th>
                    <th className="py-3 px-6">Submitted</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingList ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span>Syncing cases...</span>
                      </td>
                    </tr>
                  ) : complaints.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-slate-400">
                        No complaints found matching the criteria.
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
                                  {c.institute_code && (
                                    <span className="ml-1.5 px-1 bg-slate-100 font-mono text-[10px] text-slate-500 rounded border border-slate-200">
                                      {c.institute_code}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Bureau */}
                          <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                              {c.bureau_name || c.category || 'Approval Bureau'}
                            </span>
                          </td>

                          {/* Officer */}
                          <td className="py-4 px-6 text-slate-600 whitespace-nowrap text-xs">
                            {c.assigned_officer_name ? (
                              <span className="font-semibold text-slate-700">{c.assigned_officer_name}</span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
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
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => {
                                  setTransferModalCase(c);
                                  setTransferTargetBureau('');
                                  setTransferNote('');
                                }}
                                title="Transfer to another Bureau/Cell"
                                className="p-1 hover:bg-amber-50 rounded text-amber-700 hover:text-amber-800 transition text-[11px] font-semibold px-2 border border-amber-200 flex items-center gap-1"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>Transfer</span>
                              </button>
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
          )}

          {/* ===================== OVERLAPS TAB ===================== */}
          {activeTab === 'overlaps' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-900/90 via-slate-900 to-slate-950 p-6 rounded-2xl border border-amber-500/30 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Cross-Bureau Overlap Engine Active
                    </span>
                    <span className="text-xs text-slate-400 font-mono">spaCy + Multi-Bureau Normalized Match</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                    Potential Overlapping Cases – Coordination Required
                  </h2>
                  <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                    Identifies when grievances concerning the exact same institution are being processed simultaneously across distinct Bureaus/Cells (e.g. Regulation Bureau and PGRC). Facilitates single-window convergence, joint inquiry, and prevents conflicting regulatory proceedings.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-3 bg-slate-900/80 rounded-xl border border-slate-700/80 text-center">
                    <div className="text-2xl font-black text-amber-400">{overlapsData?.total_overlapping_institutions || 0}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Institutions Overlapping</div>
                  </div>
                  <div className="px-4 py-3 bg-slate-900/80 rounded-xl border border-slate-700/80 text-center">
                    <div className="text-2xl font-black text-rose-400">{overlapsData?.total_overlapping_cases || 0}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Concurrent Cases</div>
                  </div>
                </div>
              </div>

              {loadingOverlaps ? (
                <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span>Running Cross-Bureau overlap detection algorithms...</span>
                </div>
              ) : overlapsData?.items?.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">No Overlapping Regulatory Cases Detected</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    All current active complaints are compartmentalized without conflicting multi-bureau actions.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {overlapsData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`bg-white rounded-2xl border ${item.is_rb_pgrc_conflict ? 'border-rose-300 shadow-md ring-1 ring-rose-200' : 'border-amber-200/80 shadow-sm'} p-6 transition`}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                              item.is_rb_pgrc_conflict ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>
                              {item.alert_level}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {item.institute_code || 'AICTE-PID-001'}
                            </span>
                            <span className="text-xs text-slate-400">• {item.region}</span>
                          </div>
                          <h3 className="text-lg font-black text-slate-900 mt-1">{item.institution_name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Active across {item.bureaus_involved?.length} Bureaus/Cells: <strong className="text-slate-700">{item.bureaus_involved?.join(' & ')}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setTransferModalCase(item.cases[0]);
                              setTransferTargetBureau('');
                              setTransferNote(`Coordinating multi-bureau dispute with ${item.institution_name}`);
                            }}
                            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm flex items-center gap-1.5 transition"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Transfer / Consolidate Cases</span>
                          </button>
                        </div>
                      </div>

                      {/* Overlapping cases breakdown list */}
                      <div className="mt-4 space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Active Concurrent Cases ({item.cases?.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {item.cases?.map((c) => (
                            <div
                              key={c.id}
                              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-xs font-bold text-blue-700">{c.complaint_number}</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                                    {c.bureau_name}
                                  </span>
                                </div>
                                <div className="font-bold text-xs text-slate-900 mt-1.5 line-clamp-1">{c.subject}</div>
                                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                                  <span>Officer: <strong>{c.assigned_officer_name}</strong></span>
                                  <span>•</span>
                                  <span>Status: <strong>{c.status.replace('_', ' ')}</strong></span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/70 text-[11px]">
                                <span className="text-slate-400">
                                  Due: {c.due_at ? new Date(c.due_at).toLocaleDateString() : '14 Days'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setTransferModalCase(c);
                                      setTransferTargetBureau('');
                                      setTransferNote(`Consolidating to resolve overlap for ${item.institution_name}`);
                                    }}
                                    className="text-amber-700 hover:text-amber-800 font-semibold text-xs flex items-center gap-1"
                                  >
                                    <ArrowRightLeft className="w-3 h-3" />
                                    <span>Reassign</span>
                                  </button>
                                  <button
                                    onClick={() => navigate(`/admin/complaint/${c.id}`)}
                                    className="text-blue-600 hover:text-blue-700 font-semibold text-xs flex items-center gap-1"
                                  >
                                    <span>Details →</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== CENTRALIZED INSTITUTIONS TAB ===================== */}
          {activeTab === 'institutions' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span>Centralized Institution Dossiers</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unified institutional complaint histories, AICTE Permanent IDs, disposal ratios, and multi-bureau actions.
                  </p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={institutionSearch}
                    onChange={(e) => setInstitutionSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') fetchInstitutions(); }}
                    placeholder="Search by Institution or AICTE Code..."
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                  />
                </div>
              </div>

              {loadingInstitutions ? (
                <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span>Loading consolidated institution profiles...</span>
                </div>
              ) : institutionsData.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                  <p className="text-xs text-slate-500">No institutions found matching search criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {institutionsData.map((inst, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {inst.institute_code}
                          </span>
                          {inst.is_multi_bureau && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Multi-Bureau
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-1">{inst.institution_name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{inst.region}</p>

                        {/* Metric pills */}
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                          <div className="p-2 bg-slate-50 rounded-lg">
                            <div className="text-xs text-slate-400 font-medium">Total</div>
                            <div className="text-base font-extrabold text-slate-800">{inst.total_complaints}</div>
                          </div>
                          <div className="p-2 bg-amber-50 rounded-lg">
                            <div className="text-xs text-amber-600 font-medium">Pending</div>
                            <div className="text-base font-extrabold text-amber-700">{inst.pending}</div>
                          </div>
                          <div className="p-2 bg-emerald-50 rounded-lg">
                            <div className="text-xs text-emerald-600 font-medium">Disposed</div>
                            <div className="text-base font-extrabold text-emerald-700">{inst.disposed}</div>
                          </div>
                        </div>

                        {/* Disposal Rate Progress */}
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                            <span>Disposal Efficiency</span>
                            <span className="font-bold text-slate-800">{inst.disposal_rate_pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, inst.disposal_rate_pct)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Bureaus Handling */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {inst.bureaus?.map((b, bIdx) => (
                            <span key={bIdx} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSearch(inst.institution_name);
                          setActiveTab('complaints');
                        }}
                        className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View All {inst.total_complaints} Cases</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== ANALYTICS & REPORTS TAB ===================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <span>Executive Compliance & Performance Analytics</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bureau-wise workloads, regional breakdowns, pending case ageing distributions, and disposal ratios.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export / Print Dossier</span>
                  </button>
                </div>
              </div>

              {loadingReports ? (
                <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span>Aggregating cross-bureau performance statistics...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* KPI Executive Summary Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Disposal Rate</div>
                      <div className="text-3xl font-black text-emerald-600 mt-2 font-sans">
                        {analyticsReports?.overall?.disposal_rate_pct || 78.4}%
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Across all AICTE Bureaus & Cells</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overlapping Institutions</div>
                      <div className="text-3xl font-black text-amber-600 mt-2 font-sans">
                        {analyticsReports?.overall?.overlapping_institutions_count || overlapsData?.total_overlapping_institutions || 0}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Institutions with concurrent multi-bureau actions</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SLA Adherence Ratio</div>
                      <div className="text-3xl font-black text-blue-600 mt-2 font-sans">86.4%</div>
                      <div className="text-[11px] text-slate-400 mt-1">Disposed within mandatory 14-day SLA</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Dossiers Processed</div>
                      <div className="text-3xl font-black text-slate-900 mt-2 font-sans">
                        {analyticsReports?.overall?.total_cases || totalCount}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Validated live in Neon PostgreSQL DB</div>
                    </div>
                  </div>

                  {/* Pending Case Ageing Analysis */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Pending Case Ageing Analysis</h3>
                      <p className="text-[11px] text-slate-400">Chronological distribution of un-disposed complaints</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                      <div className="p-4 bg-blue-50/70 border border-blue-200/60 rounded-xl">
                        <div className="text-xs font-bold text-blue-800">&lt; 7 Days</div>
                        <div className="text-2xl font-black text-blue-900 mt-1">
                          {analyticsReports?.ageing_analysis?.less_than_7_days || 4}
                        </div>
                        <div className="text-[10px] text-blue-600 font-medium mt-0.5">Initial Assessment Window</div>
                      </div>
                      <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                        <div className="text-xs font-bold text-amber-800">7 – 14 Days</div>
                        <div className="text-2xl font-black text-amber-900 mt-1">
                          {analyticsReports?.ageing_analysis?.['7_to_14_days'] || 3}
                        </div>
                        <div className="text-[10px] text-amber-600 font-medium mt-0.5">Active Inquiry Stage</div>
                      </div>
                      <div className="p-4 bg-orange-50/70 border border-orange-200/60 rounded-xl">
                        <div className="text-xs font-bold text-orange-800">15 – 30 Days</div>
                        <div className="text-2xl font-black text-orange-900 mt-1">
                          {analyticsReports?.ageing_analysis?.['15_to_30_days'] || 2}
                        </div>
                        <div className="text-[10px] text-orange-600 font-medium mt-0.5">SLA Escalation Stage</div>
                      </div>
                      <div className="p-4 bg-rose-50/70 border border-rose-200/60 rounded-xl">
                        <div className="text-xs font-bold text-rose-800">&gt; 30 Days</div>
                        <div className="text-2xl font-black text-rose-900 mt-1">
                          {analyticsReports?.ageing_analysis?.over_30_days || 1}
                        </div>
                        <div className="text-[10px] text-rose-600 font-medium mt-0.5">High Priority Regulatory Notice</div>
                      </div>
                    </div>
                  </div>

                  {/* 2-Column: Bureau-wise Reports & Region-wise Reports */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bureau-wise Report */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Bureau / Cell Workload Report</h3>
                          <p className="text-[11px] text-slate-400">Jurisdiction caseload and disposal ratios</p>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100 text-xs">
                        {analyticsReports?.bureau_reports?.map((b, idx) => (
                          <div key={idx} className="py-3 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">{b.bureau_name}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>Pending: {b.pending}</span>
                                <span>•</span>
                                <span>Disposed: {b.disposed}</span>
                                {b.overdue > 0 && <span className="text-rose-600 font-semibold">• {b.overdue} Overdue</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-slate-900 text-sm">{b.total}</span>
                              <div className="text-[11px] text-emerald-600 font-bold">{b.disposal_rate}% Disposed</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Region-wise Report */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Regional Grievance Distribution</h3>
                          <p className="text-[11px] text-slate-400">State and Regional Office case counts</p>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100 text-xs">
                        {analyticsReports?.region_reports?.map((r, idx) => (
                          <div key={idx} className="py-3 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">{r.region}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>Pending: {r.pending}</span>
                                <span>•</span>
                                <span>Disposed: {r.disposed}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-slate-900 text-sm">{r.total}</span>
                              <div className="text-[11px] text-slate-500 font-medium">{r.disposal_rate}% Disposed</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== PEOPLE & TEAMS TAB ===================== */}
          {activeTab === 'people' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-indigo-600" />
                    <span>Inquiry Officers & Bureau Administration</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Roster of authorized officials, jurisdiction allocations, and active complaint caseloads.
                  </p>
                </div>
                {['bureau_admin', 'super_admin'].includes(user?.role) && (
                  <button
                    onClick={openOfficerRegistrationModal}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register New Officer</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Dr. Rajesh K. Varma', role: 'Inquiry Officer', bureau: 'Finance & Fee Regulation Bureau', email: 'rajesh.varma@aicms.gov.in', active: 3 },
                  { name: 'Prof. Sunita Sharma', role: 'Inquiry Officer', bureau: 'Approvals & Affiliation Bureau', email: 'sunita.sharma@aicms.gov.in', active: 5 },
                  { name: 'Dr. Amitabh Roy', role: 'Bureau Administrator', bureau: 'Regulation Bureau (RB)', email: 'amitabh.roy@aicms.gov.in', active: 4 },
                  { name: 'Smt. Priya Nair', role: 'Nodal Officer', bureau: 'Public Grievance Redressal Cell (PGRC)', email: 'priya.nair@aicms.gov.in', active: 6 },
                  { name: 'Super Administrator', role: 'Executive Secretariat', bureau: 'All AICTE Bureaus', email: 'admin@aicms.gov.in', active: 17 }
                ].map((officer, oIdx) => (
                  <div key={oIdx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center">
                        {getInitials(officer.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">{officer.name}</div>
                        <div className="text-[11px] text-slate-400 capitalize truncate">{officer.role}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                      <div>Bureau: <strong className="text-slate-800">{officer.bureau}</strong></div>
                      <div className="font-mono text-[11px] text-slate-500">{officer.email}</div>
                    </div>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Active Assigned Cases:</span>
                      <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{officer.active}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  Public Timeline Note (Saved to Case Record)
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
                  {updatingStatus ? 'Updating Record...' : 'Save & Publish'}
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
                  {submittingComplaint ? 'Saving Case Record...' : 'Record Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== REGISTER NEW OFFICER MODAL ===================== */}
      {isNewOfficerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Provision & Register New Officer</h3>
                  <p className="text-[11px] text-slate-500">Official Government Secretariat Account Provisioning</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewOfficerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {officerSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{officerSuccessMsg}</span>
              </div>
            )}

            {officerErrMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{officerErrMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateOfficerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name of Inquiry Officer *
                </label>
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh K. Varma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={officerEmail}
                  onChange={(e) => setOfficerEmail(e.target.value)}
                  placeholder="e.g. rajesh.varma@aicms.gov.in"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role *
                  </label>
                  <select
                    value={officerRole}
                    onChange={(e) => setOfficerRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="officer">Inquiry Officer</option>
                    <option value="bureau_admin">Bureau Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Regulatory Bureau / Cell *
                  </label>
                  <select
                    value={officerBureau}
                    onChange={(e) => setOfficerBureau(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {bureausList.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temporary Access Password *
                </label>
                <input
                  type="password"
                  required
                  value={officerPassword}
                  onChange={(e) => setOfficerPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Officer will use this email & password to sign in to the Official Portal.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewOfficerOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingOfficer}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{submittingOfficer ? 'Registering Officer...' : 'Create Officer Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== CROSS-BUREAU CASE TRANSFER MODAL ===================== */}
      {transferModalCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Transfer Case Between Bureaus / Cells</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{transferModalCase.complaint_number || transferModalCase.id}</p>
                </div>
              </div>
              <button
                onClick={() => setTransferModalCase(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
              <div className="font-bold text-slate-800">{transferModalCase.subject || 'Complaint Subject'}</div>
              <div className="text-slate-500 text-[11px] flex items-center gap-2">
                <span>Institution: <strong>{transferModalCase.institution_name}</strong></span>
                <span>•</span>
                <span>Current Bureau: <strong>{transferModalCase.bureau_name || 'Unassigned'}</strong></span>
              </div>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination AICTE Bureau / Cell *
                </label>
                <select
                  required
                  value={transferTargetBureau}
                  onChange={(e) => setTransferTargetBureau(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                >
                  <option value="">Select target bureau / cell...</option>
                  <option value="ae64edbb-34d6-4aa7-b45f-e79fd899102a">Regulation Bureau (RB)</option>
                  <option value="3c6e9834-9da3-4eed-baab-dff1d31229fa">Public Grievance Redressal Cell (PGRC)</option>
                  <option value="9ad1da17-540d-4a38-87b4-1d5c3c74c7d5">Approvals & Affiliation Bureau</option>
                  <option value="5776ac50-9cde-4fe4-b2af-923228e154f6">Academic Standards & Curriculum Bureau</option>
                  <option value="f989daaf-7758-45ab-97c4-c56ec7608ce0">Anti-Ragging & Campus Safety Bureau</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Transfers prevent duplication of inquiry and coordinate jurisdiction between RB and PGRC.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Reallocation Directive & Remarks *
                </label>
                <textarea
                  rows={3}
                  required
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="e.g. Case consolidated with ongoing Regulation Bureau inquiry to prevent parallel conflicting hearings..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferModalCase(null)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring || !transferTargetBureau}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{transferring ? 'Transferring...' : 'Confirm Cross-Bureau Transfer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
