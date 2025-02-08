const mongoose = require('mongoose');
const Book = require('../models/Book');
require('dotenv').config();

async function normalizeIsbn() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Drop existing indexes
        console.log('Dropping existing indexes...');
        await mongoose.connection.collection('books').dropIndexes();
        console.log('Indexes dropped successfully');

        // Get all books
        const books = await Book.find({});
        console.log(`Found ${books.length} books to update`);

        // Update each book with normalized ISBN
        for (const book of books) {
            const normalizedIsbn = book.isbn.toLowerCase().replace(/[-\s]/g, '');
            console.log(`Updating book "${book.title}" (${book.isbn} -> ${normalizedIsbn})`);
            
            await Book.updateOne(
                { _id: book._id },
                { 
                    $set: { 
                        normalizedIsbn: normalizedIsbn
                    }
                }
            );
        }

        // Recreate indexes
        console.log('Recreating indexes...');
        await Book.syncIndexes();
        console.log('Indexes recreated successfully');

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    }
}

// Run the migration
normalizeIsbn();
