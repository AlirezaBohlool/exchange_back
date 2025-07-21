const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/admin/transactionController');

router.patch('/transactions/:transaction_id/status', transactionController.updateTransactionStatus);
router.patch('/users/:user_id/balance', transactionController.updateUserBalance);
router.get('/transactions/pending', transactionController.getPendingTransactions);

module.exports = router; 