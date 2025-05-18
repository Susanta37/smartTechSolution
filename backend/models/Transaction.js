const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
  amount: { type: Number, required: true, min: 0 },
  fee: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  commissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commission' },
}, { timestamps: true });

transactionSchema.index({ createdAt: 1 }); 

module.exports = mongoose.model('Transaction', transactionSchema);