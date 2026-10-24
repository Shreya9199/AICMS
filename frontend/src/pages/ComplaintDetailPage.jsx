import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import {
  ArrowLeft, Clock, UserCheck, ShieldAlert, FileText, Send,
  AlertTriangle, CheckCircle2, Lock, Tag, Building2, MapPin,
  ExternalLink, Sparkles
} from 'lucide-react';

export const ComplaintDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status Change State
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Internal Note State
  const [noteBody, setNoteBody] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Assignment State (Bureau Admins / Super Admin)
  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Gemini AI Triage State
  const [aiTriage, setAiTriage] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);

  // Issue Action Required to Institution State
  const [actionRequiredInput, setActionRequiredInput] = useState('');
  const [actionRequiredLoading, setActionRequiredLoading] = useState(false);

  useEffect(() => {
    fetchComplaint();
    if (['bureau_admin', 'super_admin'].includes(user?.role)) {
      fetchOfficers();
    }
  }, [id]);

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/complaints/${id}`);
      setComplaint(res.data);
      setNewStatus(res.data.status);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await api.get('/system/officers');
      setOfficers(res.data);
    } catch (err) {
      console.error('Failed to load officers:', err);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus || newStatus === complaint.status) return;

    setStatusLoading(true);
    try {
      const res = await api.post(`/admin/complaints/${id}/status`, {
        status: newStatus,
        public_note: statusNote.trim() || undefined
      });
      setComplaint(res.data);
      setStatusNote('');
      alert('Status updated successfully');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteBody.trim()) return;

    setNoteLoading(true);
    try {
      await api.post(`/admin/complaints/${id}/notes`, {
        body: noteBody.trim()
      });
      setNoteBody('');
      fetchComplaint(); // refresh notes list
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add internal note');
    } finally {
      setNoteLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignLoading(true);
    try {
      const res = await api.post(`/admin/complaints/${id}/assign`, {
        assigned_officer_id: selectedOfficer || undefined,
        public_note: 'Assigned to authorized officer for formal inquiry.'
      });
      setComplaint(res.data);
      alert('Officer assigned successfully');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign officer');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDuplicateDecision = async (matchId, decision) => {
    try {
      await api.post(`/duplicates/${matchId}/decision`, { decision });
      fetchComplaint();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record duplicate decision');
    }
  };

  const handleEscalate = async () => {
    const reason = prompt('Enter escalation reason / notice:');
    if (!reason) return;

    try {
      const res = await api.post(`/admin/complaints/${id}/escalate`, {
        status: 'escalated',
        public_note: reason
      });
      setComplaint(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to escalate complaint');
    }
  };

  const handleRunAiTriage = async () => {
    setTriageLoading(true);
    try {
      const res = await api.post(`/admin/complaints/${id}/ai-triage`);
      setAiTriage(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'AI Triage evaluation failed');
    } finally {
      setTriageLoading(false);
    }
  };

  const handleIssueActionRequired = async (e) => {
    e.preventDefault();
    if (!actionRequiredInput.trim()) return;

    setActionRequiredLoading(true);
    try {
      const res = await api.post(`/admin/complaints/${id}/action-required`, {
        action_required: actionRequiredInput.trim()
      });
      setComplaint(res.data);
      setActionRequiredInput('');
      alert('Official corrective compliance directive successfully issued to institution!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to issue corrective action');
    } finally {
      setActionRequiredLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex-1 p-8 text-center text-slate-500">
        <p>Complaint not found or outside your official jurisdiction.</p>
        <Link to="/admin" className="text-indigo-600 underline mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation / Back Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/admin"
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAiTriage}
              disabled={triageLoading}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/25 transition flex items-center gap-1.5 disabled:opacity-60"
            >
              <Sparkles className={`w-3.5 h-3.5 ${triageLoading ? 'animate-spin' : ''}`} />
              <span>{triageLoading ? 'Evaluating with Gemini...' : 'Run Gemini AI Triage'}</span>
            </button>

            {complaint.status !== 'escalated' && complaint.status !== 'closed' && (
              <button
                onClick={handleEscalate}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow transition flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Escalate Complaint</span>
              </button>
            )}
          </div>
        </div>

        {/* Header Information Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {complaint.complaint_number}
                </span>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
                {complaint.is_overdue && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[11px] font-bold rounded uppercase">
                    Overdue SLA
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-2">
                {complaint.subject}
              </h1>
            </div>

            <div className="text-right text-xs">
              <div className="text-slate-400">Assigned Officer</div>
              <div className="font-bold text-slate-800 text-sm">
                {complaint.assigned_officer_name || 'Unassigned'}
              </div>
            </div>
          </div>

          {/* Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <span className="text-slate-400 block">Complainant</span>
              <span className="font-semibold text-slate-800">{complaint.complainant_name}</span>
              <span className="text-[11px] text-slate-500 block truncate">{complaint.complainant_email}</span>
            </div>

            <div>
              <span className="text-slate-400 block">Institution</span>
              <span className="font-semibold text-slate-800">{complaint.institution_name}</span>
              <span className="text-[11px] text-slate-500 block">{complaint.institution_state}</span>
            </div>

            <div>
              <span className="text-slate-400 block">Filing Date</span>
              <span className="font-semibold text-slate-800">
                {new Date(complaint.submitted_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">SLA Target</span>
              <span className={complaint.is_overdue ? 'font-bold text-rose-600' : 'font-semibold text-slate-800'}>
                {new Date(complaint.due_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </span>
            </div>
          </div>
        </div>

        {/* Gemini AI Triage Results Banner */}
        {aiTriage && (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/30 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Gemini 2.5 Flash Autonomous Grievance Triage</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                      Live AI Insight
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">Intelligent urgency classification, bureau routing recommendation & relief summary</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">Recommended Priority:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  aiTriage.recommended_priority === 'urgent'
                    ? 'bg-rose-500 text-white'
                    : aiTriage.recommended_priority === 'high'
                    ? 'bg-amber-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}>
                  {aiTriage.recommended_priority}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                  AI Executive Relief Summary
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {aiTriage.ai_summary}
                </p>
                {aiTriage.key_concerns && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {aiTriage.key_concerns.map((kc, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white/10 text-[11px] text-slate-200">
                        • {kc}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                  Recommended Bureau Assignment
                </span>
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>{aiTriage.recommended_bureau}</span>
                </div>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                    Suggested Immediate Action
                  </span>
                  <p className="text-slate-200">
                    {aiTriage.recommended_action}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NLP Review-Only Duplicate Warnings */}
        {complaint.duplicate_matches && complaint.duplicate_matches.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-900">
                  NLP Duplicate Suggestions ({complaint.duplicate_matches.length})
                </h3>
              </div>
              <span className="text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-medium">
                Decision Required by Official
              </span>
            </div>

            <p className="text-xs text-amber-800 leading-relaxed">
              Our explainable NLP model (spaCy + Sentence Transformers semantic similarity) identified possible overlapping grievances. Review-only: decisions are made by officials.
            </p>

            <div className="space-y-2 mt-2">
              {complaint.duplicate_matches.map((m) => (
                <div key={m.id} className="bg-white p-3 rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-900">{m.possible_duplicate_number}</span>
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">
                        {(m.similarity_score * 100).toFixed(1)}% match
                      </span>
                      {m.decision && (
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded uppercase font-bold text-[10px]">
                          Decision: {m.decision}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-1 text-xs">{m.match_reason}</p>
                  </div>

                  {!m.decision ? (
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleDuplicateDecision(m.id, 'confirmed')}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
                      >
                        Confirm Match
                      </button>
                      <button
                        onClick={() => handleDuplicateDecision(m.id, 'dismissed')}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2-Column Workflow Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Complaint Details & Timeline */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Description */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Complainant's Grievance Statement
              </h3>
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-line border border-slate-200">
                {complaint.description}
              </div>

              {/* Attachments */}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <div className="pt-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Evidence & Supporting Files
                  </h4>
                  <div className="space-y-1.5">
                    {complaint.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-slate-700">{att.original_filename}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {(att.size_bytes / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Public Timeline Updates */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Status & Resolution History (Public Timeline)</span>
              </h3>
              <StatusTimeline history={complaint.status_history} />
            </div>

          </div>

          {/* Right Column: Official Workflow Controls & Separate Internal Notes */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Demand Institutional Action / Corrective Directive */}
            <div className="bg-white p-6 rounded-xl border border-amber-200/80 shadow-sm space-y-3 bg-amber-50/20">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Demand Institutional Action</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Compliance Order
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Directs an official demand to {complaint.institution_name}. The complaint status moves to <em>Waiting for Information</em> until their submission.
              </p>

              {complaint.action_required ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-amber-900 block">Active Directive:</span>
                  <p className="text-amber-800">{complaint.action_required}</p>
                  {complaint.institutional_response ? (
                    <div className="mt-2 pt-2 border-t border-amber-200/60">
                      <span className="font-bold text-emerald-800 block text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Institution Filed Response:
                      </span>
                      <p className="text-emerald-900 text-xs mt-0.5">{complaint.institutional_response}</p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-700 italic block mt-1">
                      Awaiting response from institution administration.
                    </span>
                  )}
                </div>
              ) : null}

              <form onSubmit={handleIssueActionRequired} className="space-y-3 pt-1">
                <textarea
                  rows={2}
                  required
                  value={actionRequiredInput}
                  onChange={(e) => setActionRequiredInput(e.target.value)}
                  placeholder="Specify required records, fee refund proof, or inquiry committee findings..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                ></textarea>

                <button
                  type="submit"
                  disabled={actionRequiredLoading || !actionRequiredInput.trim()}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{actionRequiredLoading ? 'Issuing Directive...' : 'Issue Formal Compliance Order'}</span>
                </button>
              </form>
            </div>

            {/* 2. Workflow Status Transition Form */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Update Grievance Status</span>
              </h3>

              <form onSubmit={handleStatusUpdate} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Allowed Next Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_for_information">Waiting for Information</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Public Update Note (Visible to Complainant)
                  </label>
                  <textarea
                    rows={2}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="e.g. Official notice issued to college administration..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={statusLoading || newStatus === complaint.status}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow transition disabled:opacity-50"
                >
                  {statusLoading ? 'Updating...' : 'Publish Status Change'}
                </button>
              </form>
            </div>

            {/* 2. Assign Officer Control (Bureau Admin or Super Admin) */}
            {['bureau_admin', 'super_admin'].includes(user?.role) && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Assign Redressal Officer</span>
                </h3>

                <form onSubmit={handleAssign} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Designated Officer
                    </label>
                    <select
                      value={selectedOfficer}
                      onChange={(e) => setSelectedOfficer(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select an active officer...</option>
                      {officers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} {o.bureau_name ? `(${o.bureau_name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={assignLoading || !selectedOfficer}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs shadow transition disabled:opacity-50"
                  >
                    {assignLoading ? 'Assigning...' : 'Assign Officer'}
                  </button>
                </form>
              </div>
            )}

            {/* 3. STRICTLY SEPARATE INTERNAL NOTES (Official Eyes Only) */}
            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Internal Staff Notes</h3>
                </div>
                <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                  Strictly Confidential
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                These notes are never visible to the complainant portal users, audit logs, or public tracking pages.
              </p>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={2}
                  required
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Record confidential observation, phone log, or audit lead..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>

                <button
                  type="submit"
                  disabled={noteLoading}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{noteLoading ? 'Saving...' : 'Add Internal Note'}</span>
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-2.5 pt-2 max-h-60 overflow-y-auto">
                {complaint.internal_notes && complaint.internal_notes.length > 0 ? (
                  complaint.internal_notes.map((n) => (
                    <div key={n.id} className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-amber-300">{n.author_name}</span>
                        <span>{new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <p className="text-slate-200 whitespace-pre-line leading-relaxed">{n.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-500 py-3">No internal notes added yet.</p>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
