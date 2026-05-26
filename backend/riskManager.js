const moment = require('moment');

class RiskManager {
  constructor(config) {
    this.config = config.riskManagement;
    this.greeks = config.greeks;
    this.dailyStats = {
      trades: [],
      totalProfit: 0,
      totalLoss: 0,
      realizedP_L: 0,
      maxPositions: 0,
    };
    this.resetDailyStats();
  }

  /**
   * Reset Daily Statistics (called at market open)
   */
  resetDailyStats() {
    this.dailyStats = {
      trades: [],
      totalProfit: 0,
      totalLoss: 0,
      realizedP_L: 0,
      maxPositions: 0,
      resetTime: moment().format('YYYY-MM-DD HH:mm:ss'),
    };
  }

  /**
   * Calculate Max Loss for Iron Condor Trade
   * Max Loss = Width of wider spread - Net Premium Received
   */
  calculateMaxLoss(callSpread, putSpread, netPremiumReceived) {
    const callMaxLoss = callSpread.width - netPremiumReceived * 0.5;
    const putMaxLoss = putSpread.width - netPremiumReceived * 0.5;
    const totalMaxLoss = Math.max(callMaxLoss, putMaxLoss);

    return {
      callMaxLoss: callMaxLoss,
      putMaxLoss: putMaxLoss,
      totalMaxLoss: totalMaxLoss,
      netPremiumReceived: netPremiumReceived,
    };
  }

  /**
   * Validate if Trade can be Executed
   */
  canExecuteTrade(tradeSetup) {
    const checks = {
      maxLossCheck: true,
      maxPositionCheck: true,
      dailyLossCheck: true,
      greeksCheck: true,
      validateReasons: [],
    };

    // Check 1: Max Loss per Trade
    if (tradeSetup.maxLoss > this.config.maxLossPerTrade) {
      checks.maxLossCheck = false;
      checks.validateReasons.push(
        `❌ Max Loss ₹${tradeSetup.maxLoss} exceeds limit ₹${this.config.maxLossPerTrade}`
      );
    }

    // Check 2: Max Positions
    if (this.dailyStats.currentPositions >= this.config.maxPositions) {
      checks.maxPositionCheck = false;
      checks.validateReasons.push(
        `❌ Max positions (${this.config.maxPositions}) already reached`
      );
    }

    // Check 3: Daily Loss Limit
    const dailyLoss = Math.abs(this.dailyStats.totalLoss);
    if (dailyLoss >= this.config.maxDailyLoss) {
      checks.dailyLossCheck = false;
      checks.validateReasons.push(
        `❌ Daily loss limit ₹${this.config.maxDailyLoss} reached`
      );
    }

    // Check 4: Greeks Exposure
    if (Math.abs(tradeSetup.deltaExposure) > this.greeks.maxDeltaExposure) {
      checks.greeksCheck = false;
      checks.validateReasons.push(
        `⚠️ Delta exposure ${tradeSetup.deltaExposure} exceeds limit`
      );
    }

    const canTrade =
      checks.maxLossCheck &&
      checks.maxPositionCheck &&
      checks.dailyLossCheck &&
      checks.greeksCheck;

    return {
      ...checks,
      canTrade: canTrade,
    };
  }

  /**
   * Calculate Position Exit Levels
   */
  calculateExitLevels(maxProfit, maxLoss, entryPrice) {
    const profitTarget = (maxProfit * this.config.profitTargetPercent) / 100;
    const lossStopLevel = (maxLoss * this.config.maxLossPercent) / 100;

    return {
      profitTarget: profitTarget,
      profitTargetPercent: this.config.profitTargetPercent,
      maxLoss: maxLoss,
      stopLossLevel: lossStopLevel,
      breakeven: entryPrice,
      riskRewardRatio: profitTarget / lossStopLevel,
    };
  }

