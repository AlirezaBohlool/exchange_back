const express = require('express');
const router = express.Router();

// Import all route modules
const authRouter = require('./auth/index');
const dashboardRouter = require('./dashboard/index');

// Mount routes

router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);

module.exports = router;
