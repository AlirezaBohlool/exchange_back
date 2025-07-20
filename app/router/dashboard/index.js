const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/dashboard/transactionController');
const historyController = require('../../controllers/dashboard/historyController');

router.post('/transactions/buy', transactionController.buy);
router.post('/transactions/sell', transactionController.sell);
router.get('/transactions/history/:user_id', historyController.getUserTransactions);

module.exports = router;