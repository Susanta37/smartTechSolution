const mongoose = require('mongoose');

const bankingSchema = new mongoose.Schema({
  type: { type: String, enum: ['deposit', 'withdrawal', 'borrowing','ledger_transfer'], required: true },
  amount: { type: Number, required: true, min: 0 },
  charge: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['paynearby', 'online', null], default: null }, 
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashBalance: { type: Number, default: 0 },
  ledgerBalance: { type: Number, default: 0 },
  onlineWalletBalance: { type: Number, default: 0 },
  mainBalance: { type: Number, default: 0 },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Banking', bankingSchema);