import express from 'express';

function createTraderRouter(traderController) {
  const router = express.Router();

  router.get('/status', traderController.getStatus);
  router.get('/trades', traderController.getTrades);
  router.get('/trades/:tradeId', traderController.getTradeDetails);
  router.post('/stop', traderController.stopTrader);
  router.get('/config', traderController.getConfig);
  router.post('/toggle-paper', traderController.togglePaperTrading);
  router.get('/portfolio', traderController.getPortfolioData);

  return router;
}

export default createTraderRouter;
