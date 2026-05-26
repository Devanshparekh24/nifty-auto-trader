# NIFTY 50 Options Auto Trader - Zero Loss Strategy
## Angel Broking Integration with Node.js

### Project Structure
```
nifty-auto-trader/
├── config/
│   └── config.js                 # API keys and settings
├── broker/
│   └── angelBroking.js          # Angel Broking API wrapper
├── strategies/
│   └── ironCondor.js            # Iron Condor strategy
├── core/
│   ├── trader.js                # Main trader engine
│   ├── riskManager.js           # Position sizing & risk control
│   └── optionsChain.js          # Options data handler
├── utils/
│   ├── logger.js                # Trade logging
│   └── alerts.js                # Notifications
├── dashboard/
│   └── server.js                # Web dashboard
├── database/
│   └── trades.db                # SQLite database
├── backtester/
│   └── backtest.js              # Historical testing
└── main.js                       # Entry point
```

### Installation

```bash
# Create project directory
mkdir nifty-auto-trader
cd nifty-auto-trader

# Initialize Node.js project
npm init -y

# Install dependencies
npm install angel-broking-api axios sqlite3 express dotenv moment technicalindicators

# Create directories
mkdir config broker strategies core utils dashboard database backtester
```

### Setup Steps

1. **Get Angel Broking API Credentials**
   - Visit: https://www.angelbroking.com/
   - Sign up and enable API access
   - Get: API Key, Client ID, and Password

2. **Create .env file**
```
ANGEL_API_KEY=your_api_key
ANGEL_CLIENT_ID=your_client_id
ANGEL_PASSWORD=your_password

# Strategy Parameters
MAX_LOSS_PER_TRADE=2000
POSITION_SIZE=5000
NIFTY_STRIKE_INTERVAL=100
OPTIONS_EXPIRY=WEEKLY  # WEEKLY or MONTHLY

# Risk Management
MAX_POSITIONS=3
MAX_DAILY_LOSS=10000
PROFIT_TARGET_PERCENT=20

# Server
PORT=3000
```

3. **Strategy: Iron Condor with Defined Risk**
   - Sell OTM Call + Buy Further OTM Call
   - Sell OTM Put + Buy Further OTM Put
   - Max Loss = Debit Spread Width - Net Premium Received
   - Exit Rules:
     * Close when 50% max profit reached
     * Close if loss reaches max loss threshold
     * Exit at expiry with remaining position

### Key Features

✅ **Real-time Options Chain** - Fetch live data
✅ **Automatic Entry Signals** - Based on volatility & Greeks
✅ **Risk-Defined Positions** - Max loss predetermined
✅ **Trade Management** - Auto stop-loss & profit target
✅ **Portfolio Tracking** - Current P&L, Greeks exposure
✅ **Trade Logging** - CSV export for analysis
✅ **Web Dashboard** - Monitor positions in real-time
✅ **Backtesting** - Test strategy on historical data

### Important Safety Features

⚠️ **ALWAYS ENABLED:**
- Max loss per trade enforcement
- Daily loss limit circuit breaker
- Maximum positions limit (no over-leverage)
- Order validation before execution
- Real-time monitoring of Greeks (Delta, Theta, Vega)
- Automatic position closure on max loss

### Risk Management Rules

```
Scenario 1: Trade reaches max loss → AUTO CLOSE ❌
Scenario 2: Daily loss limit hit → STOP all new entries 🛑
Scenario 3: 50% max profit → CLOSE position ✅
Scenario 4: Expiry time → CLOSE all positions ⏰
```

### Next Steps

1. Copy the provided code files
2. Configure .env with your credentials
3. Run backtester first to validate strategy
4. Start with PAPER TRADING
5. Monitor dashboard for 1-2 weeks
6. Only move to LIVE trading after validation

### Support & Documentation

- Angel Broking API: https://smartapi.angelbroking.com/
- Greeks Explanation: Study Delta, Gamma, Theta
- Risk Management: Never risk more than 2% of capital per trade
