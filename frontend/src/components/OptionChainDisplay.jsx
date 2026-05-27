import React from 'react';

function OptionChainDisplay({ latestOptionChain }) {
  if (!latestOptionChain) {
    return (
      <div className="bg-[#0b0e1a] border border-slate-800/80 rounded-2xl p-6 text-center text-slate-400">
        <p className="text-sm font-medium">⏳ Waiting for the first option chain analysis feed...</p>
      </div>
    );
  }

  const { expiryDate, spotPrice, volatility, analyzedAt, selectedStrikes } = latestOptionChain;

  return (
    <div className="bg-[#0b0e1a] border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      {/* Premium background gradient effect */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-violet-600/10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/5 rounded-full blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-emerald-600/10"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <span className="text-violet-400 animate-pulse">⚡</span> Active Option Chain Feed
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing strike prices and premiums for live strategy evaluation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-full">
            Last Checked: <strong className="text-violet-400">{analyzedAt}</strong>
          </span>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-full">
            Expiry: <strong className="text-emerald-400">{expiryDate}</strong>
          </span>
        </div>
      </div>

      {/* Grid containing Market Metrics & Strike Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Market Metrics Left Column */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Nifty Spot Price</span>
              <span className="text-xl font-bold font-mono text-slate-200">
                ₹{spotPrice ? spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
              </span>
            </div>
            <span className="text-2xl">📈</span>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">India VIX (Volatility)</span>
              <span className="text-xl font-bold font-mono text-slate-200">
                {volatility ? volatility.toFixed(2) : 'N/A'}
              </span>
            </div>
            <span className="text-2xl">🌪️</span>
          </div>
        </div>

        {/* Selected Strikes Right Column (The symmetric Iron Condor wings) */}
        <div className="lg:col-span-8 bg-slate-900/20 border border-slate-800/40 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center justify-between">
            <span>Iron Condor Wings (OTM Spreads)</span>
            <span className="text-[10px] text-violet-400 bg-violet-950/40 border border-violet-900/40 px-2 py-0.5 rounded normal-case font-mono">
              Auto-Selected
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Put Wing (Bull Put Spread) */}
            <div className="bg-emerald-950/10 border border-emerald-900/20 rounded-xl p-4">
              <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-900/30 px-2.5 py-0.5 rounded-full mb-3 tracking-wider">
                🟢 BULL PUT SPREAD (PE)
              </span>
              
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800/60 p-2.5 rounded-lg">
                  <span className="text-xs text-slate-400 font-medium">Short Put (Sell)</span>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">{selectedStrikes.shortPut} PE</span>
                    <span className="text-[10px] font-mono text-slate-400">LTP: ₹{selectedStrikes.shortPutLtp?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-900/30 border border-slate-800/40 p-2.5 rounded-lg opacity-85">
                  <span className="text-xs text-slate-400 font-medium">Long Put (Buy)</span>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400/80 block">{selectedStrikes.longPut} PE</span>
                    <span className="text-[10px] font-mono text-slate-400">LTP: ₹{selectedStrikes.longPutLtp?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Call Wing (Bear Call Spread) */}
            <div className="bg-rose-950/10 border border-rose-900/20 rounded-xl p-4">
              <span className="inline-block text-[10px] font-bold text-rose-400 bg-rose-950 border border-rose-900/30 px-2.5 py-0.5 rounded-full mb-3 tracking-wider">
                🔴 BEAR CALL SPREAD (CE)
              </span>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800/60 p-2.5 rounded-lg">
                  <span className="text-xs text-slate-400 font-medium">Short Call (Sell)</span>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-rose-400 block">{selectedStrikes.shortCall} CE</span>
                    <span className="text-[10px] font-mono text-slate-400">LTP: ₹{selectedStrikes.shortCallLtp?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-900/30 border border-slate-800/40 p-2.5 rounded-lg opacity-85">
                  <span className="text-xs text-slate-400 font-medium">Long Call (Buy)</span>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-rose-400/80 block">{selectedStrikes.longCall} CE</span>
                    <span className="text-[10px] font-mono text-slate-400">LTP: ₹{selectedStrikes.longCallLtp?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default OptionChainDisplay;
