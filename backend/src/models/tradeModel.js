class TradeModel {
  /**
   * Fetch all trades ordered by entry time descending
   */
  static async getAllTrades(prisma) {
    try {
      return await prisma.trade.findMany({
        orderBy: {
          entryTime: 'desc',
        },
      });
    } catch (e) {
      console.error('Prisma Error in getAllTrades:', e.message);
      return [];
    }
  }

  /**
   * Fetch a single trade record by tradeId
   */
  static async getTradeById(prisma, tradeId) {
    try {
      return await prisma.trade.findUnique({
        where: {
          tradeId: tradeId,
        },
      });
    } catch (e) {
      console.error('Prisma Error in getTradeById:', e.message);
      return null;
    }
  }

  /**
   * Fetch all orders leg logs matching a specific tradeId
   */
  static async getOrdersByTradeId(prisma, tradeId) {
    try {
      return await prisma.order.findMany({
        where: {
          tradeId: tradeId,
        },
      });
    } catch (e) {
      console.error('Prisma Error in getOrdersByTradeId:', e.message);
      return [];
    }
  }
}

export default TradeModel;
