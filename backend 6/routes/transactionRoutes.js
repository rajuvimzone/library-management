const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate, requireAdmin } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');

// Debug middleware for this router
router.use((req, res, next) => {
    console.log(`Transaction Route: ${req.method} ${req.path}`);
    next();
});

// User Routes

// Get user's transactions
router.get('/my-transactions', authenticate, async (req, res) => {
    try {
        const transactions = await Transaction.find({
            user: req.user._id
        })
        .populate({
            path: 'book',
            select: 'title author isbn category coverImage description'
        })
        .populate('user', 'username email')
        .sort({ issueDate: -1 });

        // Calculate status for each transaction
        const transactionsWithStatus = transactions.map(transaction => {
            const now = new Date();
            const dueDate = new Date(transaction.dueDate);
            let status = transaction.status;
            
            if (status === 'active') {
                if (now > dueDate) {
                    status = 'overdue';
                } else if (now > new Date(transaction.issueDate)) {
                    const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                    status = `Due in ${daysLeft} days`;
                }
            }

            return {
                ...transaction.toObject(),
                status
            };
        });

        res.json(transactionsWithStatus);
    } catch (error) {
        console.error('Error fetching user transactions:', error);
        res.status(500).json({ 
            message: 'Error fetching transactions',
            error: error.message
        });
    }
});

// Issue a book
router.post('/issue', authenticate, async (req, res) => {
    try {
        const { bookId, dueDate } = req.body;

        // Validate book ID
        if (!bookId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                message: 'Invalid book ID format'
            });
        }

        // Check if user already has this specific book
        const existingBookTransaction = await Transaction.findOne({
            user: req.user._id,
            book: bookId,
            status: 'active'
        }).populate('book', 'title');

        if (existingBookTransaction) {
            return res.status(400).json({ 
                message: `You already have a copy of "${existingBookTransaction.book.title}" borrowed`,
                transaction: existingBookTransaction
            });
        }

        // Check if book exists and is available
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        if (book.available <= 0) {
            return res.status(400).json({ message: 'Book is not available' });
        }

        // Create transaction
        const transaction = new Transaction({
            user: req.user._id,
            book: bookId,
            issueDate: new Date(),
            dueDate: new Date(dueDate),
            status: 'active'
        });

        await transaction.save();

        // Update book availability
        await Book.findByIdAndUpdate(
            bookId,
            { $inc: { available: -1 } },
            { new: true, runValidators: true }
        );

        // Populate the response
        await transaction.populate([
            { 
                path: 'book',
                select: 'title author isbn category coverImage description'
            },
            {
                path: 'user',
                select: 'username email'
            }
        ]);

        res.json(transaction);
    } catch (error) {
        console.error('Error issuing book:', error);
        res.status(500).json({ 
            message: 'Error issuing book',
            error: error.message
        });
    }
});

// Get book status for a user
router.get('/book-status/:bookId', authenticate, async (req, res) => {
    try {
        const { bookId } = req.params;

        // Find if user has borrowed this specific book
        const transaction = await Transaction.findOne({
            user: req.user._id,
            book: bookId,
            status: 'active'
        }).populate('book', 'title author');

        res.json({
            transaction,
            canBorrow: !transaction // Can borrow if no active transaction for this book
        });
    } catch (error) {
        console.error('Error checking book status:', error);
        res.status(500).json({ 
            message: 'Error checking book status',
            error: error.message
        });
    }
});

// Admin Routes

// Get all active transactions (admin only)
router.get('/active', [authenticate, requireAdmin], async (req, res) => {
    try {
        console.log('Fetching active transactions...');
        const transactions = await Transaction.find({ status: 'active' })
            .populate('book', 'title ISBN available totalCopies')
            .populate('user', 'username email')
            .sort({ dueDate: 1 });

        console.log(`Found ${transactions.length} active transactions`);
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching active transactions:', error);
        res.status(500).json({ 
            message: 'Error fetching active transactions',
            error: error.message 
        });
    }
});

// Get all transactions with filters (admin only)
router.get('/all', [authenticate, requireAdmin], async (req, res) => {
    try {
        const { type, status, startDate, endDate } = req.query;
        const query = {};

        // Apply filters
        if (status) query.status = status;
        if (startDate) query.issueDate = { $gte: new Date(startDate) };
        if (endDate) {
            if (query.issueDate) {
                query.issueDate.$lte = new Date(endDate);
            } else {
                query.issueDate = { $lte: new Date(endDate) };
            }
        }

        console.log('Fetching transactions with query:', query);
        const transactions = await Transaction.find(query)
            .populate('book', 'title author ISBN available')
            .populate('user', 'username email')
            .sort({ issueDate: -1 });

        console.log(`Found ${transactions.length} transactions`);
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching all transactions:', error);
        res.status(500).json({ 
            message: 'Error fetching transactions',
            error: error.message 
        });
    }
});

// Return a book (admin only)
router.post('/return/:transactionId', [authenticate, requireAdmin], async (req, res) => {
    try {
        const { transactionId } = req.params;
        console.log('Processing return for transaction:', transactionId);

        // Validate transaction ID
        if (!transactionId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                message: 'Invalid transaction ID format'
            });
        }

        // Find transaction with populated fields
        const transaction = await Transaction.findById(transactionId)
            .populate('book')
            .populate('user', 'username email');
        
        if (!transaction) {
            console.log('Transaction not found:', transactionId);
            return res.status(404).json({
                message: 'Transaction not found'
            });
        }

        if (!transaction.book) {
            return res.status(404).json({
                message: 'Associated book not found'
            });
        }

        if (transaction.status !== 'active') {
            console.log('Transaction already completed:', transactionId);
            return res.status(400).json({
                message: 'Book is already returned'
            });
        }

        // Calculate fine if overdue
        const dueDate = new Date(transaction.dueDate);
        const returnDate = new Date();
        let fine = 0;

        if (returnDate > dueDate) {
            const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
            fine = daysOverdue * 10; // $10 per day
            console.log(`Calculated fine: $${fine} for ${daysOverdue} days overdue`);
        }

        try {
            // Update transaction
            transaction.status = 'completed';
            transaction.returnDate = returnDate;
            transaction.returnedTo = req.user._id;
            transaction.fine = fine;
            await transaction.save();
            console.log('Transaction updated successfully');

            // Update book availability using findByIdAndUpdate
            await Book.findByIdAndUpdate(
                transaction.book._id,
                { $inc: { available: 1 } },
                { new: true, runValidators: false }
            );
            console.log('Book availability updated');

            res.json({
                message: 'Book returned successfully',
                transaction: {
                    _id: transaction._id,
                    book: {
                        _id: transaction.book._id,
                        title: transaction.book.title,
                        ISBN: transaction.book.ISBN,
                        available: transaction.book.available + 1
                    },
                    user: {
                        _id: transaction.user._id,
                        username: transaction.user.username
                    },
                    status: transaction.status,
                    issueDate: transaction.issueDate,
                    dueDate: transaction.dueDate,
                    returnDate: transaction.returnDate,
                    fine
                },
                fine
            });
        } catch (error) {
            console.error('Error in return process:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error returning book:', error);
        res.status(500).json({ 
            message: 'Error returning book',
            error: error.message
        });
    }
});

module.exports = router;
