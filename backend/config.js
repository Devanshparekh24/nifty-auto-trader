import dotenv from 'dotenv';
dotenv.config();

export default {
  // Angel Broking Credentials
  broker: {
    apiKey: process.env.ANGEL_API_KEY,
    clientId: process.env.ANGEL_CLIENT_ID,
    password: process.env.ANGEL_PASSWORD,
    baseUrl: 'https://smartapi.angelbroking.com',
  },

  // Strategy Parameters
  strategy: {
    name: 'Iron Condor',
    type: 'options',
    underlyingSymbol: 'NIFTY50',
    strikeInterval: parseInt(process.env.NIFTY_STRIKE_INTERVAL) || 100,
    expiryType: process.env.OPTIONS_EXPIRY || 'WEEKLY', // WEEKLY or MONTHLY
    
    // Entry Rules
    entry: {
      minIVPercentile: 50, // Sell when IV is high
      minPremium: 100,     // Minimum premium to collect
      volatilityThreshold: 20, // VIX > 20 preferred for selling
    },

    // Position Parameters
    position: {
      callSpreadWidth: 200,    // Buy 200 points further OTM call
      putSpreadWidth: 200,     // Buy 200 points further OTM put
      premiumTarget: 0.25,     // Target premium as % of spread
    },
  },

  // Risk Management - CRITICAL
  riskManagement: {
    maxLossPerTrade: parseInt(process.env.MAX_LOSS_PER_TRADE) || 2000,
    profitTarget: parseInt(process.env.PROFIT_TARGET_PERCENT) || 20, // % of max profit
    
    // Position Management
    maxPositions: parseInt(process.env.MAX_POSITIONS) || 3,
    maxDailyLoss: parseInt(process.env.MAX_DAILY_LOSS) || 10000,
    maxDailyProfit: parseInt(process.env.MAX_DAILY_PROFIT) || 50000,
    
    // Exit Rules
    maxLossPercent: 100,  // Close at 100% of max loss
    profitTargetPercent: 50, // Close at 50% of max profit reached
    timeBasedExit: {
      closeBeforeExpiry: true,
      minutesBeforeExpiry: 15, // Close 15 mins before expiry
    },
  },

  // Greeks Monitoring
  greeks: {
    maxDeltaExposure: 0.3,    // Max 30% delta exposure
    thetaDecayMin: 0.5,       // Minimum theta decay per day
    vegaExposure: 0.1,        // Max vega exposure
  },

  // Trade Logging
  logging: {
    dbPath: './database/trades.db',
    logFile: './logs/trades.log',
    csvExport: './exports/trades.csv',
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: 'localhost',
  },

  // Timing
  market: {
    openTime: '09:15',
    closeTime: '15:30',
    timezone: 'Asia/Kolkata',
  },

  // Notifications
  notifications: {
    telegram: {
      enabled: false,
      chatId: process.env.TELEGRAM_CHAT_ID,
      botToken: process.env.TELEGRAM_BOT_TOKEN,
    },
    email: {
      enabled: false,
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
    },
  },

  // Paper Trading Mode
  paperTrading: {
    enabled: process.env.PAPER_TRADING === 'true',
    initialCapital: parseInt(process.env.INITIAL_CAPITAL) || 100000,
  },
};
