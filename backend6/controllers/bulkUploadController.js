const Book = require('../models/Book');
const { parseCSV } = require('../utils/csvParser');
const fs = require('fs').promises;

exports.uploadBooks = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        console.log('Processing file:', req.file.path);
        
        // Parse the CSV file
        const books = await parseCSV(req.file.path);
        console.log(`Parsed ${books.length} books from CSV`);

        // Validation results
        const results = {
            total: books.length,
            successful: 0,
            failed: 0,
            errors: [],
        };

        // Process each book
        for (const bookData of books) {
            try {
                // Basic validation
                if (!bookData.title || !bookData.author || !bookData.ISBN || !bookData.category) {
                    throw new Error('Missing required fields (title, author, ISBN, or category)');
                }

                // Check if book with ISBN already exists
                const existingBook = await Book.findOne({ ISBN: bookData.ISBN });
                if (existingBook) {
                    console.log(`Updating existing book: ${bookData.title}`);
                    // Update existing book's copies
                    existingBook.totalCopies += parseInt(bookData.totalCopies || 1);
                    existingBook.available += parseInt(bookData.available || 1);
                    await existingBook.save();
                    results.successful++;
                } else {
                    console.log(`Creating new book: ${bookData.title}`);
                    // Ensure numeric fields are properly parsed
                    bookData.publishedYear = bookData.publishedYear ? parseInt(bookData.publishedYear) : undefined;
                    bookData.available = parseInt(bookData.available || 1);
                    bookData.totalCopies = parseInt(bookData.totalCopies || bookData.available || 1);

                    // Create new book
                    await Book.create(bookData);
                    results.successful++;
                }
            } catch (error) {
                console.error(`Error processing book ${bookData.title}:`, error);
                results.failed++;
                results.errors.push({
                    title: bookData.title,
                    error: error.message
                });
            }
        }

        // Delete the temporary file
        await fs.unlink(req.file.path);

        res.json({
            message: 'Bulk upload completed',
            results
        });
    } catch (error) {
        console.error('Bulk upload error:', error);
        
        // Delete the temporary file in case of error
        try {
            if (req.file) {
                await fs.unlink(req.file.path);
            }
        } catch (unlinkError) {
            console.error('Error deleting temporary file:', unlinkError);
        }

        res.status(500).json({
            message: 'Error processing file',
            error: error.message
        });
    }
};
