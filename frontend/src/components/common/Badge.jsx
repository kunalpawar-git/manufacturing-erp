import React from 'react';

const colorMap = {
  // Success / Approved / Passed / Cleared / Dispatched
  Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Passed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cleared: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Dispatched: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Verified Authentic': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Fully Received': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // Pending / Warning / In Progress / Sent
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  'Pending Clearance': 'bg-amber-50 text-amber-700 border-amber-200',
  Submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Production': 'bg-blue-50 text-blue-700 border-blue-200',
  'Sample Preparation': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Sample QC Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  Investigating: 'bg-amber-50 text-amber-700 border-amber-200',
  'Under CAPA': 'bg-purple-50 text-purple-700 border-purple-200',
  Sent: 'bg-blue-50 text-blue-700 border-blue-200',
  'Partially Received': 'bg-sky-50 text-sky-700 border-sky-200',
  'In Shipment': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Packed: 'bg-teal-50 text-teal-700 border-teal-200',
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Revised: 'bg-violet-50 text-violet-700 border-violet-200',

  // Danger / Failed / Rejected / Mismatch
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  Failed: 'bg-rose-50 text-rose-700 border-rose-200',
  'Sample QC Failed': 'bg-rose-50 text-rose-700 border-rose-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  'Mismatch Detected': 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
  Invalidated: 'bg-rose-50 text-rose-700 border-rose-200',
  Quarantined: 'bg-purple-50 text-purple-700 border-purple-200',
  Inactive: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function Badge({ children, status, className = '' }) {
  const displayStatus = status || children;
  const classes = colorMap[displayStatus] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {children || status}
    </span>
  );
}

