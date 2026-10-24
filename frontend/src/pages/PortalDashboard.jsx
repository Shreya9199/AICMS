import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import {
  FilePlus, Clock, ArrowRight, ShieldCheck, AlertCircle,
  FileText, Calendar, Building, ChevronRight
} from 'lucide-react';

export const PortalDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/portal/my-complaints');
      setComplaints(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load your complaints');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AICMS Complainant Portal</h1>
            <p className="text-xs text-slate-500 mt-1">
              AICTE Integrated Case Monitoring System — View your registered grievances and SLA progress
            </p>
          </div>
          <Link
            to="/portal/submit"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow transition space-x-2"
          >
            <FilePlus className="w-4 h-4" />
            <span>Submit New Grievance</span>
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Complaints List */}
        {loading ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm">Loading your grievance records...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Complaints Registered Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              You haven't filed any grievances. If you face any issues with an institution, you can register a complaint anytime.
            </p>
            <Link
              to="/portal/submit"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition"
            >
              <FilePlus className="w-4 h-4 mr-2" />
              <span>File Your First Grievance</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {complaints.map((comp) => (
              <div
                key={comp.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {comp.complaint_number}
                    </span>
                    <StatusBadge status={comp.status} />
                    <PriorityBadge priority={comp.priority} />
                    <span className="text-[11px] text-slate-400 font-mono">
                      Filed: {new Date(comp.submitted_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {comp.subject}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{comp.institution_name} ({comp.institution_state})</span>
                    </span>
                    <span>•</span>
                    <span>Category: <strong className="text-slate-700">{comp.category}</strong></span>
                    <span>•</span>
                    <span>
                      Target SLA: <strong className="text-slate-700">{new Date(comp.due_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <Link
                    to={`/track?id=${comp.complaint_number}`}
                    className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    <span>View Timeline</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
