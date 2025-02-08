const express = require('express');
const { body, validationResult } = require('express-validator');
const Book = require('../models/Book');
const { authenticate, authorize } = require('../middleware/auth');
const QRCode = require('qrcode');

const router = express.Router();

// Get all books with filtering
router.get('/', async (req, res) => {
  try {
    const { title, author, genre, available } = req.query;
    const query = {};

    if (title) query.title = new RegExp(title, 'i');
    if (author) query.author = new RegExp(author, 'i');
    if (genre) query.genre = new RegExp(genre, 'i');
    if (available === 'true') query.available = { $gt: 0 };

    const books = await Book.find(query);
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new book (admin only)
router.post('/',
  [
    authenticate,
    authorize('admin'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
    body('isbn').trim().notEmpty().withMessage('ISBN is required'),
    body('genre').trim().notEmpty().withMessage('Genre is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, author, isbn, genre, quantity, description, location } = req.body;

      // Generate unique barcode
      const barcode = `LIB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate QR code
      const qrCode = await QRCode.toDataURL(barcode);

      const book = new Book({
        title,
        author,
        isbn,
        genre,
        quantity,
        description,
        location,
        barcode,
        available: quantity
      });

      await book.save();
      res.status(201).json({ book, qrCode });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update book (admin only)
router.put('/:id',
  [
    authenticate,
    authorize('admin'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('author').optional().trim().notEmpty().withMessage('Author cannot be empty'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be non-negative')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const book = await Book.findById(req.params.id);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      // Update only provided fields
      const updates = req.body;
      Object.keys(updates).forEach(key => {
        if (key !== 'barcode') { // Prevent barcode modification
          book[key] = updates[key];
        }
      });

      await book.save();
      res.json(book);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete book (admin only)
router.delete('/:id', [authenticate, authorize('admin')], async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await book.remove();
    res.json({ message: 'Book removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get book by barcode
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const book = await Book.findOne({ barcode: req.params.barcode });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
