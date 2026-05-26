import moment from 'moment-timezone';
import AngelBroking from './angelBroking.js';
import IronCondorStrategy from './ironCondor.js';
import RiskManager from './riskManager.js';
import prisma from './database.js';
import fs from 'fs';

class AutoTrader {
  constructor(config) {
    this.config = config;
    this.broker = new AngelBroking(config);
    this.riskManager = new RiskManager(config);
    this.strategy = new IronCondorStrategy(config, this.riskManager);
    this.isRunning = false;
    this.db = prisma; // Use Prisma client
    this.setupLogging();
  }

  /**
   * Setup Logging folders
   */
  setupLogging() {
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs', { recursive: true });
    }
  }

  /**
   * Start Auto Trader
   */
  async start() {
    console.log('\n🚀 NIFTY 50 OPTIONS AUTO TRADER STARTING...\n');

    // Login to broker
    const loginSuccess = await this.broker.login();
    if (!loginSuccess) {
      console.error('❌ Failed to connect to Angel Broking');
      return;
    }

    this.isRunning = true;

    // Initialize daily stats
    this.riskManager.resetDailyStats();

    // Start monitoring loop
    this.monitoringLoop();
  }

  /**
   * Main Monitoring Loop
   */
  async monitoringLoop() {
    const MARKET_OPEN = '09:15';
    const MARKET_CLOSE = '15:30';

    console.log('✅ Market monitoring started');
    console.log(`📅 Time: ${moment().tz('Asia/Kolkata').format('HH:mm:ss')}`);

    // Run every 1 minute
    const interval = setInterval(async () => {
      const currentTime = moment().tz('Asia/Kolkata').format('HH:mm');

      // Check if market is open
      if (currentTime < MARKET_OPEN || currentTime >= MARKET_CLOSE) {
        if (currentTime === '15:30') {
          await this.closeAllPositions('Market Close');
        }
        return;
      }

      try {
        // Get NIFTY 50 spot price
        const spotPrice = await this.getNiftySpot();
        if (!spotPrice) return;

        // Get volatility (VIX)
        const volatility = await this.getVolatility();

        // Get options chain
        const optionsChain = await this.getOptionsChain();
        if (optionsChain.length === 0) return;

        // Analyze and generate signals
        const signal = this.strategy.analyzeOptionsChain(
          optionsChain,
          spotPrice,
          volatility
        );

        if (signal.entrySignal && !this.riskManager.isCircuitBreakerHit()) {
          console.log('\n' + '='.repeat(60));
          console.log('🎯 ENTRY SIGNAL GENERATED');
          console.log('='.repeat(60));
          
          signal.reasons.forEach(reason => console.log(reason));

          // Execute the trade
          await this.executeTrade(signal);
        }

        // Monitor active positions
        await this.monitorPositions();

        // Log status every 5 minutes
        if (moment().minute() % 5 === 0) {
          this.logStatus();
        }

      } catch (error) {
        console.error('❌ Error in monitoring loop:', error.message);
      }
    }, 60000); // Run every minute

    // Store interval for cleanup
    this.monitoringInterval = interval;
  }

  /**
   * Execute Trade
   */
  async executeTrade(signal) {
    try {
      const orderLegs = this.strategy.createOrderLegs(
        signal.strikeSelection,
        signal.setupDetails
      );

      const tradeId = `TRADE-${moment().format('YYYYMMDDHHmmss')}`;
      const executedOrders = [];

      console.log('\n📋 Executing Iron Condor Order Legs...\n');

      for (const leg of orderLegs) {
        console.log(`   Leg ${leg.legId}: ${leg.type} ${leg.optionType} @ ₹${leg.price}`);

        // Place order (in paper trading mode, skip actual execution)
        if (this.config.paperTrading.enabled) {
          executedOrders.push({
            ...leg,
            orderId: `PAPER-${moment().format('YYYYMMDDHHmmssSSS')}`,
            status: 'FILLED',
          });
        } else {
          const order = await this.broker.placeOrder({
            symbol: leg.symbol,
            side: leg.type,
            quantity: leg.quantity,
            price: leg.price,
            orderType: 'LIMIT',
            productType: 'MIS',
          });

          if (order.success) {
            executedOrders.push({
              ...leg,
              orderId: order.orderId,
              status: 'PENDING',
            });
          }
        }
      }

      // Record trade in strategy memory
      const position = this.strategy.addActivePosition({
        tradeId: tradeId,
        symbol: this.config.strategy.underlyingSymbol,
        strikeSelection: signal.strikeSelection,
        entryPrice: signal.setupDetails.netPremium,
        maxLoss: signal.setupDetails.maxLoss,
        maxProfit: signal.setupDetails.maxProfit,
        expiryTime: moment().add(4, 'days'), // Assuming weekly options
        orders: executedOrders,
        status: 'OPEN',
      });

      // Calculate exit levels
      const exitLevels = this.riskManager.calculateExitLevels(
        signal.setupDetails.maxProfit,
        signal.setupDetails.maxLoss,
        signal.setupDetails.netPremium
      );

      position.exitLevels = exitLevels;

      // Save to PostgreSQL database using Prisma nested writing
      const entryTime = new Date();
      await this.db.trade.create({
        data: {
          tradeId: tradeId,
          entryTime: entryTime,
          symbol: position.symbol,
          strikeSelection: JSON.stringify(signal.strikeSelection),
          entryPrice: parseFloat(position.entryPrice),
          maxLoss: parseFloat(position.maxLoss),
          maxProfit: parseFloat(position.maxProfit),
          status: 'OPEN',
          orders: {
            create: executedOrders.map((order, index) => ({
              orderId: order.orderId,
              side: order.type,
              symbol: order.symbol,
              quantity: parseInt(order.quantity),
              price: parseFloat(order.price || (order.type === 'SELL' ? 120.50 : 20.25)),
              status: 'FILLED',
              timestamp: entryTime
            }))
          }
        }
      });

      // Log trade
      this.riskManager.logTrade({
        type: 'ENTRY',
        tradeId: tradeId,
        entryPrice: signal.setupDetails.netPremium,
        maxLoss: signal.setupDetails.maxLoss,
      });

      console.log(`\n✅ Trade ${tradeId} EXECUTED`);
      console.log(`   Entry Premium: ₹${signal.setupDetails.netPremium.toFixed(2)}`);
      console.log(`   Max Loss: ₹${signal.setupDetails.maxLoss.toFixed(2)}`);
      console.log(`   Max Profit: ₹${signal.setupDetails.maxProfit.toFixed(2)}`);
      console.log(`   Profit Target: ₹${exitLevels.profitTarget.toFixed(2)}`);
    } catch (e) {
      console.error('❌ Error executing trade:', e.message);
    }
  }

  /**
   * Monitor Active Positions
   */
  async monitorPositions() {
    const activePositions = this.strategy.getActivePositions();

    for (const position of activePositions) {
      // Get current price (mock for paper trading)
      const currentPrice = position.entryPrice + (Math.random() - 0.5) * 10;

      const signals = this.riskManager.monitorPosition({
        ...position,
        currentPrice: currentPrice,
      });

      if (signals.shouldExit) {
        console.log(`\n${signals.exitReason}`);
        await this.closePosition(position.tradeId, currentPrice, signals.exitReason);
      }
    }
  }

  /**
   * Close Position
   */
  async closePosition(tradeId, exitPrice, reason) {
    try {
      const position = this.strategy.activePositions.find(p => p.tradeId === tradeId);
      if (!position) return;

      const closedPosition = this.strategy.closePosition(tradeId, exitPrice, reason);

      // Update trade in PostgreSQL database using Prisma Client
      await this.db.trade.update({
        where: {
          tradeId: tradeId,
        },
        data: {
          exitTime: new Date(),
          exitPrice: parseFloat(exitPrice),
          status: 'CLOSED',
          exitReason: reason,
          realizedPL: parseFloat(exitPrice - position.entryPrice),
          orders: {
            updateMany: {
              where: {
                tradeId: tradeId,
              },
              data: {
                status: 'CLOSED',
              },
            },
          },
        },
      });

      // Log exit
      this.riskManager.logTrade({
        type: 'EXIT',
        tradeId: tradeId,
        entryPrice: position.entryPrice,
        exitPrice: exitPrice,
        realizedP_L: exitPrice - position.entryPrice,
      });

      console.log(`✅ Trade ${tradeId} CLOSED at ₹${exitPrice.toFixed(2)}`);
    } catch (e) {
      console.error(`❌ Error closing trade ${tradeId}:`, e.message);
    }
  }

  /**
   * Close All Positions (at market close)
   */
  async closeAllPositions(reason = 'Manual') {
    const activePositions = this.strategy.getActivePositions();
    
    console.log(`\n⏰ Closing ${activePositions.length} positions - ${reason}\n`);

    for (const position of activePositions) {
      await this.closePosition(position.tradeId, position.entryPrice, reason);
    }
  }

  /**
   * Get NIFTY 50 Spot Price
   */
  async getNiftySpot() {
    try {
      // In production, use real API
      // For now, return mock data
      return 24500 + Math.random() * 100;
    } catch (error) {
      console.error('Error fetching spot price:', error.message);
      return null;
    }
  }

  /**
   * Get Volatility (VIX)
   */
  async getVolatility() {
    try {
      // In production, fetch real VIX
      return 18 + Math.random() * 5;
    } catch (error) {
      console.error('Error fetching volatility:', error.message);
      return 15;
    }
  }

  /**
   * Get Options Chain
   */
  async getOptionsChain() {
    try {
      // Mock options chain
      const chain = [];
      const niftySpot = await this.getNiftySpot();
      
      for (let strike = niftySpot - 500; strike <= niftySpot + 500; strike += 100) {
        chain.push({
          strike: strike,
          optionType: 'CALL',
          ltp: Math.max(0, niftySpot - strike + Math.random() * 50),
          lastPrice: Math.max(0, niftySpot - strike + Math.random() * 50),
          expiryDate: moment().add(4, 'days').format('DDMMMYY'),
          greeks: {
            delta: Math.min(1, Math.max(-1, (niftySpot - strike) / 500)),
            theta: 0.02,
            vega: 0.1,
          },
        });

        chain.push({
          strike: strike,
          optionType: 'PUT',
          ltp: Math.max(0, strike - niftySpot + Math.random() * 50),
          lastPrice: Math.max(0, strike - niftySpot + Math.random() * 50),
          expiryDate: moment().add(4, 'days').format('DDMMMYY'),
          greeks: {
            delta: -Math.min(1, Math.max(-1, (niftySpot - strike) / 500)),
            theta: 0.02,
            vega: 0.1,
          },
        });
      }

      return chain;
    } catch (error) {
      console.error('Error fetching options chain:', error.message);
      return [];
    }
  }

  /**
   * Log Status
   */
  logStatus() {
    const summary = this.riskManager.getDailySummary();
    console.log('\n' + '='.repeat(60));
    console.log('📊 DAILY SUMMARY');
    console.log('='.repeat(60));
    console.log(`Date: ${summary.date}`);
    console.log(`Total Trades: ${summary.totalTrades}`);
    console.log(`Net P&L: ₹${summary.netP_L}`);
    console.log(`Open Positions: ${summary.currentOpenPositions}`);
    console.log(`Status: ${summary.healthStatus}`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Stop Auto Trader
   */
  async stop() {
    console.log('\n⏹️ Stopping auto trader...\n');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    await this.closeAllPositions('Trader Stopped');
    await this.broker.logout();
    await this.db.$disconnect(); // Cleanly disconnect Prisma Pool

    this.isRunning = false;
    console.log('✅ Auto Trader Stopped');
  }
}

export default AutoTrader;
