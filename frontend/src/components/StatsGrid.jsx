import React from 'react';
import MetricCard from './MetricCard';

function StatsGrid({ statusData, summary }) {
  const status = statusData?.status || 'STOPPED';
  const timestamp = statusData?.timestamp;
  
  const netPL = parseFloat(summary.netP_L);
  const totalProfit = parseFloat(summary.totalProfit);
  const totalLoss = parseFloat(summary.totalLoss);
  const lossRemaining = parseFloat(summary.maxDailyLossRemaining);

  const capital = statusData?.capital || {
    initial: 100000,
    current: 100000,
    isPaper: true
  };

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* 1. Margin Balance Card */}
      <MetricCard 
        title="Trading Balance" 
        icon="💰"
        hero={`₹${capital.current.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        heroClass="text-violet-400 drop-shadow-[0_0_15px_rgba(167,139,250,0.15)]"
      >
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
            <span className="text-sm text-slate-400">Starting Balance</span>
            <span className="text-sm font-semibold font-mono text-slate-300">
              ₹{capital.initial.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Trading Mode</span>
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-slate-400 bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded">
              {capital.isPaper ? '📝 Paper Trade' : '⚡ Live Trade'}
            </span>
          </div>
        </div>
      </MetricCard>

      {/* 2. Net Realized P&L Card */}
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

      {/* 3. Risk Overview Card */}
      <MetricCard 
        title="Risk Overview" 
        icon="🛡️"
        hero={`₹${lossRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        heroClass="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.15)]"
      >
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
            <span className="text-sm text-slate-400">Open Positions</span>
            <span className="text-sm font-semibold text-slate-200 font-mono">{summary.currentOpenPositions} / 3</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Circuit Status</span>
            <span className={`text-sm font-bold ${circuitColor}`}>
              {circuitText}
            </span>
          </div>
        </div>
      </MetricCard>

      {/* 4. System Status Card */}
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

    </div>
  );
}

export default StatsGrid;
