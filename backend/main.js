import config from './config.js';
import AutoTrader from './src/services/autoTraderService.js';
import express from 'express';
import cors from 'cors';
import TraderController from './src/controllers/traderController.js';
import createTraderRouter from './src/routes/apiRoutes.js';

// Initialize trader service
const trader = new AutoTrader(config);

// Initialize controller & router
const traderController = new TraderController(trader, config);
const traderRouter = createTraderRouter(traderController);

// Express server
const app = express();
app.use(cors());
app.use(express.json());

// Load MVC Routes
app.use('/api', traderRouter);

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
