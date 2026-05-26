import React from 'react';

function MetricCard({ title, icon, hero, heroClass = '', children }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl hover:translate-y-[-4px] hover:border-slate-700/80 transition-all duration-300 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {title}
        </h3>
        <span className="text-xl opacity-90">{icon}</span>
      </div>
      
      {hero && (
        <div className={`text-4xl font-bold tracking-tight mt-1 ${heroClass}`}>
          {hero}
        </div>
      )}

      {children}
    </div>
  );
}

export default MetricCard;
