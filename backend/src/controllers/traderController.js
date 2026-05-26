import TradeModel from '../models/tradeModel.js';
import moment from 'moment-timezone';

class TraderController {
  constructor(trader, config) {
    this.trader = trader;
    this.config = config;
  }

  /**
   * GET /api/status
   */
  getStatus = (req, res) => {
    try {
      const summary = this.trader.riskManager.getDailySummary();
      const activePositions = this.trader.strategy.getActivePositions();

      res.json({
        status: this.trader.isRunning ? 'RUNNING' : 'STOPPED',
        dailySummary: summary,
        activePositions: activePositions,
        timestamp: moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
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
}

export default TraderController;
