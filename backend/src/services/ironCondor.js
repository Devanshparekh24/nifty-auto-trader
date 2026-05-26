import moment from 'moment';

class IronCondorStrategy {
  constructor(config, riskManager) {
    this.config = config;
    this.riskManager = riskManager;
    this.strategyConfig = config.strategy;
    this.activePositions = [];
  }

  /**
   * Analyze Options Chain and Generate Signals
   */
  analyzeOptionsChain(optionsChain, niftySpot, volatility) {
    const signals = {
      entrySignal: false,
      strikeSelection: null,
      setupDetails: null,
      reasons: [],
    };

    // Check Volatility condition
    if (volatility < this.strategyConfig.entry.volatilityThreshold) {
      signals.reasons.push(`❌ Volatility ${volatility} < threshold ${this.strategyConfig.entry.volatilityThreshold}`);
      return signals;
    }

    // Select Call Strike (Sell OTM Call)
    const callStrike = this.findOTMStrike(niftySpot, 'CALL', optionsChain);
    if (!callStrike) {
      signals.reasons.push('❌ No suitable call strike found');
      return signals;
    }

    // Select Put Strike (Sell OTM Put)
    const putStrike = this.findOTMStrike(niftySpot, 'PUT', optionsChain);
    if (!putStrike) {
      signals.reasons.push('❌ No suitable put strike found');
      return signals;
    }

    // Find Long Call (Buy further OTM Call)
    const longCallStrike = this.findStrike(
      callStrike.strike + this.strategyConfig.position.callSpreadWidth,
      optionsChain,
      'CALL'
    );

    // Find Long Put (Buy further OTM Put)
    const longPutStrike = this.findStrike(
      putStrike.strike - this.strategyConfig.position.putSpreadWidth,
      optionsChain,
      'PUT'
    );

    if (!longCallStrike || !longPutStrike) {
      signals.reasons.push('❌ Could not find long strikes for spreads');
      return signals;
    }

    // Calculate Net Premium
    const shortCallPremium = callStrike.ltp || callStrike.lastPrice;
    const shortPutPremium = putStrike.ltp || putStrike.lastPrice;
    const longCallCost = longCallStrike.ltp || longCallStrike.lastPrice;
    const longPutCost = longPutStrike.ltp || longPutStrike.lastPrice;

    const netPremium = (shortCallPremium + shortPutPremium) - (longCallCost + longPutCost);
    
    // Check minimum premium requirement
    if (netPremium < this.strategyConfig.entry.minPremium) {
      signals.reasons.push(
        `❌ Net Premium ₹${netPremium} < minimum ₹${this.strategyConfig.entry.minPremium}`
      );
      return signals;
    }

    // Calculate Max Loss
    const callSpreadWidth = longCallStrike.strike - callStrike.strike;
    const putSpreadWidth = putStrike.strike - longPutStrike.strike;
    
    const maxLoss = this.riskManager.calculateMaxLoss(
      { width: callSpreadWidth },
      { width: putSpreadWidth },
      netPremium
    );

    // Validate Risk Parameters
    const validation = this.riskManager.validateGreeks({
      delta: (callStrike.greeks?.delta || 0.2) - (putStrike.greeks?.delta || -0.2),
      theta: (callStrike.greeks?.theta || 0.02) + (putStrike.greeks?.theta || 0.02),
    });

    if (!validation.valid) {
      signals.reasons.push(`⚠️ Greeks validation failed: ${validation.issues.join(', ')}`);
    }

    // Check if trade can be executed
    const tradeValidation = this.riskManager.canExecuteTrade({
      maxLoss: maxLoss.totalMaxLoss,
      deltaExposure: (callStrike.greeks?.delta || 0.2) - (putStrike.greeks?.delta || -0.2),
    });

    if (!tradeValidation.canTrade) {
      signals.reasons.push(...tradeValidation.validateReasons);
      return signals;
    }

    // All checks passed - Generate Entry Signal
    signals.entrySignal = true;
    signals.strikeSelection = {
      shortCall: callStrike.strike,
      longCall: longCallStrike.strike,
      shortPut: putStrike.strike,
      longPut: longPutStrike.strike,
    };

    signals.setupDetails = {
      spotPrice: niftySpot,
      shortCallPrice: shortCallPremium,
      longCallPrice: longCallCost,
      shortPutPrice: shortPutPremium,
      longPutPrice: longPutCost,
      netPremium: netPremium,
      maxLoss: maxLoss.totalMaxLoss,
      maxProfit: netPremium * 100, // Per lot, adjust as needed
      riskReward: (netPremium * 100) / maxLoss.totalMaxLoss,
      expiryDate: callStrike.expiryDate,
    };

    signals.reasons.push(
      `✅ IRON CONDOR SETUP READY`,
      `   Max Profit: ₹${signals.setupDetails.maxProfit.toFixed(2)}`,
      `   Max Loss: ₹${signals.setupDetails.maxLoss.toFixed(2)}`,
      `   Risk/Reward: ${signals.setupDetails.riskReward.toFixed(2)}`
    );

    return signals;
  }

