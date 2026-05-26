# 🤖 NIFTY 50 Options Auto Trader - Zero Loss Strategy

An automated options trading system for NIFTY 50 using **Iron Condor** strategy with strict risk management and defined maximum loss.

---

## 📊 Strategy Overview

### Iron Condor Strategy
- **Sell** 1 OTM Call + **Buy** 1 Further OTM Call (Call Spread)
- **Sell** 1 OTM Put + **Buy** 1 Further OTM Put (Put Spread)
- **Max Loss**: Width of spread - Net Premium Received (DEFINED & PREDETERMINED)
- **Max Profit**: Net Premium Collected × 100 (per lot)

### Zero Loss Risk Management
✅ **Every trade has a predetermined max loss**
✅ **Automatic stop-loss execution** when max loss is reached
✅ **Daily loss limit circuit breaker** - stops all trades if breached
✅ **Position limits** - never over-leverage
✅ **Greeks monitoring** - keep delta/theta/vega in check

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 14+ and npm
- Angel Broking Account with API enabled
- ₹100,000+ capital (recommended)

### Step 1: Clone/Download Project
```bash
git clone <repo-url>
cd nifty-auto-trader
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
```bash
# Copy example to create .env
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Required in .env:**
```
ANGEL_API_KEY=your_api_key
ANGEL_CLIENT_ID=your_client_id
ANGEL_PASSWORD=your_password
```

### Step 4: Run in Paper Trading Mode (FIRST!)
```bash
# Ensure PAPER_TRADING=true in .env
npm start
```

Visit: **http://localhost:3000** to view dashboard

### Step 5: Verify & Monitor (1-2 weeks)
- Monitor trades on dashboard
- Check profit/loss consistency
- Verify risk management rules are working

### Step 6: Switch to Live Trading (When Ready)
```
Change PAPER_TRADING=false in .env
npm start
```

---

## ⚙️ Configuration Guide

### config.js - Key Parameters

#### Risk Management (MOST IMPORTANT)
```javascript
maxLossPerTrade: 2000,         // ❌ Max loss per trade (₹)
maxDailyLoss: 10000,           // ❌ Max loss in a day (₹)
maxPositions: 3,               // Max open trades at once
profitTarget: 20,              // Close at 20% of max profit
```

#### Strategy Entry Conditions
```javascript
minIVPercentile: 50,           // Sell when IV is high
minPremium: 100,               // Min premium to collect
volatilityThreshold: 20,       // Min VIX for selling
```

#### Position Parameters
```javascript
callSpreadWidth: 200,          // Buy call 200 pts OTM
putSpreadWidth: 200,           // Buy put 200 pts OTM
```

**⚠️ IMPORTANT**: These parameters directly affect your max loss. If you change them, recalculate max loss!

---

## 📈 How It Works - Step by Step

### 1️⃣ Entry Phase (9:15 AM - 1:00 PM)
- Monitors NIFTY 50 volatility and options chain
- When conditions match (IV high, premium good):
  - Analyzes options chain
  - Selects OTM strikes
  - Calculates max loss
  - Validates risk parameters
  - Places 4-leg order (if all checks pass)

### 2️⃣ Management Phase (Throughout Day)
- **Real-time P&L monitoring** of each position
- **Automatic exits** when:
  - ✅ Profit target (50% of max profit)
  - ❌ Stop loss (100% of max loss)
  - ⏰ 15 mins before expiry
  - 🛑 Daily loss limit hit

### 3️⃣ Exit Phase (3:15 PM)
- Closes all remaining positions
- Calculates daily P&L
- Logs all trades to database

---

## 📊 Dashboard Monitoring

**URL**: http://localhost:3000

### Metrics Displayed
- **Trader Status**: RUNNING / STOPPED
- **Today's P&L**: Profit, Loss, Net
- **Active Positions**: Open trades, max positions
- **Recent Trades**: Table with entry/exit details

### Auto-Refresh
Dashboard updates every 30 seconds automatically.

---

## 📝 Trade Logging & Analysis

All trades are logged in SQLite database:
- **Location**: `./database/trades.db`
- **Tables**: trades, orders, daily_summary

### Query Examples
```javascript
// Get all trades
SELECT * FROM trades;

// Get daily P&L
SELECT date, netP_L FROM daily_summary;

// Get winning trades
SELECT * FROM trades WHERE realizedP_L > 0;

// Get losing trades  
SELECT * FROM trades WHERE realizedP_L < 0;
```

---

## 🚨 Safety Features

