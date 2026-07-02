const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdraw'], required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  transactionId: { type: String }, // Provided by user for deposit proofs
  notes: { type: String },
  screenshotUrl: { type: String } // For deposit proofs
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
