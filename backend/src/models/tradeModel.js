class TradeModel {
  /**
   * Fetch all trades ordered by entry time descending
   */
  static getAllTrades(db) {
    return db.prepare('SELECT * FROM trades ORDER BY entryTime DESC').all();
  }

  /**
   * Fetch a single trade record by tradeId
   */
  static getTradeById(db, tradeId) {
    return db.prepare('SELECT * FROM trades WHERE tradeId = ?').get(tradeId);
  }

  /**
   * Fetch all orders leg logs matching a specific tradeId
   */
  static getOrdersByTradeId(db, tradeId) {
    return db.prepare('SELECT * FROM orders WHERE tradeId = ?').all(tradeId);
  }
}

module.exports = TradeModel;
