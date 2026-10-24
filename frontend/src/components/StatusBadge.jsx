import React from 'react';

const statusConfig = {
  submitted: { label: 'Submitted', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  under_review: { label: 'Under Review', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  assigned: { label: 'Assigned', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  waiting_for_information: { label: 'Waiting for Info', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  escalated: { label: 'Escalated', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  closed: { label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

export const StatusBadge = ({ status }) => {
  const conf = statusConfig[status] || {
    label: status ? status.replace('_', ' ') : 'Unknown',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${conf.bg} ${conf.text} ${conf.border}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {conf.label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const styles = {
    low: 'bg-slate-100 text-slate-700 border-slate-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    urgent: 'bg-rose-50 text-rose-700 border-rose-300 font-bold',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs uppercase font-medium border ${styles[priority] || styles.medium}`}>
      {priority}
    </span>
  );
};
