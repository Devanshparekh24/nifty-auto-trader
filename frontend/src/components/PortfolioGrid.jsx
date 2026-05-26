import React, { useState } from 'react';

function PortfolioGrid({ portfolioData }) {
  const [activeTab, setActiveTab] = useState('positions'); // 'positions' or 'holdings'
  
  const positions = portfolioData?.positions || [];
  const holdings = portfolioData?.holdings || [];

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-100 flex items-center gap-2">
            💼 Angel One Live Portfolio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of your active positions and long-term equity holdings.
          </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-950/80 border border-slate-800/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase transition-all duration-300 ${
              activeTab === 'positions'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 Active Positions ({positions.length})
          </button>
          <button
            onClick={() => setActiveTab('holdings')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase transition-all duration-300 ${
              activeTab === 'holdings'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📈 Stock Holdings ({holdings.length})
          </button>
        </div>
      </div>

      {activeTab === 'positions' ? (
        <div className="overflow-x-auto">
          {positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 font-medium">
              <span className="text-2xl mb-2">📭</span> No active open positions in Angel One.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-3">Symbol</th>
                  <th className="pb-3 text-center">Type</th>
                  <th className="pb-3 text-right">Net Qty</th>
                  <th className="pb-3 text-right">Avg Price</th>
                  <th className="pb-3 text-right">LTP</th>
                  <th className="pb-3 text-right pr-3">Unrealized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {positions.map((pos, idx) => {
                  const pnl = parseFloat(pos.unrealisedprofitloss || 0);
                  const pnlClass = pnl >= 0 ? 'text-emerald-400' : 'text-rose-400';
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-800/20 transition-all font-mono text-sm">
                      <td className="py-4 pl-3 font-semibold text-slate-200">{pos.symbolname}</td>
                      <td className="py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pos.optiontype === 'CE' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        }`}>
                          {pos.optiontype}
                        </span>
                      </td>
                      <td className="py-4 text-right font-semibold text-slate-300">{pos.netqty}</td>
                      <td className="py-4 text-right text-slate-400">₹{parseFloat(pos.buyavgprice).toFixed(2)}</td>
                      <td className="py-4 text-right text-slate-300">₹{parseFloat(pos.ltp).toFixed(2)}</td>
                      <td className={`py-4 text-right pr-3 font-bold ${pnlClass}`}>
                        {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          {holdings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 font-medium">
              <span className="text-2xl mb-2">📭</span> No stock holdings in Angel One.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-3">Symbol</th>
                  <th className="pb-3 text-right">Quantity</th>
                  <th className="pb-3 text-right">LTP</th>
                  <th className="pb-3 text-right pr-3">Net Profit/Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {holdings.map((hold, idx) => {
                  const pnl = parseFloat(hold.profitandloss || 0);
                  const pnlClass = pnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-800/20 transition-all font-mono text-sm">
                      <td className="py-4 pl-3 font-semibold text-slate-200">{hold.tradingsymbol}</td>
                      <td className="py-4 text-right text-slate-300">{hold.quantity}</td>
                      <td className="py-4 text-right text-slate-300">₹{parseFloat(hold.ltp).toFixed(2)}</td>
                      <td className={`py-4 text-right pr-3 ${pnlClass}`}>
                        {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default PortfolioGrid;
