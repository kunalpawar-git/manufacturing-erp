import React from 'react';

export default function LoadingSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/80 p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div className="h-6 w-48 bg-slate-200 rounded"></div>
        <div className="h-8 w-24 bg-slate-200 rounded"></div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 bg-slate-100 rounded flex-1"
                style={{ opacity: 1 - r * 0.12 }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

