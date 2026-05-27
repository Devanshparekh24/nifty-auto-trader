import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AlertBar from './components/AlertBar';
import StatsGrid from './components/StatsGrid';
import OptionChainDisplay from './components/OptionChainDisplay';
import TradesTable from './components/TradesTable';
import TradeDetailsModal from './components/TradeDetailsModal';
import PortfolioGrid from './components/PortfolioGrid';

const API_BASE = 'http://localhost:3001';

function App() {
  const [statusData, setStatusData] = useState(null);
  const [trades, setTrades] = useState([]);
  const [portfolioData, setPortfolioData] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [modalActive, setModalActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('--:--:--');

  const fetchData = async () => {
    try {
      // Fetch status
      const statusRes = await fetch(`${API_BASE}/api/status`);
      if (!statusRes.ok) throw new Error('API server unreachable');
      const statusJson = await statusRes.json();
      setStatusData(statusJson);

      // Fetch trades
      const tradesRes = await fetch(`${API_BASE}/api/trades`);
      if (!tradesRes.ok) throw new Error('Failed to fetch trade records');
      const tradesJson = await tradesRes.json();
      setTrades(tradesJson);

      // Fetch portfolio data
      const portfolioRes = await fetch(`${API_BASE}/api/portfolio`);
      if (portfolioRes.ok) {
        const portfolioJson = await portfolioRes.json();
        setPortfolioData(portfolioJson);
      }

      setError(null);
      setLastUpdate(new Date().toLocaleTimeString('en-IN'));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRowClick = async (tradeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/trades/${tradeId}`);
      if (!res.ok) throw new Error('Failed to fetch details');
      const data = await res.json();
      setSelectedTrade(data.trade);
      setSelectedOrders(data.orders);
      setModalActive(true);
    } catch (err) {
      console.error('Error fetching trade details:', err);
    }
  };

  const handleCloseModal = () => {
    setModalActive(false);
    setSelectedTrade(null);
    setSelectedOrders([]);
  };

  const handleTogglePaper = async (newVal) => {
    try {
      const res = await fetch(`${API_BASE}/api/toggle-paper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newVal })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error toggling paper trading:', err);
    }
  };

  if (loading && !statusData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-slate-400 font-medium bg-[#05070f]">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-violet-500 rounded-full animate-spin"></div>
        <p className="text-sm">Connecting to Trading Engine API...</p>
      </div>
    );
  }

  const summary = statusData?.dailySummary || {
    totalProfit: '0.00',
    totalLoss: '0.00',
    netP_L: '0.00',
    currentOpenPositions: 0,
    maxDailyLossRemaining: '10000.00'
  };

  const isPaper = statusData?.capital?.isPaper !== false;

  return (
    <div className="max-w-[1400px] w-full flex flex-col gap-6 mx-auto">
      
      {/* 1. Header Component */}
      <Header 
        traderStatus={statusData?.status} 
        error={error} 
        onRefresh={fetchData} 
        isPaper={isPaper}
        onTogglePaper={handleTogglePaper}
      />

      {/* 2. Paper Trading Notice Component */}
      <AlertBar />

      {/* 3. Stats Overview Cards Grid Component */}
      <StatsGrid 
        statusData={statusData} 
        summary={summary} 
      />

      {/* 3.5. Active Option Chain Feed Component */}
      <OptionChainDisplay latestOptionChain={statusData?.latestOptionChain} />

      {/* 4. Portfolio Grid Component */}
      <PortfolioGrid portfolioData={portfolioData} />

      {/* 5. Ledger Ledger Component */}
      <TradesTable 
        trades={trades} 
        onRowClick={handleRowClick} 
      />

      {/* 5. Footer */}
      <footer className="flex justify-between items-center text-xs text-slate-400 mt-2 px-2">
        <div>NIFTY 50 Option React Engine v1.0</div>
        <div>Last updated: {lastUpdate}</div>
      </footer>

      {/* 6. Modal Component */}
      {modalActive && selectedTrade && (
        <TradeDetailsModal 
          trade={selectedTrade} 
          orders={selectedOrders} 
          onClose={handleCloseModal} 
        />
      )}
      
    </div>
  );
}

export default App;
