const config = require('./config');
const AutoTrader = require('./autoTrader');
const express = require('express');
const cors = require('cors');
const moment = require('moment-timezone');

// Initialize traders
const trader = new AutoTrader(config);

// Express server
const app = express();
app.use(cors());
app.use(express.json());

/**
 * Dashboard Endpoint
 */
app.get('/api/status', (req, res) => {
  const summary = trader.riskManager.getDailySummary();
  const activePositions = trader.strategy.getActivePositions();

  res.json({
    status: trader.isRunning ? 'RUNNING' : 'STOPPED',
    dailySummary: summary,
    activePositions: activePositions,
    timestamp: moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
  });
});

/**
 * Get All Trades
 */
app.get('/api/trades', (req, res) => {
  try {
    const trades = trader.db.prepare('SELECT * FROM trades ORDER BY entryTime DESC').all();
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Trade Details
 */
app.get('/api/trades/:tradeId', (req, res) => {
  try {
    const trade = trader.db.prepare('SELECT * FROM trades WHERE tradeId = ?').get(req.params.tradeId);
    const orders = trader.db.prepare('SELECT * FROM orders WHERE tradeId = ?').all(req.params.tradeId);
    
    res.json({
      trade: trade,
      orders: orders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stop Trader (Testing Only)
 */
app.post('/api/stop', async (req, res) => {
  await trader.stop();
  res.json({ message: 'Trader stopped' });
});

/**
 * Get Configuration
 */
app.get('/api/config', (req, res) => {
  res.json({
    strategy: config.strategy,
    riskManagement: config.riskManagement,
    paperTrading: config.paperTrading,
  });
});

/**
 * Start Server
 */
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`📊 API Server running at http://localhost:${PORT}`);
});

/**
 * Start Auto Trader
 */
(async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 NIFTY 50 OPTIONS AUTO TRADER');
  console.log('Strategy: Iron Condor with Defined Risk');
  console.log('Broker: Angel Broking');
  console.log('Mode: ' + (config.paperTrading.enabled ? 'PAPER TRADING' : 'LIVE TRADING'));
  console.log('='.repeat(70) + '\n');

  console.log('📋 Configuration:');
  console.log(`   Max Loss per Trade: ₹${config.riskManagement.maxLossPerTrade}`);
  console.log(`   Max Daily Loss: ₹${config.riskManagement.maxDailyLoss}`);
  console.log(`   Max Positions: ${config.riskManagement.maxPositions}`);
  console.log(`   Profit Target: ${config.riskManagement.profitTarget}% of max profit\n`);

  await trader.start();
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⏹️ Shutting down gracefully...');
  await trader.stop();
  process.exit(0);
});
