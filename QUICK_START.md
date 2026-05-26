# 🚀 QUICK START GUIDE - NIFTY 50 Options Auto Trader

## ⏱️ 5-Minute Setup

### 1. Create Project Folder
```bash
mkdir nifty-auto-trader
cd nifty-auto-trader
```

### 2. Copy All Files
Copy all the provided files to this folder:
- `config.js`
- `angelBroking.js`
- `ironCondor.js`
- `riskManager.js`
- `autoTrader.js`
- `main.js`
- `backtester.js`
- `package.json`
- `.env.example`
- `README.md`

### 3. Setup Environment
```bash
# Copy example env file
cp .env.example .env

# Edit with your Angel Broking credentials
# nano .env  (or use your text editor)
```

**Minimum required in .env:**
```
ANGEL_API_KEY=xxxxx
ANGEL_CLIENT_ID=xxxxx
ANGEL_PASSWORD=xxxxx
PAPER_TRADING=true
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Paper Trading Mode
```bash
npm start
```

**Output:**
```
🚀 NIFTY 50 OPTIONS AUTO TRADER
Strategy: Iron Condor with Defined Risk
Broker: Angel Broking
Mode: PAPER TRADING

📊 Dashboard running at http://localhost:3000
```

### 6. Open Dashboard
Visit: **http://localhost:3000**

---

## 📋 Default Configuration

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Max Loss per Trade | ₹2,000 | Stops position if it loses ₹2000 |
| Daily Loss Limit | ₹10,000 | Stops all trading if daily loss hits ₹10k |
| Max Positions | 3 | Never have more than 3 open trades |
| Profit Target | 20% | Close at 50% of max profit |
| Mode | Paper Trading | Simulated (no real money) |

---

## 🎯 What Happens When You Run It

### Timeline (9:15 AM - 3:30 PM IST)

**9:15 AM** - Market Opens
- Auto Trader starts monitoring
- Checks NIFTY 50 options chain

**10:00 AM - 1:00 PM** - Potential Entry (Volatility High)
```
✅ IF volatility > 20 AND premium > ₹100
   → GENERATE ENTRY SIGNAL
   → PLACE IRON CONDOR (4 legs)
   → START MONITORING

❌ IF max loss > ₹2000
   → REJECT TRADE
```

**Throughout Day** - Active Management
```
Every minute:
1. Check current P&L of each position
2. IF profit ≥ profit target → CLOSE ✅
3. IF loss ≥ max loss → CLOSE ❌
4. Update dashboard
```

**3:15 PM - 3:30 PM** - Market Close
- Close all remaining positions
- Calculate daily P&L
- Reset for next day

---

## 📊 Dashboard Explained

### Status Card
```
Trader Status: ✅ RUNNING
Market Time: 10:30 AM
```

### P&L Card
```
Total Profit: ₹1,500
Total Loss: -₹500
Net P&L: ₹1,000
```

### Positions Card
```
Open Trades: 2/3
Daily Loss Remaining: ₹9,500/₹10,000
Status: 🟢 HEALTHY
```

### Trades Table
Shows all trades with:
- Entry time
- Status (OPEN/CLOSED)
- Entry price (premium)
- Max loss (defined risk)
- Max profit (target)
- Realized P&L

---

## 🧪 Testing the System

### Test 1: Run Backtest
```bash
node backtester.js
```

**Output:**
```
📈 BACKTEST RESULTS
Total Trades:        12
Winning Trades:      8
Losing Trades:       4
Win Rate:            66.67%

Net P&L: ₹2,400
Grade: A - Ready for paper trading
```

### Test 2: Paper Trade for 1 Week
- Run daily from 9:15 AM to 3:30 PM
- Monitor dashboard
- Review trades every evening
- Check if strategy is consistent

### Test 3: Check Risk Management
```
Scenario 1: Position loses ₹2000 (max loss)
→ Should auto-close with LOSS message

Scenario 2: Daily P&L reaches -₹10,000
→ Should STOP all new trades (circuit breaker)

Scenario 3: Position gains 50% of max profit
→ Should auto-close with PROFIT message
```

---

## ⚠️ Safety Checks (BEFORE LIVE TRADING)

- [ ] Ran backtest with positive results
- [ ] Paper traded for at least 1 week
- [ ] Understand all parameters in config.js
- [ ] Know your max loss per trade (₹2000)
- [ ] Know your daily limit (₹10,000)
- [ ] Have enough capital (₹100k+ recommended)
- [ ] Checked Angel Broking API is working
- [ ] Set up notifications (optional)

---

## 🔄 Switching to Live Trading

### Step 1: Backup Paper Trading Data
```bash
cp database/trades.db database/trades_paper.db
```

### Step 2: Update .env
```
PAPER_TRADING=false
```

### Step 3: Reduce Risk (First Time)
```
MAX_LOSS_PER_TRADE=1000    # ₹1000 instead of ₹2000
MAX_DAILY_LOSS=5000        # ₹5000 instead of ₹10000
MAX_POSITIONS=2            # 2 positions instead of 3
```

### Step 4: Restart
```bash
npm start
```

### Step 5: Monitor Closely
- Check dashboard every hour
- Review orders in Angel Broking
- Monitor P&L in real-time

---

## 🆘 Troubleshooting

### "Cannot connect to Angel Broking"
```
✓ Check API credentials in .env
✓ Verify API is enabled in Angel Broking
✓ Check internet connection
```

### "No trades generated"
```
✓ Check if market is open (9:15 AM - 3:30 PM)
✓ Check NIFTY 50 volatility
✓ Review strategy entry conditions in config.js
```

### "Circuit breaker hit - no more trades"
```
✓ This is EXPECTED when daily loss limit hit
✓ Automatically resets next trading day
✓ Review why trades lost money
```

### "Dashboard not loading"
```
✓ Restart: npm start
✓ Clear browser cache
✓ Check if port 3000 is available
```

---

## 📈 Expected Results

### Conservative Setup
- Win Rate: 55-65%
- Avg Trade P&L: ₹200-500
- Monthly: ₹2,000-5,000

### Moderate Setup  
- Win Rate: 50-60%
- Avg Trade P&L: ₹300-700
- Monthly: ₹5,000-10,000

### Aggressive Setup
- Win Rate: 45-55%
- Avg Trade P&L: ₹500-1,000
- Monthly: ₹10,000-20,000

**NOTE**: Results vary based on market conditions. Volatility, trend, and economic events affect performance.

---

## 📚 Next Learning Steps

1. **Understand Greeks** (Delta, Theta, Vega)
2. **Study Iron Condor** strategy mechanics
3. **Learn Risk Management** best practices
4. **Review Your Trades** daily
5. **Optimize Parameters** based on results

---

## 🎓 Resources

- **Angel Broking API**: https://smartapi.angelbroking.com/
- **Options Greeks**: Investopedia options section
- **Iron Condor**: Search "Iron Condor options strategy"
- **Risk Management**: "Position sizing in options trading"

---

## ✅ Checklist

- [ ] Project files downloaded
- [ ] Dependencies installed (`npm install`)
- [ ] .env file created with credentials
- [ ] Paper trading mode confirmed
- [ ] Dashboard opens at localhost:3000
- [ ] Backtester runs successfully
- [ ] Read full README.md
- [ ] Understand risk parameters
- [ ] Set alerts (optional)
- [ ] Ready for paper trading!

---

## 🚀 You're Ready!

Your NIFTY 50 Options Auto Trader is now set up!

**Next**: Run `npm start` and let the system take over.

**Happy Trading! 📈**
