const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  type: { type: String, enum: ['inventory', 'service'], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'type' }, // Refers to Inventory or Service
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  finalPrice: { type: Number, required: true, min: 0 },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commission: { type: Number, default: 0, min: 0 }, 
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);