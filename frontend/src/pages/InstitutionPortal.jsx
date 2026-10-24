import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import {
  Building2, AlertCircle, CheckCircle2, Clock, FileText, Send,
  ChevronRight, ShieldAlert, AlertTriangle, Eye, Check, X, Sparkles
} from 'lucide-react';

export const InstitutionPortal = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected complaint for response submission
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/portal/institution/complaints');
      setComplaints(res.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load institutional complaints.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResponseModal = (comp) => {
    setActiveComplaint(comp);
    setResponseText(comp.institutional_response || '');
    setSubmitSuccess('');
    setError('');
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) {
      alert('Please enter your official institutional response statement.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/portal/institution/complaints/${activeComplaint.id}/respond`, {
        institutional_response: responseText.trim()
      });
      setSubmitSuccess('Official response submitted successfully and notified to regulatory cell!');
      setTimeout(() => {
        setActiveComplaint(null);
        fetchComplaints();
      }, 1400);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit institutional response.');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics calculation
  const total = complaints.length;
  const actionRequiredCount = complaints.filter(c => c.action_required && !c.institutional_response).length;
  const respondedCount = complaints.filter(c => c.institutional_response).length;
  const resolvedCount = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Institution Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Institutional Redressal Desk
              </span>
              {user?.institute_code && (
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  AICTE Code: {user.institute_code}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {user?.institution_name || 'Educational Institution'} Grievance Desk
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl">
              AICMS • AICTE Integrated Case Monitoring System — Review grievances directed against your campus, track bureau & cell actions, and submit required compliance responses.
            </p>
          </div>

          <button
            onClick={fetchComplaints}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh Records</span>
          </button>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Total Grievances</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{total}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm bg-rose-50/20">
            <span className="text-[11px] font-bold text-rose-600 block uppercase flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Action Required
            </span>
            <span className="text-2xl font-black text-rose-700 mt-1 block">{actionRequiredCount}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm">
            <span className="text-[11px] font-semibold text-indigo-600 block uppercase">Responses Filed</span>
            <span className="text-2xl font-black text-indigo-700 mt-1 block">{respondedCount}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
            <span className="text-[11px] font-semibold text-emerald-600 block uppercase">Resolved Cases</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{resolvedCount}</span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Complaints Listing */}
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs">Loading institutional case dossiers from Neon PostgreSQL...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Outstanding Grievances</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no complaints registered against {user?.institution_name || 'your institution'}. All records are in full regulatory compliance.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((comp) => {
              const needsAction = comp.action_required && !comp.institutional_response;
              return (
                <div
                  key={comp.id}
                  className={`bg-white rounded-2xl p-6 border shadow-sm transition space-y-4 ${
                    needsAction ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {comp.complaint_number}
                      </span>
                      <StatusBadge status={comp.status} />
                      <PriorityBadge priority={comp.priority} />
                      {needsAction && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded uppercase animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Compliance Action Required
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium">
                      Received: {new Date(comp.submitted_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })} • Target SLA: {new Date(comp.due_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </div>
                  </div>

                  {/* Grievance Details */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {comp.subject}
                    </h3>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Category:</span>
                      <span>{comp.category}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">Region:</span>
                      <span>{comp.institution_state}</span>
                    </div>
                    <div className="mt-3 p-3.5 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-line">
                      {comp.description}
                    </div>
                  </div>

                  {/* Official Action Required Notice by Bureau (if any) */}
                  {comp.action_required && (
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span>AICTE Bureau Directive / Required Corrective Action</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {comp.action_required}
                      </p>
                    </div>
                  )}

                  {/* Institution's Submitted Clarification */}
                  {comp.institutional_response && (
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Submitted Institutional Compliance Statement</span>
                        </div>
                        {comp.institutional_response_at && (
                          <span className="text-[10px] text-emerald-700 font-normal">
                            Filed: {new Date(comp.institutional_response_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-800 whitespace-pre-line leading-relaxed">
                        {comp.institutional_response}
                      </p>
                    </div>
                  )}

                  {/* Regulatory Bureau & Cell Actions (Status Timeline) */}
                  {comp.status_history && comp.status_history.length > 0 && (
                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Bureau & Cell Action Log
                      </span>
                      <div className="space-y-1.5">
                        {comp.status_history.map((h) => (
                          <div key={h.id} className="text-xs text-slate-600 flex items-start gap-2 bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="font-semibold text-slate-800">{h.changed_by_name || 'Bureau Cell'}: </span>
                              <span>{h.public_note}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {new Date(h.created_at).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response Actions */}
                  <div className="flex justify-end items-center gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenResponseModal(comp)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 ${
                        needsAction
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{comp.institutional_response ? 'Update Compliance Statement' : 'Submit Institutional Response'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for Submitting Institutional Response */}
        {activeComplaint && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Institutional Compliance Submission</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Complaint Ref: {activeComplaint.complaint_number}</p>
                </div>
                <button
                  onClick={() => setActiveComplaint(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {activeComplaint.action_required && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <strong className="block text-amber-900 mb-1">Bureau Directive to address:</strong>
                  {activeComplaint.action_required}
                </div>
              )}

              <form onSubmit={handleSubmitResponse} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Official College/Institution Statement & Corrective Action Taken *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Provide point-by-point clarification, committee findings, or corrective actions initiated by the college registrar/principal..."
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                  ></textarea>
                  <p className="text-[11px] text-slate-400 mt-1">
                    This response will be recorded into the official case timeline and reviewed by the AICTE Bureau Inquiry Officer.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveComplaint(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/25 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting to Bureau...' : 'Publish Official Response'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
