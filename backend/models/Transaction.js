const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  type: {
    type: String,
    enum: ['payment', 'refund', 'withdrawal', 'deposit', 'bonus'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'wallet', 'bank_transfer'],
    required: true
  },
  paymentDetails: {
    cardLast4: String,
    cardBrand: String,
    bankName: String,
    accountLast4: String,
    transactionId: String,
    receiptUrl: String
  },
  description: String,
  metadata: {
    type: Map,
    of: String
  },
  error: {
    code: String,
    message: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Create indexes for common queries
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ order: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 