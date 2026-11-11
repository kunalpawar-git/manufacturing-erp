import React from 'react';
import { QrCode, ShieldCheck } from 'lucide-react';

export default function TraceabilityBanner({ title = 'End-to-End QR Genealogy Active' }) {
  return (
    <div className="bg-brand-900 text-white px-4 py-2.5 rounded-xl flex items-center justify-between text-xs shadow-sm">
      <div className="flex items-center gap-2">
        <QrCode className="w-4 h-4 text-brand-300" />
        <span className="font-semibold">{title}</span>
      </div>
      <div className="flex items-center gap-1.5 text-emerald-300 font-mono text-[11px]">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Vendor Batch → Internal Batch → Work Order → QC → Box QR → 3-Way Dispatch</span>
      </div>
    </div>
  );
}

