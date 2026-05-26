import React, { useEffect, useState } from 'react';

function TradeDetailsModal({ trade, orders, onClose }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Small timeout for smooth slide/fade-in animation
    const timeout = setTimeout(() => setActive(true), 20);
    return () => clearTimeout(timeout);
  }, []);

  const handleClose = () => {
    setActive(false);
    // Let animation run, then trigger parent unmount
    setTimeout(onClose, 200);
  };

  return (
    <div 
      className={`fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-[#0d111d] border border-slate-800 rounded-2xl w-full max-w-[650px] shadow-2xl overflow-hidden transition-all duration-300 transform ${active ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800">
          <h3 className="text-base md:text-lg font-bold tracking-tight text-slate-100">
            Trade Details: {trade.tradeId}
          </h3>
          <button 
            className="text-slate-400 hover:text-white text-2xl transition-colors duration-200 focus:outline-none"
            onClick={handleClose}
          >
            &times;
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-sm text-slate-400">Trade Entry Time</span>
              <span className="text-sm font-semibold font-mono text-slate-200">
                {new Date(trade.entryTime).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Strategy Status</span>
              <span className={`text-sm font-bold ${trade.status === 'CLOSED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {trade.status}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Executed Order Legs
            </h4>
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <div className="text-slate-400 text-sm py-4">No order leg records found.</div>
              ) : (
                orders.map((order, idx) => {
                  const sideClass = order.side === 'BUY' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400';
                  
                  return (
                    <div 
                      key={idx} 
                      className="bg-slate-900/30 border border-slate-800/60 hover:border-slate-800 rounded-xl p-4 flex justify-between items-center gap-4 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-200">
                            {order.side === 'BUY' ? 'Long Protection' : 'Short Option'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sideClass}`}>
                            {order.side}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">{order.symbol}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-slate-200 block">
                          ₹{parseFloat(order.price).toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400">Qty: {order.quantity} Lot</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradeDetailsModal;
