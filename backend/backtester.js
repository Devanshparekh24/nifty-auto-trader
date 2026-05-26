import moment from 'moment';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';

class BacktestEngine {
  constructor(cfg) {
    this.config = cfg;
    this.trades = [];
    this.results = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      netP_L: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
    };
  }

  /**
   * Run Backtest on Historical Data
   */
  async runBacktest(historicalData) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 STARTING BACKTEST');
    console.log('='.repeat(70) + '\n');

    let portfolioValue = this.config.paperTrading.initialCapital;
    let dailyValues = [portfolioValue];

    for (let i = 0; i < historicalData.length; i++) {
      const day = historicalData[i];

      // Generate signal
      const signal = this.generateSignal(day);

      if (signal.shouldTrade) {
        // Simulate trade
        const trade = this.simulateTrade(day, signal);
        this.trades.push(trade);

        // Update portfolio
        portfolioValue += trade.realizedP_L;
        dailyValues.push(portfolioValue);

        console.log(
          `📅 ${day.date} | Entry: ₹${signal.entryPrice} | Exit: ₹${trade.exitPrice} | P&L: ₹${trade.realizedP_L.toFixed(2)}`
        );
      }
    }

    // Calculate statistics
    this.calculateStatistics(dailyValues);
    this.generateReport();
  }

  /**
   * Generate Entry Signal
   */
  generateSignal(dayData) {
    const volatility = dayData.volatility || 18;
    const niftySpot = dayData.spot || 24500;

    // Check volatility threshold
    if (volatility < this.config.strategy.entry.volatilityThreshold) {
      return { shouldTrade: false };
    }

    // Simple entry logic for backtest
    const premium = 150 + Math.random() * 100; // Premium between 150-250

    return {
      shouldTrade: true,
      entryPrice: premium,
      volatility: volatility,
      niftySpot: niftySpot,
    };
  }

  /**
   * Simulate Single Trade
   */
  simulateTrade(dayData, signal) {
    const maxLoss = this.config.riskManagement.maxLossPerTrade;
    const profitTarget = (signal.entryPrice * this.config.riskManagement.profitTarget) / 100;

    // Random exit (simplified)
    // In real backtest, you'd use actual price movement
    const exitRandomness = (Math.random() - 0.5) * maxLoss * 2;
    const exitPrice = signal.entryPrice + exitRandomness;

    // Apply profit target and stop loss
    let finalExitPrice = exitPrice;
    let exitReason = 'MARKET';

    if (exitPrice >= signal.entryPrice + profitTarget) {
      finalExitPrice = signal.entryPrice + profitTarget;
      exitReason = 'PROFIT_TARGET';
    } else if (exitPrice <= signal.entryPrice - maxLoss) {
      finalExitPrice = signal.entryPrice - maxLoss;
      exitReason = 'STOP_LOSS';
    }

    const realizedP_L = (finalExitPrice - signal.entryPrice) * 100; // Assuming 1 lot

    return {
      date: dayData.date,
      entryPrice: signal.entryPrice,
      exitPrice: finalExitPrice,
      realizedP_L: realizedP_L,
      exitReason: exitReason,
      volatility: signal.volatility,
    };
  }

  /**
   * Calculate Performance Statistics
   */
  calculateStatistics(portfolioValues) {
    // Basic Stats
    this.results.totalTrades = this.trades.length;
    this.results.winningTrades = this.trades.filter(t => t.realizedP_L > 0).length;
    this.results.losingTrades = this.trades.filter(t => t.realizedP_L < 0).length;
    this.results.totalProfit = this.trades
      .filter(t => t.realizedP_L > 0)
      .reduce((sum, t) => sum + t.realizedP_L, 0);
    this.results.totalLoss = this.trades
      .filter(t => t.realizedP_L < 0)
      .reduce((sum, t) => sum + t.realizedP_L, 0);

    // Net P&L
    this.results.netP_L = this.results.totalProfit + this.results.totalLoss;

    // Win Rate
    this.results.winRate =
      this.results.totalTrades > 0
        ? ((this.results.winningTrades / this.results.totalTrades) * 100).toFixed(2)
        : 0;

    // Average Win/Loss
    this.results.avgWin =
      this.results.winningTrades > 0
        ? (this.results.totalProfit / this.results.winningTrades).toFixed(2)
        : 0;

    this.results.avgLoss =
      this.results.losingTrades > 0
        ? (this.results.totalLoss / this.results.losingTrades).toFixed(2)
        : 0;

    // Profit Factor
    this.results.profitFactor =
      Math.abs(this.results.totalLoss) > 0
        ? (this.results.totalProfit / Math.abs(this.results.totalLoss)).toFixed(2)
        : 0;

    // Max Drawdown
    this.results.maxDrawdown = this.calculateMaxDrawdown(portfolioValues);

    // Sharpe Ratio (simplified)
    this.results.sharpeRatio = this.calculateSharpeRatio(this.trades);
  }

  /**
   * Calculate Max Drawdown
   */
  calculateMaxDrawdown(values) {
    let maxDrawdown = 0;
    let peak = values[0];

    for (const value of values) {
      if (value > peak) peak = value;
      const drawdown = ((peak - value) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    return maxDrawdown.toFixed(2);
  }

  /**
   * Calculate Sharpe Ratio
   */
  calculateSharpeRatio(trades) {
    if (trades.length === 0) return 0;

    const returns = trades.map(t => t.realizedP_L);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    const riskFreeRate = 0.05 / 252; // Annual 5% divided by 252 trading days
    const sharpeRatio =
      stdDev === 0
        ? 0
        : ((avgReturn - riskFreeRate) / stdDev).toFixed(2);

    return sharpeRatio;
  }

  /**
   * Generate Report
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📈 BACKTEST RESULTS');
    console.log('='.repeat(70) + '\n');

    console.log('📊 SUMMARY STATISTICS');
    console.log('-'.repeat(70));
    console.log(`Total Trades:        ${this.results.totalTrades}`);
    console.log(`Winning Trades:      ${this.results.winningTrades}`);
    console.log(`Losing Trades:       ${this.results.losingTrades}`);
    console.log(`Win Rate:            ${this.results.winRate}%`);
    console.log('');

    console.log('💰 PROFITABILITY');
    console.log('-'.repeat(70));
    console.log(`Total Profit:        ₹${this.results.totalProfit.toFixed(2)}`);
    console.log(`Total Loss:          ₹${this.results.totalLoss.toFixed(2)}`);
    console.log(`Net P&L:             ₹${this.results.netP_L.toFixed(2)}`);
    console.log(`Average Win:         ₹${this.results.avgWin}`);
    console.log(`Average Loss:        ₹${this.results.avgLoss}`);
    console.log('');

    console.log('📊 RISK METRICS');
    console.log('-'.repeat(70));
    console.log(`Profit Factor:       ${this.results.profitFactor}`);
    console.log(`Max Drawdown:        ${this.results.maxDrawdown}%`);
    console.log(`Sharpe Ratio:        ${this.results.sharpeRatio}`);
    console.log('');

    console.log('⚡ PERFORMANCE GRADE');
    console.log('-'.repeat(70));
    this.gradePerformance();

    console.log('\n' + '='.repeat(70));
  }

  /**
   * Grade Performance
   */
  gradePerformance() {
    const winRate = parseFloat(this.results.winRate);
    const profitFactor = parseFloat(this.results.profitFactor);
    const sharpeRatio = parseFloat(this.results.sharpeRatio);

    let grade = 'F';
    let verdict = '';

    if (this.results.totalTrades === 0) {
      console.log('⚠️ No trades executed in backtest');
      return;
    }

    if (this.results.netP_L > 0 && winRate >= 50 && profitFactor > 1) {
      grade = 'A';
      verdict = '🌟 Excellent - Ready for paper trading';
    } else if (this.results.netP_L > 0 && winRate >= 45) {
      grade = 'B';
      verdict = '✅ Good - Can consider paper trading';
    } else if (this.results.netP_L >= 0 && winRate >= 40) {
      grade = 'C';
      verdict = '⚠️ Neutral - More testing needed';
    } else if (this.results.netP_L < 0 || winRate < 40) {
      grade = 'D-F';
      verdict = '❌ Poor - Needs optimization';
    }

    console.log(`Grade: ${grade}`);
    console.log(verdict);
  }

  /**
   * Export Results to CSV
   */
  exportToCSV(filename = 'backtest_results.csv') {
    let csv = 'Date,Entry Price,Exit Price,P&L,Exit Reason,Volatility\n';

    this.trades.forEach(trade => {
      csv += `${trade.date},${trade.entryPrice.toFixed(2)},${trade.exitPrice.toFixed(2)},${trade.realizedP_L.toFixed(2)},${trade.exitReason},${trade.volatility.toFixed(2)}\n`;
    });

    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filename, csv);
    console.log(`\n📁 Results exported to: ${filename}`);
  }
}

/**
 * Generate Sample Historical Data for Testing
 */
function generateSampleHistoricalData(days = 30) {
  const data = [];
  let spot = 24500;
  let volatility = 15;

  for (let i = 0; i < days; i++) {
    const date = moment()
      .subtract(days - i, 'days')
      .format('YYYY-MM-DD');

    // Random walk for NIFTY
    spot += (Math.random() - 0.5) * 200;

    // Random volatility
    volatility = Math.max(10, Math.min(30, volatility + (Math.random() - 0.5) * 2));

    data.push({
      date: date,
      spot: spot,
      volatility: volatility,
    });
  }

  return data;
}

/**
 * Run Backtest Example
 */
async function main() {
  const backtester = new BacktestEngine(config);

  // Generate sample data (in production, load real historical data)
  const historicalData = generateSampleHistoricalData(60);

  // Run backtest
  await backtester.runBacktest(historicalData);

  // Export results
  backtester.exportToCSV('./exports/backtest_results.csv');
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export default BacktestEngine;
