const mongoose = require('mongoose');
const Book = require('../models/Book');
require('dotenv').config();

const sampleBooks = [
    {
        title: "Clean Code: A Handbook of Agile Software Craftsmanship",
        author: "Robert C. Martin",
        isbn: "978-0132350884",
        category: "Technology",
        description: "A comprehensive guide to writing clean, maintainable code that follows industry best practices",
        publisher: "Pearson",
        publishedYear: 2008,
        totalCopies: 5,
        available: 3,
        location: "Section A1",
        coverImage: "https://m.media-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg"
    },
    {
        title: "Python for Data Science Handbook",
        author: "Jake VanderPlas",
        isbn: "978-1491912058",
        category: "Science",
        description: "Essential tools for working with data in Python, including IPython, NumPy, Pandas, Matplotlib, and Scikit-Learn",
        publisher: "O'Reilly",
        publishedYear: 2016,
        totalCopies: 4,
        available: 2,
        location: "Section B2",
        coverImage: "https://m.media-amazon.com/images/I/51MPp7yuZCL._SX379_BO1,204,203,200_.jpg"
    },
    {
        title: "Sapiens: A Brief History of Humankind",
        author: "Yuval Noah Harari",
        isbn: "978-0062316097",
        category: "History",
        description: "A groundbreaking narrative of humanity's creation and evolution that explores how biology and history have defined us",
        publisher: "Harper",
        publishedYear: 2015,
        totalCopies: 6,
        available: 4,
        location: "Section C3",
        coverImage: "https://m.media-amazon.com/images/I/41yu2qXhXXL._SX324_BO1,204,203,200_.jpg"
    },
    {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        isbn: "978-0374533557",
        category: "Philosophy",
        description: "An exploration of the two systems that drive the way we think—the fast, intuitive, and emotional system; and the slow, deliberative, and logical system",
        publisher: "Farrar, Straus and Giroux",
        publishedYear: 2011,
        totalCopies: 3,
        available: 2,
        location: "Section D4",
        coverImage: "https://m.media-amazon.com/images/I/41shZGS-G+L._SX330_BO1,204,203,200_.jpg"
    },
    {
        title: "The Road Not Taken and Other Poems",
        author: "Robert Frost",
        isbn: "978-0486275505",
        category: "Literature",
        description: "A collection of Robert Frost's most famous and beloved poems, including 'The Road Not Taken,' 'Mending Wall,' and 'Birches'",
        publisher: "Dover Publications",
        publishedYear: 1993,
        totalCopies: 4,
        available: 3,
        location: "Section E5",
        coverImage: "https://m.media-amazon.com/images/I/51YkqqnCtWL._SX307_BO1,204,203,200_.jpg"
    },
    {
        title: "Life 3.0: Being Human in the Age of Artificial Intelligence",
        author: "Max Tegmark",
        isbn: "978-1101946596",
        category: "Technology",
        description: "How artificial intelligence will affect crime, war, justice, jobs, society and our very sense of being human",
        publisher: "Knopf",
        publishedYear: 2017,
        totalCopies: 5,
        available: 3,
        location: "Section A2",
        coverImage: "https://m.media-amazon.com/images/I/51q1S8NhxbL._SX330_BO1,204,203,200_.jpg"
    },
    {
        title: "The Midnight Library",
        author: "Matt Haig",
        isbn: "978-0525559474",
        category: "Fiction",
        description: "Between life and death there is a library, and within that library, the shelves go on forever",
        publisher: "Viking",
        publishedYear: 2020,
        totalCopies: 6,
        available: 4,
        location: "Section F1",
        coverImage: "https://m.media-amazon.com/images/I/51Ifl1zXhJL._SX329_BO1,204,203,200_.jpg"
    },
    {
        title: "A Brief History of Time",
        author: "Stephen Hawking",
        isbn: "978-0553380163",
        category: "Science",
        description: "A landmark volume in science writing by one of the great minds of our time",
        publisher: "Bantam",
        publishedYear: 1998,
        totalCopies: 4,
        available: 2,
        location: "Section B3",
        coverImage: "https://m.media-amazon.com/images/I/51+GySc8ExL._SX333_BO1,204,203,200_.jpg"
    },
    {
        title: "Start with Why",
        author: "Simon Sinek",
        isbn: "978-1591846444",
        category: "Non-Fiction",
        description: "How great leaders inspire everyone to take action",
        publisher: "Portfolio",
        publishedYear: 2011,
        totalCopies: 5,
        available: 4,
        location: "Section G2",
        coverImage: "https://m.media-amazon.com/images/I/51xrHMLWJeL._SX330_BO1,204,203,200_.jpg"
    },
    {
        title: "Silent Spring",
        author: "Rachel Carson",
        isbn: "978-0618249060",
        category: "Science",
        description: "The classic that launched the environmental movement",
        publisher: "Houghton Mifflin",
        publishedYear: 2002,
        totalCopies: 4,
        available: 3,
        location: "Section B4",
        coverImage: "https://m.media-amazon.com/images/I/51JJWZSdqkL._SX338_BO1,204,203,200_.jpg"
    }
];

async function addSampleBooks() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // First, remove all existing books
        console.log('Removing existing books...');
        await Book.deleteMany({});
        console.log('Existing books removed');

        // Add each book
        console.log('Adding new books...');
        for (const bookData of sampleBooks) {
            try {
                const book = new Book(bookData);
                await book.save();
                console.log(`Added book: ${bookData.title}`);
            } catch (error) {
                console.error(`Error adding book ${bookData.title}:`, error.message);
            }
        }

        console.log('Successfully added all sample books');
    } catch (error) {
        console.error('Error in database operation:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
addSampleBooks();
