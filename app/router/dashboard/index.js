const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/dashboard/transactionController');
const historyController = require('../../controllers/dashboard/historyController');
const ticketController = require('../../controllers/dashboard/ticketController');

router.post('/transactions/buy', transactionController.buy);
router.post('/transactions/sell', transactionController.sell);
router.post('/deposit', transactionController.deposit);
router.post('/withdraw', transactionController.withdraw);
router.post('/bank', transactionController.registerBankCard);
router.get('/bank/:user_id', transactionController.getUserCards);
router.get('/ticket/:user_id', transactionController.getUserTickets);
router.get('/transactions/history/:user_id', historyController.getUserTransactions);
router.get('/user/:user_id', transactionController.getUserInfo);
router.get('/withdrawals/:user_id', transactionController.getUserWithdrawals);
//ticket routes
router.get('/tickets', ticketController.getAllTickets);
router.post('/ticket', ticketController.createTicket);
router.get('/ticket/:user_id', ticketController.getUserTickets);
router.post('/ticket/reply', ticketController.addTicketReply);
router.get('/ticket/reply/:ticket_id', ticketController.getTicketReplies);
router.get('/ticket/:ticket_id/mark-read', ticketController.markTicketAsRead);
router.get('/ticket/unread/:user_id', ticketController.getUserUnreadCount);
router.get('/ticket/details/:ticket_id', ticketController.getTicketById);
router.post('/ticket/:ticket_id/close', ticketController.closeTicket);

module.exports = router;