const express = require('express');
const router = express.Router();

// Import all route modules
const auth = require('./auth/index');
const dashboard = require('./dashboard/index');
const admin = require('./admin/index');

// Mount routes
router.use('/auth', auth);
router.use('/dashboard', dashboard);
router.use('/admin', admin);

module.exports = router;
