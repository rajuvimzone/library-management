const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Book = require('../models/Book');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

// Debug middleware
router.use((req, res, next) => {
    console.log(`Book Route: ${req.method} ${req.path}`);
    next();
});

// Get all books (public)
router.get('/', async (req, res) => {
  try {
    const { search, category, available } = req.query;
    const query = {};

    if (search) {
      const searchRegex = new RegExp(search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      query.$or = [
        { title: { $regex: searchRegex } },
        { author: { $regex: searchRegex } },
        { isbn: { $regex: searchRegex } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (available === 'true') {
      query.available = { $gt: 0 };
    }

    console.log('Search query:', JSON.stringify(query, null, 2));
    const books = await Book.find(query)
      .select('title author isbn category available totalCopies coverImage') 
      .sort({ title: 1 })
      .limit(100); 

    console.log(`Found ${books.length} books matching the search criteria`);
    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single book (public)
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get book by barcode
router.get('/barcode/:barcode', authenticate, async (req, res) => {
  try {
    const book = await Book.findOne({ barcode: req.params.barcode });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error('Error fetching book by barcode:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new book (admin only)
router.post('/', [
  authenticate,
  requireAdmin,
  body('title').notEmpty().trim(),
  body('author').notEmpty().trim(),
  body('isbn').notEmpty().trim()
    .matches(/^[0-9-]+$/).withMessage('ISBN must contain only numbers and hyphens'),
  body('category').notEmpty().trim(),
  body('available').isInt({ min: 0 }),
  body('totalCopies').isInt({ min: 1 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      author,
      isbn,
      category,
      description,
      publisher,
      publishedYear,
      available,
      totalCopies,
      location,
      coverImage
    } = req.body;

    // Validate that available copies don't exceed total copies
    if (available > totalCopies) {
      return res.status(400).json({
        message: 'Available copies cannot exceed total copies'
      });
    }

    // Check if book with ISBN already exists using the static method
    const existingBook = await Book.findByIsbn(isbn);
    if (existingBook) {
      return res.status(400).json({ 
        message: 'Book with this ISBN already exists',
        existingBook: {
          title: existingBook.title,
          isbn: existingBook.isbn
        }
      });
    }

    // Create new book with sanitized data
    const book = new Book({
      title,
      author,
      isbn,
      category,
      description,
      publisher,
      publishedYear,
      available,
      totalCopies,
      location,
      coverImage
    });

    const savedBook = await book.save();
    res.status(201).json(savedBook);
  } catch (error) {
    console.error('Error creating book:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    if (error.code === 11000) {
      // Check which field caused the duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: field === 'isbn' || field === 'normalizedIsbn' 
          ? 'Book with this ISBN already exists' 
          : `Duplicate value for ${field}`
      });
    }
    res.status(500).json({ message: 'Error creating book. Please try again.' });
  }
});

// Upload books from CSV (admin only)
router.post('/upload-csv', [authenticate, requireAdmin, upload.single('file')], async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let processedCount = 0;

    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', async (data) => {
                    try {
                        // Clean and validate data
                        const bookData = {
                            title: data.title?.trim(),
                            author: data.author?.trim(),
                            isbn: data.ISBN?.trim() || data.isbn?.trim(),
                            category: data.category?.trim(),
                            description: data.description?.trim(),
                            publisher: data.publisher?.trim(),
                            publishedYear: parseInt(data.publishedYear),
                            totalCopies: parseInt(data.totalCopies) || 1,
                            available: parseInt(data.available) || parseInt(data.totalCopies) || 1,
                            location: data.location?.trim(),
                            coverImage: data.coverImage?.trim()
                        };

                        // Validate required fields
                        if (!bookData.title || !bookData.author || !bookData.isbn) {
                            errors.push(`Missing required fields for book: ${bookData.title || 'Unknown Title'}`);
                            return;
                        }

                        // Check if book already exists
                        const existingBook = await Book.findOne({ isbn: bookData.isbn });
                        if (existingBook) {
                            // Update existing book
                            const updatedBook = await Book.findOneAndUpdate(
                                { isbn: bookData.isbn },
                                { $set: bookData },
                                { new: true }
                            );
                            results.push({ status: 'updated', book: updatedBook });
                        } else {
                            // Create new book
                            const newBook = new Book(bookData);
                            await newBook.save();
                            results.push({ status: 'created', book: newBook });
                        }
                        processedCount++;
                    } catch (error) {
                        console.error('Error processing book:', error);
                        errors.push(`Error processing book: ${data.title || 'Unknown Title'} - ${error.message}`);
                    }
                })
                .on('end', () => {
                    // Clean up uploaded file
                    fs.unlink(req.file.path, (err) => {
                        if (err) console.error('Error deleting file:', err);
                    });
                    resolve();
                })
                .on('error', (error) => {
                    reject(error);
                });
        });

        res.json({
            message: 'CSV processing completed',
            processed: processedCount,
            successful: results.length,
            errors: errors,
            details: results
        });
    } catch (error) {
        console.error('Error processing CSV:', error);
        res.status(500).json({ 
            message: 'Error processing CSV file',
            error: error.message 
        });
    }
});

// Bulk upload books from CSV (admin only)
router.post('/bulk', [authenticate, requireAdmin, upload.single('file')], async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let processedCount = 0;

    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', async (data) => {
                    try {
                        // Clean and validate data
                        const bookData = {
                            title: data.title?.trim(),
                            author: data.author?.trim(),
                            isbn: data.ISBN?.trim() || data.isbn?.trim(),
                            category: data.category?.trim(),
                            description: data.description?.trim(),
                            publisher: data.publisher?.trim(),
                            publishedYear: parseInt(data.publishedYear),
                            totalCopies: parseInt(data.totalCopies) || 1,
                            available: parseInt(data.available) || parseInt(data.totalCopies) || 1,
                            location: data.location?.trim(),
                            coverImage: data.coverImage?.trim()
                        };

                        // Validate required fields
                        if (!bookData.title || !bookData.author || !bookData.isbn) {
                            errors.push(`Missing required fields for book: ${bookData.title || 'Unknown Title'}`);
                            return;
                        }

                        // Check if book already exists
                        const existingBook = await Book.findOne({ isbn: bookData.isbn });
                        if (existingBook) {
                            // Update existing book
                            const updatedBook = await Book.findOneAndUpdate(
                                { isbn: bookData.isbn },
                                { $set: bookData },
                                { new: true }
                            );
                            results.push({ status: 'updated', book: updatedBook });
                        } else {
                            // Create new book
                            const newBook = new Book(bookData);
                            await newBook.save();
                            results.push({ status: 'created', book: newBook });
                        }
                        processedCount++;
                    } catch (error) {
                        console.error('Error processing book:', error);
                        errors.push(`Error processing book: ${data.title || 'Unknown Title'} - ${error.message}`);
                    }
                })
                .on('end', () => {
                    // Clean up uploaded file
                    fs.unlink(req.file.path, (err) => {
                        if (err) console.error('Error deleting file:', err);
                    });
                    resolve();
                })
                .on('error', (error) => {
                    reject(error);
                });
        });

        res.json({
            message: 'CSV processing completed',
            processed: processedCount,
            successful: results.length,
            errors: errors,
            details: results
        });
    } catch (error) {
        console.error('Error processing CSV:', error);
        res.status(500).json({ 
            message: 'Error processing CSV file',
            error: error.message 
        });
    }
});

