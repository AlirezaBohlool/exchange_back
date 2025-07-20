const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/dashboard/transactionController');
const historyController = require('../../controllers/dashboard/historyController');

router.post('/transactions/buy', transactionController.buy);
router.post('/transactions/sell', transactionController.sell);
router.post('/deposit', transactionController.deposit);
router.post('/withdraw', transactionController.withdraw);
router.post('/bank', transactionController.registerBankCard);
router.get('/bank/:user_id', transactionController.getUserCards);
router.post('/ticket', transactionController.createTicket);
router.get('/ticket/:user_id', transactionController.getUserTickets);
router.get('/transactions/history/:user_id', historyController.getUserTransactions);
router.get('/user/:user_id', transactionController.getUserInfo);
router.get('/withdrawals/:user_id', transactionController.getUserWithdrawals);

module.exports = router;