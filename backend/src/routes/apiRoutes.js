import express from 'express';

function createTraderRouter(traderController) {
  const router = express.Router();

  router.get('/status', traderController.getStatus);
  router.get('/trades', traderController.getTrades);
  router.get('/trades/:tradeId', traderController.getTradeDetails);
  router.post('/stop', traderController.stopTrader);
  router.get('/config', traderController.getConfig);

  return router;
}

export default createTraderRouter;