### 1. Circuit Breaker (MANDATORY)
If daily loss ≥ ₹10,000 → All trading stops ⛔
```
This is AUTOMATIC and CANNOT be disabled
```

### 2. Max Loss Enforcement
Every position has predetermined max loss:
```
If unrealized loss ≥ max loss → AUTO CLOSE ❌
```

### 3. Position Limits
```
Max 3 positions at once (configurable)
Prevents over-leverage
```

### 4. Greeks Monitoring
```
Delta > 30% → REJECT trade 🚫
Keeps portfolio delta-neutral
```

### 5. Expiry Protection
```
Auto-close 15 mins before expiry ⏰
Avoids gamma bleed
```

---

## 📊 Trade Examples

### Successful Trade 📈
```
Entry: Iron Condor
  Sell 24500 Call @ ₹100 + Sell 24500 Put @ ₹120
  Buy  24700 Call @ ₹50  + Buy  24300 Put @ ₹60
  
Net Premium Received: ₹100 + ₹120 - ₹50 - ₹60 = ₹110
Max Loss: ₹90 (₹200 width - ₹110)

Exit at 50% profit: ₹55 gain → Position closed ✅
```

### Stopped-Out Trade 📉
```
Same entry, but NIFTY moves sharply up
At 24700: Call spread max loss hit
Position auto-closed at max loss: -₹90 ❌

But it's defined! We knew max loss upfront.
```

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to Angel Broking"
**Solution**: Check API credentials in .env
```
- Verify API key is active
- Check client ID format
- Confirm password is correct
```

### Issue: "No suitable options found"
**Solution**: Check if market is open
- Trading hours: 9:15 AM - 3:30 PM IST
- Check NIFTY 50 options are available

### Issue: "Daily loss limit hit"
**Solution**: This is expected!
- Circuit breaker activated automatically
- Wait for next trading day
- Review strategy parameters

### Issue: "Paper trading showing strange prices"
**Solution**: Expected behavior
- Mock data used in paper mode
- Prices are simulated only
- Real trades will use live prices

---

## 📚 Learning Resources

### Greeks Understanding
- **Delta**: How much price moves with underlying
- **Theta**: Time decay (works in our favor in short positions)
- **Vega**: Volatility sensitivity

### Iron Condor Benefits
✅ Limited downside (known max loss)
✅ Limited upside (known max profit)
✅ Theta decay works for us
✅ Works in ranging markets

### Iron Condor Risks
⚠️ Large sharp moves can hit loss
⚠️ Requires active monitoring
⚠️ Can't set and forget

---

## 🎯 Performance Targets

### Conservative Setup
- Max Loss: ₹1,500 per trade
- Daily Limit: ₹5,000
- Target: +₹500-1000/day

### Moderate Setup  
- Max Loss: ₹2,000 per trade
- Daily Limit: ₹10,000
- Target: +₹1000-2000/day

### Aggressive Setup
- Max Loss: ₹3,000 per trade
- Daily Limit: ₹15,000
- Target: +₹2000-3000/day

**Remember**: Higher targets = Higher risk!

---

## 💡 Pro Tips

1. **Start Paper Trading First**
   - Run for 1-2 weeks minimum
   - Understand the system behavior
   - Check if it suits your risk appetite

2. **Monitor Daily**
   - Check dashboard during market hours
   - Review closed trades
   - Learn from losses

3. **Adjust Parameters Gradually**
   - Don't change everything at once
   - Test one parameter at a time
   - Document results

4. **Time Selection**
   - Best entries: 10 AM - 1 PM (high volatility)
   - Avoid last hour (gamma risk)

5. **Position Sizing**
   - Start with 1 lot
   - Scale up gradually
   - Match capital to risk tolerance

---

## 📞 Support & Contact

For issues:
1. Check logs: `logs/trades.log`
2. Review database: `database/trades.db`
3. Check Angel Broking API docs: https://smartapi.angelbroking.com/

---

## ⚖️ Legal & Disclaimer

⚠️ **IMPORTANT**: This is an automated trading system. 
- Options trading involves substantial risk
- You can lose your entire capital
- Past performance ≠ future results
- Test thoroughly before live trading
- Only use capital you can afford to lose

**Use at your own risk and responsibility!**

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🚀 Next Steps

1. ✅ Install dependencies
2. ✅ Configure .env file
3. ✅ Run in paper trading mode
4. ✅ Monitor dashboard
5. ✅ Test for 1-2 weeks
6. ✅ Switch to live trading (optional)
7. ✅ Monitor daily P&L
8. ✅ Review and optimize

**Happy Trading! 🎯**
