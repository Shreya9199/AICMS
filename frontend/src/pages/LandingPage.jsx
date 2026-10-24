import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, FileText, Search, Clock, ArrowRight,
  CheckCircle2, Users, AlertTriangle, Building, BarChart3, HelpCircle,
  Sparkles, Shield, ArrowUpRight, Check, Activity
} from 'lucide-react';

export const LandingPage = () => {
  const [trackNumber, setTrackNumber] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackNumber.trim()) {
      navigate(`/track?id=${encodeURIComponent(trackNumber.trim())}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative text-white py-16 lg:py-24 overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Glow ambient highlight */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headlines & Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md shadow-sm transition hover:border-blue-400/50">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Next-Gen Grievance Redressal & Monitoring</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
                Integrated Institutional <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300">
                  Grievance Monitoring
                </span> Portal
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal">
                A transparent, AI-driven escalation & tracking ecosystem for students, faculty, and institutions.
                Submit complaints confidentially, track real-time SLA metrics, and experience automated accountability.
              </p>

              {/* Main Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  to="/portal/submit"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition duration-200 group"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  <span>Submit Grievance</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition duration-200" />
                </Link>

                <Link
                  to="/track"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white backdrop-blur-md hover:-translate-y-0.5 transition duration-200"
                >
                  <Search className="w-5 h-5 mr-2 text-blue-400" />
                  <span>Track Status</span>
                </Link>
              </div>

              {/* SLA Guarantee pill */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-300">Mandatory 14-Day SLA Target</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-300">Strict Identity Protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-300">Transparent Public Audit</span>
                </div>
              </div>
            </div>

            {/* Right Column: Direct Quick Tracking Card */}
            <div className="lg:col-span-5">
              <div className="relative group">
                {/* Subtle colorful aura */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition duration-500" />
                
                <div className="relative bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/20">
                        <Search className="w-5 h-5" />
                      </div>
                      <span>Instant Grievance Lookup</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Enter your public tracking reference ID to see current bureau stage, officer review status, and resolution details.
                    </p>
                  </div>

                  <form onSubmit={handleTrack} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Complaint Tracking Code
                      </label>
                      <input
                        type="text"
                        value={trackNumber}
                        onChange={(e) => setTrackNumber(e.target.value)}
                        placeholder="e.g. NIV-2026-F89A2"
                        className="w-full px-4 py-3.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:bg-[length:200%_auto] text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition duration-300 flex items-center justify-center space-x-2"
                    >
                      <span>Fetch Live Status</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300 space-y-2">
                    <p className="font-semibold text-blue-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Try demo sample tracking numbers:
                    </p>
                    <div className="flex flex-wrap gap-2 font-mono">
                      <button
                        type="button"
                        onClick={() => setTrackNumber('NIV-2026-F89A2')}
                        className="text-blue-300 hover:text-white bg-slate-900/90 hover:bg-blue-600/30 border border-slate-700 hover:border-blue-500 px-2.5 py-1 rounded-md transition"
                      >
                        NIV-2026-F89A2
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrackNumber('NIV-2026-K94E7')}
                        className="text-blue-300 hover:text-white bg-slate-900/90 hover:bg-blue-600/30 border border-slate-700 hover:border-blue-500 px-2.5 py-1 rounded-md transition"
                      >
                        NIV-2026-K94E7
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3 Step Workflow Process */}
      <section className="py-20 relative bg-white/70 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 uppercase tracking-widest mb-3">
              Transparent Procedure
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How the Redressal Workflow Works
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3">
              Every complaint moves through strict oversight from registration to final compliance, logged immutably.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl bg-white shadow-sm border border-slate-200/80 relative group overflow-hidden">
              <div className="w-14 h-14 bg-blue-100/80 text-blue-700 rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-inner group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition duration-300">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Registration & Categorization</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Submit detailed grievances along with attachments. An encrypted reference token is issued for anonymous live tracking.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl bg-white shadow-sm border border-slate-200/80 relative group overflow-hidden">
              <div className="w-14 h-14 bg-indigo-100/80 text-indigo-700 rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-inner group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition duration-300">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Bureau Review & SLA Enforcement</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Grievances are channeled to specialized regulatory bureaus and assigned to officers under active countdown monitors.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl bg-white shadow-sm border border-slate-200/80 relative group overflow-hidden">
              <div className="w-14 h-14 bg-emerald-100/80 text-emerald-700 rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-inner group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition duration-300">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Audited Resolution & Compliance</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Receive verifiable timeline milestones as institution administrators comply, resolve, and publish corrective action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Redressal Bureaus Overview */}
      <section className="py-20 relative bg-slate-50/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Regulatory Coverage</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Configured Grievance Bureaus</h2>
            </div>
            <p className="text-sm text-slate-500 mt-2 md:mt-0 max-w-md">
              Complaints are routed by subject matter jurisdiction for fair and impartial investigation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Finance & Fee Regulation",
                desc: "Capitation fees, delayed refund of caution deposits, and unapproved tuition surcharges.",
                border: "border-blue-500",
                badge: "Financial",
                badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
              },
              {
                title: "Approvals & Affiliation",
                desc: "Unapproved branches, unaccredited programs, affiliation irregularities, and prospectus misrepresentation.",
                border: "border-indigo-500",
                badge: "Accreditation",
                badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
              },
              {
                title: "Academic Standards",
                desc: "Faculty student ratio deficits, examination withholding, and syllabus non-compliance.",
                border: "border-purple-500",
                badge: "Academics",
                badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
              },
              {
                title: "Anti-Ragging & Campus Safety",
                desc: "Hazing, harassment, student safety breaches, hostel welfare complaints, and zero-tolerance violations.",
                border: "border-rose-500",
                badge: "Priority",
                badgeColor: "bg-rose-50 text-rose-700 border-rose-200"
              }
            ].map((b, i) => (
              <div
                key={i}
                className={`glass-card p-6 rounded-2xl bg-white border-l-4 ${b.border} border-y border-r border-slate-200 shadow-sm flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.badgeColor}`}>
                      {b.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{b.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Official Credentials Demo Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-slate-300 py-12 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>Need Official Dashboard & Audit Access?</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Authorized Officers, Bureau Admins, and Super Administrators can sign in to inspect assigned dossiers, execute status transitions, and issue compliance notices.
            </p>
          </div>
          <Link
            to="/login?tab=official"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 transition duration-200 whitespace-nowrap"
          >
            Go to Official Login
          </Link>
        </div>
      </section>
    </div>
  );
};
