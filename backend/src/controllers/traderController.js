import TradeModel from '../models/tradeModel.js';
import moment from 'moment-timezone';
import fs from 'fs';

class TraderController {
  constructor(trader, config) {
    this.trader = trader;
    this.config = config;
  }

  /**
   * GET /api/status
   */
  getStatus = async (req, res) => {
    try {
      const summary = this.trader.riskManager.getDailySummary();
      const activePositions = this.trader.strategy.getActivePositions();

      let initialCapital = 100000;
      let currentBalance = 100000;

      if (this.config.paperTrading.enabled) {
        initialCapital = this.config.paperTrading.initialCapital || 100000;
        const netPL = parseFloat(summary.netP_L || 0);
        currentBalance = initialCapital + netPL;
      } else {
        // Fetch real-time available margin from broker
        const brokerBalance = await this.trader.broker.getBalance();
        const liveFunds = parseFloat(brokerBalance.net || brokerBalance.availablecash || 0);
        
        if (liveFunds > 0) {
          currentBalance = liveFunds;
          initialCapital = currentBalance - parseFloat(summary.netP_L || 0);
        } else {
          // If broker balance query returns empty (e.g. offline/failed login), use the custom env capital!
          initialCapital = parseInt(process.env.INITIAL_CAPITAL) || 100000;
          currentBalance = initialCapital + parseFloat(summary.netP_L || 0);
        }
      }

      let liveBrokerBalance = null;
      try {
        const brokerBalance = await this.trader.broker.getBalance();
        if (brokerBalance && (brokerBalance.net || brokerBalance.availablecash)) {
          liveBrokerBalance = {
            availableCash: parseFloat(brokerBalance.availablecash || 0),
            netMargin: parseFloat(brokerBalance.net || 0),
            utilisedMargin: parseFloat(brokerBalance.utilisedmargin || 0),
            blockedMargin: parseFloat(brokerBalance.blockedmargin || 0)
          };
        }
      } catch (err) {
        console.error('Error fetching live broker balance in controller:', err.message);
      }

      res.json({
        status: this.trader.isRunning ? 'RUNNING' : 'STOPPED',
        dailySummary: summary,
        activePositions: activePositions,
        latestOptionChain: this.trader.latestOptionChainSummary || null,
        timestamp: moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
        capital: {
          initial: initialCapital,
          current: currentBalance,
          isPaper: this.config.paperTrading.enabled
        },
        liveBrokerBalance: liveBrokerBalance
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/trades
   */
  getTrades = async (req, res) => {
    try {
      const trades = await TradeModel.getAllTrades(this.trader.db);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/trades/:tradeId
   */
  getTradeDetails = async (req, res) => {
    try {
      const { tradeId } = req.params;
      const trade = await TradeModel.getTradeById(this.trader.db, tradeId);
      const orders = await TradeModel.getOrdersByTradeId(this.trader.db, tradeId);
      
      res.json({
        trade: trade,
        orders: orders,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/stop
   */
  stopTrader = async (req, res) => {
    try {
      await this.trader.stop();
      res.json({ message: 'Trader stopped gracefully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/config
   */
  getConfig = (req, res) => {
    try {
      res.json({
        strategy: this.config.strategy,
        riskManagement: this.config.riskManagement,
        paperTrading: this.config.paperTrading,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/toggle-paper
   */
  togglePaperTrading = async (req, res) => {
    try {
      const { enabled } = req.body;
      
      // Update in-memory configurations
      this.config.paperTrading.enabled = !!enabled;
      this.trader.config.paperTrading.enabled = !!enabled;
      this.trader.broker.paperTrading = !!enabled;

      // Persist the change to the .env file!
      const envPath = './.env';
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('PAPER_TRADING=')) {
          envContent = envContent.replace(/PAPER_TRADING=(true|false)/g, `PAPER_TRADING=${enabled}`);
        } else {
          envContent += `\nPAPER_TRADING=${enabled}`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      }

      console.log(`🔄 Paper Trading mode dynamically toggled to: ${enabled ? 'ENABLED' : 'DISABLED'}`);

      res.json({
        success: true,
        paperTrading: enabled,
        message: `Paper trading successfully switched to ${enabled ? 'ENABLED' : 'DISABLED'}`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/portfolio
   */
  getPortfolioData = async (req, res) => {
    try {
      const positions = await this.trader.broker.getPortfolio();
      const holdings = await this.trader.broker.getHoldings();
      res.json({
        positions: positions,
        holdings: holdings
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

export default TraderController;
