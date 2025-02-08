const express = require('express');
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const { authenticate, requireAdmin, requireUser } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Helper function to send email
const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text
    });
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

// Issue a book
router.post('/issue',
  [
    authenticate,
    requireUser,
    body('bookId').notEmpty().withMessage('Book ID is required'),
    body('dueDate')
      .notEmpty().withMessage('Due date is required')
      .isISO8601().withMessage('Due date must be a valid date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: errors.array() 
        });
      }

      const { bookId, dueDate } = req.body;
      const userId = req.user._id;

      // Validate due date
      const dueDateObj = new Date(dueDate);
      const today = new Date();
      const minDate = new Date(today.setDate(today.getDate() + 1));
      const maxDate = new Date(today.setDate(today.getDate() + 30));

      if (dueDateObj < minDate) {
        return res.status(400).json({ 
          message: 'Due date must be at least 1 day from today' 
        });
      }

      if (dueDateObj > maxDate) {
        return res.status(400).json({ 
          message: 'Due date cannot be more than 30 days from today' 
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

      // Check if user already has an active transaction for this book
      const activeTransaction = await Transaction.findOne({
        user: userId,
        book: bookId,
        status: 'active'
      });
      if (activeTransaction) {
        return res.status(400).json({ 
          message: 'You already have this book issued' 
        });
      }

      // Create transaction
      const transaction = new Transaction({
        user: userId,
        book: bookId,
        type: 'issue',
        issueDate: new Date(),
        dueDate: dueDateObj,
        status: 'active'
      });

      // Update book availability
      book.available -= 1;
      await book.save();
      await transaction.save();

      // Send email notification
      await sendEmail(
        req.user.email,
        'Book Issued Successfully',
        `You have successfully borrowed "${book.title}". Please return it by ${dueDateObj.toLocaleDateString()}.`
      );

      res.status(201).json(transaction);
    } catch (error) {
      console.error('Issue transaction error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Return a book
router.post('/return',
  [
    authenticate,
    requireAdmin,
    body('bookId').notEmpty().withMessage('Book ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { bookId } = req.body;
      const userId = req.user._id;

      // Find active transaction
      const transaction = await Transaction.findOne({
        book: bookId,
        user: userId || { $exists: true },
        status: 'active',
        type: 'issue'
      });

      if (!transaction) {
        return res.status(404).json({ message: 'No active transaction found for this book' });
      }

      // Update transaction
      transaction.type = 'return';
      transaction.returnDate = new Date();
      transaction.status = 'completed';

      // Calculate and set penalty if applicable
      if (transaction.returnDate > transaction.dueDate) {
        const daysLate = Math.ceil(
          (transaction.returnDate - transaction.dueDate) / (1000 * 60 * 60 * 24)
        );
        transaction.penalty = {
          amount: daysLate * 1, // $1 per day
          paid: false,
          reason: `Book returned ${daysLate} days late`
        };
      }

      // Update book availability
      const book = await Book.findById(bookId);
      book.available += 1;
      await book.save();
      await transaction.save();

      // Send email notification
      let emailText = `You have successfully returned "${book.title}".`;
      if (transaction.penalty && transaction.penalty.amount > 0) {
        emailText += ` A late fee of $${transaction.penalty.amount} has been applied.`;
      }
      await sendEmail(req.user.email, 'Book Returned Successfully', emailText);

      res.json(transaction);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get user's transactions
router.get('/my-transactions', [authenticate, requireUser], async (req, res) => {
  try {
    const { type, status, startDate, endDate } = req.query;
    const query = { user: req.user._id };

    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) {
        const parsedStartDate = new Date(startDate);
        if (!isNaN(parsedStartDate.getTime())) {
          query.issueDate.$gte = parsedStartDate;
        }
      }
      if (endDate) {
        const parsedEndDate = new Date(endDate);
        if (!isNaN(parsedEndDate.getTime())) {
          query.issueDate.$lte = parsedEndDate;
        }
      }
    }

    const transactions = await Transaction.find(query)
      .populate('user', 'username email')
      .populate('book', 'title barcode available')
      .sort({ issueDate: -1 })
      .lean()
      .then(transactions => transactions.map(transaction => ({
        ...transaction,
        issueDate: transaction.issueDate ? transaction.issueDate.toISOString() : null,
        dueDate: transaction.dueDate ? transaction.dueDate.toISOString() : null,
        returnDate: transaction.returnDate ? transaction.returnDate.toISOString() : null
      })));

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all transactions
router.get('/', [authenticate, requireAdmin], async (req, res) => {
  try {
    const { type, status, startDate, endDate } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('user', 'username email') // Include user details
      .populate('book', 'title barcode available')
      .sort({ date: -1 });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if a book is currently borrowed by the user
router.get('/book-status/:bookId', [authenticate, requireUser], async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      book: req.params.bookId,
      user: req.user._id,
      status: 'active',
      type: 'issue'
    }).populate('book', 'title');

    res.json({
      isBorrowed: !!transaction,
      transaction: transaction
    });
  } catch (error) {
    console.error('Error checking book status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get book's current transaction status
router.get('/book-status-admin/:bookId', [authenticate, requireAdmin], async (req, res) => {
  try {
    const { bookId } = req.params;

    // Find the most recent active transaction for this book
    const transaction = await Transaction.findOne({
      book: bookId,
      status: 'active'
    }).populate('user', 'name email');

    res.json({
      isBorrowed: !!transaction,
      transaction: transaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send due date reminder emails (should be called by a scheduled job)
router.post('/send-reminders', [authenticate, requireAdmin], async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueTomorrow = await Transaction.find({
      status: 'active',
      dueDate: {
        $gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
        $lt: new Date(tomorrow.setHours(23, 59, 59, 999))
      }
    }).populate('user book');

    for (const transaction of dueTomorrow) {
      await sendEmail(
        transaction.user.email,
        'Book Due Tomorrow',
        `Reminder: "${transaction.book.title}" is due tomorrow. Please return it to avoid late fees.`
      );
    }

    res.json({ message: `Sent ${dueTomorrow.length} reminder emails` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
