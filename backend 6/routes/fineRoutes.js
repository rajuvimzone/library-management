const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const fineController = require('../controllers/fineController');

// Get fine configuration
router.get('/config', authenticate, fineController.getFineConfig);

// Update fine configuration (admin only)
router.put('/config', [authenticate, requireAdmin], fineController.updateFineConfig);

// Calculate fine for a specific transaction
router.get('/calculate/:transactionId', authenticate, fineController.calculateFine);

// Pay fine
router.post('/pay/:transactionId', authenticate, fineController.payFine);

// Get user's unpaid fines
router.get('/unpaid', authenticate, fineController.getUserUnpaidFines);

module.exports = router;
