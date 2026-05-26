import React from 'react';

function TradesTable({ trades, onRowClick }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl overflow-hidden flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold tracking-tight text-slate-100">
          Position Ledger & History
        </h2>
      </div>
      
      <div className="overflow-x-auto -mx-6">
        <table className="w-full border-collapse text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/40">
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Trade ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Entry Time</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Entry Price</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Max Profit</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Max Loss</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Realized P&L</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-slate-400 py-16 px-6">
                  No trades recorded in ledger. Run backtests or let trader trigger entries.
                </td>
              </tr>
            ) : (
              trades.map((trade) => {
                const isClosed = trade.status === 'CLOSED';
                const pl = trade.realizedP_L;
                
                const badgeClass = isClosed 
                  ? 'bg-slate-800/60 border-slate-700/60 text-slate-400' 
                  : 'bg-violet-500/10 border-violet-500/30 text-violet-400';
                
                const plTextClass = pl >= 0 
                  ? 'text-emerald-400 font-semibold' 
                  : 'text-rose-400 font-semibold';
                
                return (
                  <tr 
                    key={trade.tradeId} 
                    onClick={() => onRowClick(trade.tradeId)}
                    className="border-b border-slate-800/40 hover:bg-slate-800/20 active:bg-slate-800/40 transition-colors duration-200 cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-violet-400">{trade.tradeId}</td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-300">{new Date(trade.entryTime).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold tracking-wider border ${badgeClass}`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-right text-slate-200">
                      ₹{parseFloat(trade.entryPrice).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-right text-slate-200">
                      ₹{parseFloat(trade.maxProfit).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-right text-slate-200">
                      ₹{parseFloat(trade.maxLoss).toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 font-mono text-sm text-right ${plTextClass}`}>
                      {pl !== null ? `₹${parseFloat(pl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TradesTable;
