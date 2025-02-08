const mongoose = require('mongoose');
require('dotenv').config();

const Book = require('../models/Book');

const sampleBooks = [
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780446310789",
    genre: "Fiction",
    description: "A classic of modern American literature, this novel tackles issues of racial injustice in the American South.",
    quantity: 5,
    available: 5,
    barcode: "001",
    publisher: "Grand Central Publishing",
    publicationYear: 1960,
    location: "Fiction Section - Shelf A1"
  },
  {
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    genre: "Science Fiction",
    description: "A dystopian novel set in a totalitarian society, exploring themes of surveillance and control.",
    quantity: 3,
    available: 3,
    barcode: "002",
    publisher: "Signet Classic",
    publicationYear: 1949,
    location: "Science Fiction - Shelf B2"
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    genre: "Fiction",
    description: "A story of decadence and excess, exploring the American Dream in the Jazz Age.",
    quantity: 4,
    available: 4,
    barcode: "003",
    publisher: "Scribner",
    publicationYear: 1925,
    location: "Fiction Section - Shelf A2"
  },
  {
    title: "Harry Potter and the Philosopher's Stone",
    author: "J.K. Rowling",
    isbn: "9780747532699",
    genre: "Fantasy",
    description: "The first book in the Harry Potter series, following a young wizard's adventures at Hogwarts.",
    quantity: 6,
    available: 6,
    barcode: "004",
    publisher: "Bloomsbury",
    publicationYear: 1997,
    location: "Fantasy - Shelf C1"
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    genre: "Fantasy",
    description: "A fantasy novel following Bilbo Baggins on an epic quest across Middle-earth.",
    quantity: 4,
    available: 4,
    barcode: "005",
    publisher: "Houghton Mifflin",
    publicationYear: 1937,
    location: "Fantasy - Shelf C2"
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    genre: "Romance",
    description: "A classic romance novel dealing with issues of manners, marriage, and social status.",
    quantity: 3,
    available: 3,
    barcode: "006",
    publisher: "Penguin Classics",
    publicationYear: 1813,
    location: "Romance - Shelf D1"
  },
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    isbn: "9780316769488",
    genre: "Fiction",
    description: "A story of teenage alienation and loss of innocence in America.",
    quantity: 4,
    available: 4,
    barcode: "007",
    publisher: "Little, Brown and Company",
    publicationYear: 1951,
    location: "Fiction Section - Shelf A3"
  },
  {
    title: "The Da Vinci Code",
    author: "Dan Brown",
    isbn: "9780307474278",
    genre: "Thriller",
    description: "A thriller involving a conspiracy within the Catholic Church and hidden symbols in art.",
    quantity: 5,
    available: 5,
    barcode: "008",
    publisher: "Anchor",
    publicationYear: 2003,
    location: "Thriller - Shelf E1"
  }
];

const seedBooks = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing books
    await Book.deleteMany({});
    console.log('Cleared existing books');

    // Insert new books
    await Book.insertMany(sampleBooks);
    console.log('Sample books added successfully');

    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding books:', error);
    process.exit(1);
  }
};

seedBooks();
