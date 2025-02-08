const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    isbn: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        set: function(isbn) {
            // Store ISBN with hyphens for display
            return isbn.trim();
        },
        validate: {
            validator: function(isbn) {
                // Basic ISBN format validation (numbers and hyphens only)
                return /^[0-9-]+$/.test(isbn);
            },
            message: 'ISBN must contain only numbers and hyphens'
        }
    },
    normalizedIsbn: {
        type: String,
        unique: true,
        index: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    publisher: {
        type: String,
        default: '',
        trim: true
    },
    publishedYear: {
        type: Number
    },
    available: {
        type: Number,
        required: true,
        default: 1,
        min: 0
    },
    totalCopies: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },
    location: {
        type: String,
        default: '',
        trim: true
    },
    coverImage: {
        type: String,
        default: '',
        trim: true
    },
    barcode: {
        type: String,
        default() {
            // Generate barcode based on normalized ISBN
            return this.isbn ? this.isbn.replace(/[-\s]/g, '') : '';
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to update timestamps and normalize ISBN
bookSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Create normalized version of ISBN (remove hyphens and spaces, convert to lowercase)
    if (this.isbn) {
        this.normalizedIsbn = this.isbn.toLowerCase().replace(/[-\s]/g, '');
    }
    
    next();
});

// Static method to find a book by ISBN (handles both normal and normalized formats)
bookSchema.statics.findByIsbn = async function(isbn) {
    const normalizedIsbn = isbn.toLowerCase().replace(/[-\s]/g, '');
    return this.findOne({
        $or: [
            { isbn: isbn },
            { normalizedIsbn: normalizedIsbn }
        ]
    });
};

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
