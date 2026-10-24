import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import {
  Search, ShieldCheck, AlertCircle, Clock, Building, MapPin,
  Calendar, FileText, Download, CheckCircle2, ChevronRight, Sparkles, Shield
} from 'lucide-react';

export const PublicTrackPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaintNumber, setComplaintNumber] = useState(searchParams.get('id') || '');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComplaint = async (num) => {
    if (!num) return;
    setLoading(true);
    setError('');
    setComplaint(null);

    try {
      const res = await api.get(`/portal/track/${encodeURIComponent(num.trim())}`);
      setComplaint(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Complaint not found. Verify the reference ID format (e.g. NIV-2026-F89A2).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setComplaintNumber(id);
      fetchComplaint(id);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (complaintNumber.trim()) {
      setSearchParams({ id: complaintNumber.trim() });
      fetchComplaint(complaintNumber);
    }
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Search Bar Header */}
        <div className="glass-card bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xl">
          <div className="text-center max-w-xl mx-auto mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Public Verification</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Track Grievance Status
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time audit records for registered complainants. No login required.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                value={complaintNumber}
                onChange={(e) => setComplaintNumber(e.target.value)}
                placeholder="Enter Reference ID (e.g. NIV-2026-F89A2)"
                className="w-full px-4 py-3 pl-11 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none bg-white transition shadow-sm"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {/* Quick Demo buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span>Quick sample lookups:</span>
            <button
              type="button"
              onClick={() => {
                setComplaintNumber('NIV-2026-F89A2');
                setSearchParams({ id: 'NIV-2026-F89A2' });
                fetchComplaint('NIV-2026-F89A2');
              }}
              className="text-blue-600 hover:text-blue-800 font-mono bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md transition"
            >
              NIV-2026-F89A2
            </button>
            <button
              type="button"
              onClick={() => {
                setComplaintNumber('NIV-2026-K94E7');
                setSearchParams({ id: 'NIV-2026-K94E7' });
                fetchComplaint('NIV-2026-K94E7');
              }}
              className="text-blue-600 hover:text-blue-800 font-mono bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md transition"
            >
              NIV-2026-K94E7
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Complaint Detail Card */}
        {complaint && (
          <div className="glass-card bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Card Header */}
            <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
              <div>
                <div className="text-xs text-blue-300 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Public Grievance Ref</span>
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-white mt-1">
                  {complaint.complaint_number}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
              </div>
            </div>

            {/* SLA & Filing Timestamps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50/80 border-b border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Submitted Date</span>
                <span className="font-bold text-slate-800 text-sm">
                  {new Date(complaint.submitted_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">SLA Target Date</span>
                <span className="font-bold text-slate-800 text-sm">
                  {new Date(complaint.due_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Institution</span>
                <span className="font-bold text-slate-800 text-sm truncate block" title={complaint.institution_name}>
                  {complaint.institution_name}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">State / Region</span>
                <span className="font-bold text-slate-800 text-sm">{complaint.institution_state}</span>
              </div>
            </div>

            {/* Complaint Content */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Subject</span>
                <p className="text-xl font-extrabold text-slate-900">{complaint.subject}</p>
                <div className="mt-2 inline-block px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                  Category: {complaint.category}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Description</span>
                <div className="p-5 bg-slate-50/80 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-line border border-slate-200">
                  {complaint.description}
                </div>
              </div>

              {/* Attachments (Public safe) */}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Supporting Documents ({complaint.attachments.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {complaint.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-sm hover:border-blue-400 transition"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="truncate font-semibold text-slate-700">{att.original_filename}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px] ml-2">
                          {(att.size_bytes / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Public Resolution Timeline & Official Updates</span>
                </h3>
                <StatusTimeline history={complaint.status_history} />
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