  /**
   * Find OTM Strike
   */
  findOTMStrike(spotPrice, optionType, optionsChain, distance = 150) {
    const relevantStrikes = optionsChain.filter(option => {
      if (option.optionType !== optionType) return false;
      
      if (optionType === 'CALL') {
        return option.strike > spotPrice && option.strike <= spotPrice + distance;
      } else {
        return option.strike < spotPrice && option.strike >= spotPrice - distance;
      }
    });

    if (relevantStrikes.length === 0) return null;

    // Select the closest OTM strike with good liquidity
    return relevantStrikes.sort((a, b) => {
      const aDist = Math.abs(a.strike - spotPrice);
      const bDist = Math.abs(b.strike - spotPrice);
      return aDist - bDist;
    })[0];
  }

  /**
   * Find Strike by specific value
   */
  findStrike(targetStrike, optionsChain, optionType) {
    return optionsChain.find(
      option => option.strike === targetStrike && option.optionType === optionType
    );
  }

  /**
   * Create Leg Entry Orders
   */
  createOrderLegs(strikeSelection, setupDetails) {
    const orders = [];
    const expiryDate = setupDetails.expiryDate;
    const symbol = this.strategyConfig.underlyingSymbol;

    // Leg 1: Short Call
    orders.push({
      legId: 1,
      type: 'SELL',
      symbol: `${symbol}${expiryDate}${strikeSelection.shortCall}CE`,
      strike: strikeSelection.shortCall,
      optionType: 'CALL',
      quantity: 1,
      price: setupDetails.shortCallPrice,
      description: 'Short Call',
    });

    // Leg 2: Long Call
    orders.push({
      legId: 2,
      type: 'BUY',
      symbol: `${symbol}${expiryDate}${strikeSelection.longCall}CE`,
      strike: strikeSelection.longCall,
      optionType: 'CALL',
      quantity: 1,
      price: setupDetails.longCallPrice,
      description: 'Long Call (Protection)',
    });

    // Leg 3: Short Put
    orders.push({
      legId: 3,
      type: 'SELL',
      symbol: `${symbol}${expiryDate}${strikeSelection.shortPut}PE`,
      strike: strikeSelection.shortPut,
      optionType: 'PUT',
      quantity: 1,
      price: setupDetails.shortPutPrice,
      description: 'Short Put',
    });

    // Leg 4: Long Put
    orders.push({
      legId: 4,
      type: 'BUY',
      symbol: `${symbol}${expiryDate}${strikeSelection.longPut}PE`,
      strike: strikeSelection.longPut,
      optionType: 'PUT',
      quantity: 1,
      price: setupDetails.longPutPrice,
      description: 'Long Put (Protection)',
    });

    return orders;
  }

  /**
   * Track Active Position
   */
  addActivePosition(positionData) {
    const position = {
      positionId: `IC-${moment().format('YYYYMMDDHHmmss')}`,
      entryTime: moment(),
      ...positionData,
    };

    this.activePositions.push(position);
    return position;
  }

  /**
   * Get All Active Positions
   */
  getActivePositions() {
    return this.activePositions;
  }

  /**
   * Close Position
   */
  closePosition(positionId, exitPrice, reason) {
    const position = this.activePositions.find(p => p.positionId === positionId);
    
    if (position) {
      position.exitTime = moment();
      position.exitPrice = exitPrice;
      position.exitReason = reason;
      position.duration = position.exitTime.diff(position.entryTime, 'minutes');
      position.realizedP_L = exitPrice - position.entryPrice;
      
      // Remove from active positions
      this.activePositions = this.activePositions.filter(p => p.positionId !== positionId);
      
      return position;
    }

    return null;
  }

  /**
   * Calculate Position Greeks
   */
  calculatePositionGreeks(legs) {
    let totalDelta = 0;
    let totalTheta = 0;
    let totalVega = 0;

    legs.forEach(leg => {
      const multiplier = leg.type === 'SELL' ? -1 : 1;
      totalDelta += (leg.greeks?.delta || 0) * multiplier;
      totalTheta += (leg.greeks?.theta || 0) * multiplier;
      totalVega += (leg.greeks?.vega || 0) * multiplier;
    });

    return {
      delta: totalDelta,
      theta: totalTheta,
      vega: totalVega,
      netGreeks: `Delta: ${totalDelta.toFixed(3)}, Theta: ${totalTheta.toFixed(3)}, Vega: ${totalVega.toFixed(3)}`,
    };
  }
}

export default IronCondorStrategy;
