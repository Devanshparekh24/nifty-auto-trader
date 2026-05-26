import React from 'react';

function AlertBar() {
  return (
    <div className="bg-emerald-950/20 border border-emerald-800/20 rounded-xl p-4 flex items-center gap-3 text-sm text-emerald-200/90 shadow-md">
      <div className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
      </div>
      <div>
        <strong>Paper Trading Mode Enabled:</strong> Safe virtual sandboxed execution environment active. No real capital at risk.
      </div>
    </div>
  );
}

export default AlertBar;
