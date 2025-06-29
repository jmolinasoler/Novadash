const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Main dashboard route
router.get('/', dashboardController.showDashboard);

// Route to handle block lookup
router.post('/block', dashboardController.lookupBlock);

// Route to handle transaction lookup
router.post('/tx', dashboardController.lookupTx);

// API route for dynamic updates
router.get('/api/update', dashboardController.getApiUpdate);

module.exports = router;