// Update book (admin only)
router.put('/:id', [
    authenticate, 
    requireAdmin,
    body('title').notEmpty().trim(),
    body('author').notEmpty().trim(),
    body('isbn').notEmpty().trim()
      .matches(/^[0-9-]+$/).withMessage('ISBN must contain only numbers and hyphens'),
    body('category').notEmpty().trim(),
    body('totalCopies').isInt({ min: 1 }),
    body('available').isInt({ min: 0 })
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            title, 
            author, 
            isbn, 
            category, 
            totalCopies, 
            available,
            location,
            description,
            publisher,
            publishedYear,
            coverImage
        } = req.body;

        // Find book and handle non-existent case
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Check if ISBN is being changed and if new ISBN already exists
        if (isbn !== book.isbn) {
            const existingBook = await Book.findByIsbn(isbn);
            if (existingBook && existingBook._id.toString() !== req.params.id) {
                return res.status(400).json({ message: 'ISBN already exists' });
            }
        }

        // Validate that available copies don't exceed total copies
        if (available > totalCopies) {
            return res.status(400).json({
                message: 'Available copies cannot exceed total copies'
            });
        }

        // Calculate borrowed books
        const currentlyBorrowed = book.totalCopies - book.available;
        const newBorrowed = totalCopies - available;

        // Ensure we're not reducing available copies below what's borrowed
        if (newBorrowed !== currentlyBorrowed) {
            return res.status(400).json({
                message: 'Cannot modify borrowed copies count. Please handle returns through the proper process.'
            });
        }

        // Update book fields
        const updates = {
            title,
            author,
            isbn,
            category,
            totalCopies,
            available,
            location,
            description,
            publisher,
            publishedYear,
            coverImage
        };

        const updatedBook = await Book.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.json(updatedBook);
    } catch (error) {
        console.error('Error updating book:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        res.status(500).json({ message: 'Error updating book' });
    }
});

// Delete book (admin only)
router.delete('/:id', [authenticate, requireAdmin], async (req, res) => {
  try {
    console.log('Deleting book:', req.params.id);
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if any copies are borrowed
    if (book.available < book.totalCopies) {
      return res.status(400).json({
        message: 'Cannot delete book while copies are borrowed. Please ensure all copies are returned first.'
      });
    }

    await Book.findByIdAndDelete(req.params.id);
    console.log('Book deleted successfully');
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ 
      message: 'Error deleting book',
      error: error.message 
    });
  }
});

module.exports = router;
