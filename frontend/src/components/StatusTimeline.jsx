import React from 'react';
import { CheckCircle2, Clock, FileText, ArrowRight } from 'lucide-react';

export const StatusTimeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <div className="py-6 text-center text-slate-400 text-sm">
        No status history updates recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {history.map((item, idx) => {
        const isLatest = idx === 0;
        const dateStr = new Date(item.created_at).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });

        return (
          <div key={item.id || idx} className="relative group">
            {/* Dot Indicator */}
            <div
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                isLatest
                  ? 'bg-blue-600 border-white ring-4 ring-blue-100 text-white'
                  : 'bg-white border-slate-300 text-slate-400'
              }`}
            >
              {isLatest ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            </div>

            {/* Content Card */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                    {item.new_status ? item.new_status.replace(/_/g, ' ') : 'Status Updated'}
                  </span>
                  {item.old_status && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      (from {item.old_status.replace(/_/g, ' ')})
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-mono">{dateStr}</span>
              </div>

              {item.public_note && (
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                  {item.public_note}
                </p>
              )}

              {item.changed_by_name && (
                <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                  <span>Authorized by:</span>
                  <span className="font-medium text-slate-600">{item.changed_by_name}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
