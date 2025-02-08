const Transaction = require('../models/Transaction');
const FineConfig = require('../models/FineConfig');

// Get fine configuration
exports.getFineConfig = async (req, res) => {
    try {
        const config = await FineConfig.findOne({});
        res.json(config || {
            ratePerDay: 10,
            gracePeriod: 0,
            maxFine: 1000
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching fine configuration' });
    }
};

// Update fine configuration
exports.updateFineConfig = async (req, res) => {
    try {
        const { ratePerDay, gracePeriod, maxFine } = req.body;
        let config = await FineConfig.findOne({});

        if (!config) {
            config = new FineConfig({
                ratePerDay,
                gracePeriod,
                maxFine,
                updatedBy: req.user._id
            });
        } else {
            config.ratePerDay = ratePerDay;
            config.gracePeriod = gracePeriod;
            config.maxFine = maxFine;
            config.updatedBy = req.user._id;
            config.updatedAt = Date.now();
        }

        await config.save();
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error updating fine configuration' });
    }
};

// Calculate fine for a transaction
exports.calculateFine = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const fineAmount = await transaction.calculateFine();
        res.json({ fineAmount });
    } catch (error) {
        res.status(500).json({ message: 'Error calculating fine' });
    }
};

// Pay fine
exports.payFine = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.fine.isPaid) {
            return res.status(400).json({ message: 'Fine is already paid' });
        }

        // Recalculate fine before payment to ensure accuracy
        await transaction.calculateFine();

        transaction.fine.isPaid = true;
        transaction.fine.paidDate = new Date();
        await transaction.save();

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Error processing fine payment' });
    }
};

// Get user's total unpaid fines
exports.getUserUnpaidFines = async (req, res) => {
    try {
        const transactions = await Transaction.find({
            user: req.user._id,
            'fine.isPaid': false,
            'fine.amount': { $gt: 0 }
        });

        let totalUnpaidFines = 0;
        for (const transaction of transactions) {
            await transaction.calculateFine(); // Recalculate to ensure accuracy
            totalUnpaidFines += transaction.fine.amount;
        }

        res.json({
            totalUnpaidFines,
            transactions
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching unpaid fines' });
    }
};