  /**
   * Monitor Active Position
   */
  monitorPosition(position) {
    const unrealizedP_L = position.currentPrice - position.entryPrice;
    const unrealizedP_LPercent = (unrealizedP_L / position.entryPrice) * 100;

    const signals = {
      shouldExit: false,
      exitReason: null,
      closePercent: 0,
    };

    // Check if profit target reached
    if (unrealizedP_L >= position.exitLevels.profitTarget) {
      signals.shouldExit = true;
      signals.exitReason = `✅ PROFIT TARGET REACHED: ₹${unrealizedP_L.toFixed(2)}`;
      signals.closePercent = 100;
    }

    // Check if stop loss hit
    if (unrealizedP_L <= -position.exitLevels.maxLoss) {
      signals.shouldExit = true;
      signals.exitReason = `❌ STOP LOSS HIT: ₹${unrealizedP_L.toFixed(2)}`;
      signals.closePercent = 100;
    }

    // Time-based exit (before expiry)
    const timeToExpiry = moment(position.expiryTime).diff(moment(), 'minutes');
    if (timeToExpiry <= 15) {
      signals.shouldExit = true;
      signals.exitReason = `⏰ EXPIRY APPROACHING: ${timeToExpiry} minutes left`;
      signals.closePercent = 100;
    }

    return signals;
  }

  /**
   * Log Trade Execution
   */
  logTrade(trade) {
    this.dailyStats.trades.push({
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      ...trade,
    });

    if (trade.type === 'ENTRY') {
      this.dailyStats.currentPositions = 
        (this.dailyStats.currentPositions || 0) + 1;
    } else if (trade.type === 'EXIT') {
      const profitLoss = trade.exitPrice - trade.entryPrice;
      if (profitLoss > 0) {
        this.dailyStats.totalProfit += profitLoss;
      } else {
        this.dailyStats.totalLoss += profitLoss;
      }
      this.dailyStats.realizedP_L = 
        this.dailyStats.totalProfit + this.dailyStats.totalLoss;
      this.dailyStats.currentPositions = 
        Math.max(0, (this.dailyStats.currentPositions || 1) - 1);
    }
  }

  /**
   * Get Daily Summary
   */
  getDailySummary() {
    return {
      date: moment().format('YYYY-MM-DD'),
      totalTrades: this.dailyStats.trades.length,
      winningTrades: this.dailyStats.totalProfit > 0 ? 1 : 0,
      losingTrades: this.dailyStats.totalLoss < 0 ? 1 : 0,
      totalProfit: this.dailyStats.totalProfit.toFixed(2),
      totalLoss: this.dailyStats.totalLoss.toFixed(2),
      netP_L: this.dailyStats.realizedP_L.toFixed(2),
      currentOpenPositions: this.dailyStats.currentPositions || 0,
      maxDailyLossRemaining: 
        (this.config.maxDailyLoss - Math.abs(this.dailyStats.totalLoss)).toFixed(2),
      healthStatus: this.getHealthStatus(),
    };
  }

  /**
   * Get Trading Health Status
   */
  getHealthStatus() {
    const dailyLoss = Math.abs(this.dailyStats.totalLoss);
    const lossPercent = (dailyLoss / this.config.maxDailyLoss) * 100;

    if (lossPercent >= 100) return '🔴 STOP TRADING - Loss Limit Hit';
    if (lossPercent >= 75) return '🟠 CAUTION - 75% of loss limit';
    if (lossPercent >= 50) return '🟡 WARNING - 50% of loss limit';
    if (lossPercent >= 25) return '🟢 HEALTHY - 25% of loss limit';
    return '✅ EXCELLENT - No losses yet';
  }

  /**
   * Circuit Breaker - Stop all trading
   */
  isCircuitBreakerHit() {
    const dailyLoss = Math.abs(this.dailyStats.totalLoss);
    return dailyLoss >= this.config.maxDailyLoss;
  }

  /**
   * Validate Greeks
   */
  validateGreeks(greeksData) {
    const issues = [];

    if (Math.abs(greeksData.delta) > this.greeks.maxDeltaExposure) {
      issues.push(`Delta ${greeksData.delta} exceeds max ${this.greeks.maxDeltaExposure}`);
    }

    if (greeksData.theta < this.greeks.thetaDecayMin) {
      issues.push(`Theta ${greeksData.theta} below minimum ${this.greeks.thetaDecayMin}`);
    }

    return {
      valid: issues.length === 0,
      issues: issues,
    };
  }
}

module.exports = RiskManager;
