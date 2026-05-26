import React from 'react';
import MetricCard from './MetricCard';

function StatsGrid({ statusData, summary }) {
  const status = statusData?.status || 'STOPPED';
  const timestamp = statusData?.timestamp;
  
  const netPL = parseFloat(summary.netP_L);
  const totalProfit = parseFloat(summary.totalProfit);
  const totalLoss = parseFloat(summary.totalLoss);
  const lossRemaining = parseFloat(summary.maxDailyLossRemaining);

  // Status badge classes
  const statusClass = status === 'RUNNING'
    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    : 'bg-rose-500/10 border-rose-500/30 text-rose-400';

  // Realized P&L styles
  const plHeroClass = netPL >= 0 
    ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
    : 'text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.15)]';

  // Circuit status check
  let circuitText = '🟢 SECURE';
  let circuitColor = 'text-emerald-400';
  if (lossRemaining <= 0) {
    circuitText = '🛑 BREAKER HIT';
    circuitColor = 'text-rose-400 font-bold';
  } else if (lossRemaining <= 2500) {
    circuitText = '⚠️ CRITICAL LIMIT';
    circuitColor = 'text-amber-400 font-semibold';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      {/* System Status Card */}
      <MetricCard title="System Status" icon="💻">
        <div className="mt-2">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider border ${statusClass}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === 'RUNNING' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
            {status}
          </span>
        </div>
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
            <span className="text-sm text-slate-400">Market Time</span>
            <span className="text-sm font-semibold font-mono text-slate-200">
              {timestamp ? new Date(timestamp).toLocaleTimeString('en-IN') : '--:--:--'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Active Strategy</span>
            <span className="text-sm font-semibold text-slate-200">Iron Condor (OTM)</span>
          </div>
        </div>
      </MetricCard>

      {/* Net Realized P&L Card */}
      <MetricCard 
        title="Net Realized P&L" 
        icon="📊" 
        hero={`₹${netPL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        heroClass={plHeroClass}
      >
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
            <span className="text-sm text-slate-400">Today's Profit</span>
            <span className="text-sm font-semibold text-emerald-400">
              +₹{totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Today's Loss</span>
            <span className="text-sm font-semibold text-rose-400">
              -₹{Math.abs(totalLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </MetricCard>

      {/* Risk Overview Card */}
      <MetricCard title="Risk Overview" icon="🛡️">
        <div className="flex flex-col mt-1">
          <span className="text-xs text-slate-400">Circuit Breaker Target</span>
          <span className="text-2xl font-bold text-amber-500 font-mono mt-0.5">
            ₹{lossRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
            <span className="text-sm text-slate-400">Open Positions</span>
            <span className="text-sm font-semibold text-slate-200">{summary.currentOpenPositions} / 3</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Circuit Status</span>
            <span className={`text-sm font-bold ${circuitColor}`}>
              {circuitText}
            </span>
          </div>
        </div>
      </MetricCard>

    </div>
  );
}

export default StatsGrid;
