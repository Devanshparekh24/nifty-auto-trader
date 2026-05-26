import React from 'react';

function Header({ traderStatus, error, onRefresh, isPaper, onTogglePaper }) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900/70 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-5 md:p-6 shadow-2xl gap-4">
      <div className="flex items-center gap-4">
        <div className="text-3xl bg-gradient-to-tr from-violet-500 to-purple-300 bg-clip-text text-transparent filter drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]">
          ⚡
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100">
            NIFTY 50 Options Auto Trader
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-medium mt-0.5">
            React Frontend Terminal • Angel Broking SmartAPI
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap justify-center">
        {/* Paper Trading Toggle */}
        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 px-4 py-2 rounded-xl">
          <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">
            {isPaper ? '📝 Paper Trade' : '⚡ Live Trade'}
          </span>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={!isPaper} 
              onChange={() => onTogglePaper(!isPaper)}
              className="sr-only peer" 
            />
            <div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 peer-checked:after:bg-violet-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-950 border border-slate-700"></div>
          </label>
        </div>

        {error && (
          <span className="bg-rose-950/40 border border-rose-800/40 text-rose-200 px-3 py-1.5 rounded-lg text-xs font-semibold animate-pulse">
            ⚠️ Connection Offline
          </span>
        )}
        <button
          className="flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl border border-slate-800 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg hover:shadow-violet-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          onClick={onRefresh}
        >
          <span>🔄</span> Refresh Terminal
        </button>
      </div>
    </header>
  );
}

export default Header;
