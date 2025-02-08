const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  type: {
    type: String,
    enum: ['issue', 'return'],
    required: true
  },
  issueDate: {
    type: Date,
    required: function() {
      return this.type === 'issue';
    }
  },
  dueDate: {
    type: Date,
    required: function() {
      return this.type === 'issue';
    }
  },
  returnDate: {
    type: Date,
    required: function() {
      return this.type === 'return';
    }
  },
  penalty: {
    amount: {
      type: Number,
      default: 0
    },
    paid: {
      type: Boolean,
      default: false
    },
    reason: String
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'overdue'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Calculate penalty before saving a return transaction
transactionSchema.pre('save', function(next) {
  if (this.type === 'return' && this.dueDate && this.returnDate) {
    const daysLate = Math.ceil((this.returnDate - this.dueDate) / (1000 * 60 * 60 * 24));
    
    if (daysLate > 0) {
      // Penalty rate: $1 per day
      this.penalty.amount = daysLate * 1;
      this.penalty.reason = `Book returned ${daysLate} days late`;
    }
  }
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
