const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    issueDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date
    },
    returnedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    fine: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Method to calculate fine amount
transactionSchema.methods.calculateFine = function() {
    if (this.status !== 'active') return 0;
    
    const now = new Date();
    const dueDate = new Date(this.dueDate);
    
    if (now <= dueDate) return 0;
    
    const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
    return daysOverdue * 10; // $10 per day
};

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
