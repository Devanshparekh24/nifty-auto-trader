const fs = require('fs');
const path = require('path');

class Database {
  constructor(dbPath) {
    this.dbPath = dbPath.endsWith('.db') ? dbPath.replace('.db', '.json') : dbPath;
    this.data = {
      trades: [],
      orders: [],
      daily_summary: []
    };
    this.load();
  }

  load() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.dbPath)) {
        const fileContent = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Error loading database:', e.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving database:', e.message);
    }
  }

  exec(sql) {
    // Schema creation is handled in-memory
    return this;
  }

  prepare(sql) {
    const self = this;
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    return {
      run(...args) {
        if (cleanSql.includes('INSERT INTO trades')) {
          // INSERT INTO trades (tradeId, entryTime, symbol, strikeSelection, entryPrice, maxLoss, maxProfit, status)
          const [tradeId, entryTime, symbol, strikeSelectionStr, entryPrice, maxLoss, maxProfit, status] = args;
          
          let strikeSelection = {};
          try {
            strikeSelection = JSON.parse(strikeSelectionStr);
          } catch (e) {}

          const newTrade = {
            id: self.data.trades.length + 1,
            tradeId,
            entryTime,
            exitTime: null,
            symbol,
            strikeSelection: strikeSelectionStr,
            entryPrice: parseFloat(entryPrice),
            exitPrice: null,
            maxLoss: parseFloat(maxLoss),
            maxProfit: parseFloat(maxProfit),
            realizedP_L: null,
            status,
            exitReason: null,
            duration: null,
            created_at: new Date().toISOString()
          };
          self.data.trades.push(newTrade);

          // Generate mock orders automatically so they show up in the dashboard
          const expiryDate = '28MAY26'; // Default mock expiry
          const legs = [
            { desc: 'Short Call', type: 'SELL', strike: strikeSelection.shortCall, suffix: 'CE' },
            { desc: 'Long Call (Protection)', type: 'BUY', strike: strikeSelection.longCall, suffix: 'CE' },
            { desc: 'Short Put', type: 'SELL', strike: strikeSelection.shortPut, suffix: 'PE' },
            { desc: 'Long Put (Protection)', type: 'BUY', strike: strikeSelection.longPut, suffix: 'PE' },
          ];

          legs.forEach((leg, index) => {
            if (leg.strike) {
              self.data.orders.push({
                id: self.data.orders.length + 1,
                orderId: `PAPER-ORD-${tradeId}-${index}`,
                tradeId: tradeId,
                side: leg.type,
                symbol: `${symbol}${expiryDate}${leg.strike}${leg.suffix}`,
                quantity: 1,
                price: leg.type === 'SELL' ? 120.50 : 20.25, // Mock filling prices
                status: 'FILLED',
                timestamp: entryTime
              });
            }
          });

          self.save();
          return { changes: 1, lastInsertRowid: newTrade.id };
        }

        if (cleanSql.includes('UPDATE trades')) {
          // UPDATE trades SET exitTime = ?, exitPrice = ?, status = ?, exitReason = ?, realizedP_L = ? WHERE tradeId = ?
          const [exitTime, exitPrice, status, exitReason, realizedP_L, tradeId] = args;
          const trade = self.data.trades.find(t => t.tradeId === tradeId);
          if (trade) {
            trade.exitTime = exitTime;
            trade.exitPrice = parseFloat(exitPrice);
            trade.status = status;
            trade.exitReason = exitReason;
            trade.realizedP_L = parseFloat(realizedP_L);
            
            // Update associated orders status to CLOSED/COMPLETED
            self.data.orders.forEach(order => {
              if (order.tradeId === tradeId) {
                order.status = 'CLOSED';
              }
            });

            self.save();
            return { changes: 1 };
          }
          return { changes: 0 };
        }

        return { changes: 0 };
      },

      all(...args) {
        if (cleanSql.includes('SELECT * FROM trades ORDER BY entryTime DESC')) {
          return [...self.data.trades].sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));
        }
        if (cleanSql.includes('SELECT * FROM orders WHERE tradeId = ?')) {
          const [tradeId] = args;
          return self.data.orders.filter(o => o.tradeId === tradeId);
        }
        return [];
      },

      get(...args) {
        if (cleanSql.includes('SELECT * FROM trades WHERE tradeId = ?')) {
          const [tradeId] = args;
          return self.data.trades.find(t => t.tradeId === tradeId) || null;
        }
        return null;
      }
    };
  }

  close() {
    this.save();
  }
}

module.exports = Database;
