const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const bwipjs = require('bwip-js');
const { sendEmail } = require('../utils/emailService');

// Issue a book
exports.issueBook = async (req, res) => {
    try {
        const { bookId, dueDate } = req.body;
        const userId = req.user.id; // Assuming user ID is set by auth middleware

        // Check if user has already borrowed this book
        const existingTransaction = await Transaction.findOne({
            book: bookId,
            user: userId,
            status: 'active'
        });

        if (existingTransaction) {
            return res.status(400).json({ message: 'You have already borrowed this book' });
        }

        // Check if book is available
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        if (book.available <= 0) {
            return res.status(400).json({ message: 'Book is not available' });
        }

        // Create new transaction
        const transaction = new Transaction({
            book: bookId,
            user: userId,
            issueDate: new Date(),
            dueDate: new Date(dueDate),
            status: 'active'
        });

        await transaction.save();

        // Update book availability
        book.available -= 1;
        await book.save();

        // Get user details for email
        const user = await User.findById(userId);

        // Send confirmation email
        const emailData = {
            to: user.email,
            subject: 'Book Borrowed Successfully',
            text: `You have successfully borrowed "${book.title}". Due date: ${new Date(dueDate).toLocaleDateString()}`,
            html: `
                <h2>Book Borrowed Successfully</h2>
                <p>You have successfully borrowed the following book:</p>
                <p><strong>Title:</strong> ${book.title}</p>
                <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
                <p>Please return the book by the due date to avoid any late fees.</p>
            `
        };

        await sendEmail(emailData);

        // Populate the book details before sending response
        const populatedTransaction = await Transaction.findById(transaction._id).populate('book');

        return res.json({ message: 'Book issued successfully', transaction: populatedTransaction });

    } catch (error) {
        console.error('Book issue error:', error);
        return res.status(500).json({ message: 'An error occurred while processing the transaction' });
    }
};

// Get all active transactions (admin only)
exports.getActiveTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ status: 'active' })
            .populate('book', 'title ISBN available totalCopies')
            .populate('user', 'username email');

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching active transactions:', error);
        res.status(500).json({ message: 'Error fetching active transactions' });
    }
};

// Return a book
exports.returnBook = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await Transaction.findById(transactionId)
            .populate('book')
            .populate('user');

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.status !== 'active') {
            return res.status(400).json({ message: 'Book is already returned' });
        }

        // Calculate fine if overdue
        const dueDate = new Date(transaction.dueDate);
        const returnDate = new Date();
        let fine = 0;

        if (returnDate > dueDate) {
            const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
            fine = daysOverdue * 10; // $10 per day
        }

        // Update transaction
        transaction.status = 'completed';
        transaction.returnDate = returnDate;
        transaction.fine = fine;
        await transaction.save();

        // Update book availability
        const book = transaction.book;
        book.available += 1;
        await book.save();

        // Send email notification
        try {
            await sendEmail({
                to: transaction.user.email,
                subject: 'Book Return Confirmation',
                text: `Thank you for returning "${book.title}". ${fine > 0 ? `You have a fine of $${fine} due to late return.` : ''}`
            });
        } catch (emailError) {
            console.error('Error sending email:', emailError);
        }

        res.json({ 
            message: 'Book returned successfully',
            fine,
            transaction 
        });
    } catch (error) {
        console.error('Error returning book:', error);
        res.status(500).json({ message: 'Error returning book' });
    }
};

// Get book status (whether it's borrowed by the current user)
exports.getBookStatus = async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user.id;

        // Find active transaction for this book by this user
        const transaction = await Transaction.findOne({
            book: bookId,
            user: userId,
            status: 'active'
        }).populate('book');

        return res.json({
            isBorrowed: !!transaction,
            transaction: transaction
        });
    } catch (error) {
        console.error('Error checking book status:', error);
        return res.status(500).json({ message: 'Error checking book status' });
    }
};

// Get user's transactions
exports.getUserTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        const query = { user: userId };
        if (status) {
            query.status = status;
        }

        const transactions = await Transaction.find(query)
            .populate({
                path: 'book',
                select: 'title author genre isbn barcode available'
            })
            .sort({ issueDate: -1 });

        // Filter out transactions with null books
        const validTransactions = transactions.filter(transaction => transaction.book != null);

        return res.json(validTransactions);
    } catch (error) {
        console.error('Error getting user transactions:', error);
        return res.status(500).json({ message: 'Error getting transactions' });
    }
};

// Generate barcode
exports.generateBarcode = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                status: 'error',
                message: 'Barcode text is required'
            });
        }

        const png = await bwipjs.toBuffer({
            bcid: 'code128',
            text: text,
            scale: 3,
            height: 10,
            includetext: true,
            textxalign: 'center',
        });

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': png.length
        });
        res.end(png);

    } catch (error) {
        console.error('Barcode generation error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while generating the barcode'
        });
    }
};
