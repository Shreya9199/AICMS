import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FilePlus, Upload, AlertCircle, CheckCircle2, ArrowRight,
  ShieldAlert, Building2, MapPin, Tag, Info
} from 'lucide-react';

const CATEGORIES = [
  'Fee & Financial Grievance',
  'Approvals & Affiliation',
  'Infrastructure & Faculty',
  'Academic & Examinations',
  'Campus Safety & Ragging',
  'Admission & Capitation Malpractice',
  'Scholarship & Financial Aid Delay',
  'Other Grievance'
];

const STATES = [
  'Andhra Pradesh', 'Delhi NCR', 'Gujarat', 'Karnataka', 'Maharashtra',
  'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Other State'
];

export const SubmitComplaintPage = () => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [institutionName, setInstitutionName] = useState('');
  const [instituteCode, setInstituteCode] = useState('');
  const [institutionState, setInstitutionState] = useState(STATES[0]);
  const [priority, setPriority] = useState('medium');
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successComplaint, setSuccessComplaint] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (subject.trim().length < 5) {
      setError('Subject must be at least 5 characters long.');
      return;
    }
    if (description.trim().length < 20) {
      setError('Please provide a detailed grievance description of at least 20 characters.');
      return;
    }
    if (!institutionName.trim()) {
      setError('Please specify the institution name.');
      return;
    }

    setLoading(true);
    try {
      // 1. Submit Complaint
      const res = await api.post('/portal/complaints', {
        subject: subject.trim(),
        description: description.trim(),
        category,
        institution_name: institutionName.trim(),
        institute_code: instituteCode.trim() || undefined,
        institution_state: institutionState,
        priority
      });

      const newComplaint = res.data;

      // 2. Upload supporting documents if attached
      if (files.length > 0) {
        for (const f of files) {
          const formData = new FormData();
          formData.append('file', f);
          try {
            await api.post(`/portal/complaints/${newComplaint.id}/attachments`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } catch (uploadErr) {
            console.error('Attachment upload failed:', uploadErr);
          }
        }
      }

      setSuccessComplaint(newComplaint);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit grievance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (successComplaint) {
    return (
      <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-md text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Grievance Registered Successfully</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your grievance has been acknowledged and scheduled for bureau review under official SLA terms.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto">
            <span className="text-xs text-slate-400 block font-semibold uppercase">Your Complaint Reference Number</span>
            <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1">
              {successComplaint.complaint_number}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Save this number to track your grievance status anytime.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(`/track?id=${successComplaint.complaint_number}`)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm shadow transition"
            >
              Track Complaint Timeline
            </button>
            <button
              onClick={() => navigate('/portal')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition"
            >
              Go to My Complaints
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold text-slate-900">File a Grievance • AICMS</h1>
          <p className="text-xs text-slate-500 mt-1">
            AICTE Integrated Case Monitoring System — Provide comprehensive details for expedited regulatory allocation and 14-day SLA monitoring.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          
          {/* Institution Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Institution Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. Apex Institute of Technology"
                  className="w-full px-3.5 py-2.5 pl-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                AICTE Permanent ID
              </label>
              <input
                type="text"
                value={instituteCode}
                onChange={(e) => setInstituteCode(e.target.value)}
                placeholder="e.g. 1-3512345678"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State / Region *
              </label>
              <select
                value={institutionState}
                onChange={(e) => setInstitutionState(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grievance Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Grievance Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Perceived Urgency / Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="low">Low (General Query / Record Request)</option>
                <option value="medium">Medium (Standard Redressal)</option>
                <option value="high">High (Financial / Academic Delay)</option>
                <option value="urgent">Urgent (Safety / Ragging / Imminent Deadline)</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Grievance Subject / Title *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Concise summary of the grievance (min 5 characters)"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Grievance Description *
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the facts chronologically, including dates, personnel involved, and specific relief requested (min 20 characters)..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Character count: {description.length} (minimum 20 required)
            </span>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Supporting Proof / Documents (Optional)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50 hover:bg-slate-100 transition">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <div className="text-xs text-slate-600">
                <label className="font-semibold text-blue-600 hover:underline cursor-pointer">
                  <span>Browse files</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="sr-only"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  />
                </label>{' '}
                <span>or drag & drop</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                PDF, JPG, PNG, DOC up to 10MB each
              </p>
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-1">
                <span className="text-xs font-semibold text-slate-700">Selected files:</span>
                {files.map((f, i) => (
                  <div key={i} className="text-xs text-slate-600 flex items-center justify-between bg-slate-100 px-2 py-1 rounded">
                    <span>{f.name}</span>
                    <span className="font-mono text-[10px]">{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2.5 text-xs text-blue-800">
            <Info className="w-4 h-4 flex-shrink-0 text-blue-600 mt-0.5" />
            <div>
              <strong>Complainant Privacy Guarantee:</strong> Your grievance will be allocated a nonsequential ID. Internal staff discussions remain private to regulatory officials, and only public status updates are visible.
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <span>Submitting Grievance...</span>
            ) : (
              <>
                <FilePlus className="w-4 h-4" />
                <span>Submit Grievance for Redressal</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
