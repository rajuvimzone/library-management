const mongoose = require('mongoose');

const fineConfigSchema = new mongoose.Schema({
  ratePerDay: {
    type: Number,
    required: true,
    default: 10 // Default fine rate of 10 per day
  },
  gracePeriod: {
    type: Number,
    required: true,
    default: 0 // Number of days after due date before fine starts
  },
  maxFine: {
    type: Number,
    required: true,
    default: 1000 // Maximum fine amount
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const FineConfig = mongoose.model('FineConfig', fineConfigSchema);
module.exports = FineConfig;
