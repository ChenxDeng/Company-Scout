
import React from 'react';

export const Skeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-slate-800 rounded w-1/4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-800 rounded"></div>
        <div className="h-4 bg-slate-800 rounded w-5/6"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-slate-900 rounded-xl border border-slate-800"></div>
        ))}
      </div>
    </div>
  );
};
