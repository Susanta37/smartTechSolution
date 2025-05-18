// const mongoose = require('mongoose');

// const inventorySchema = new mongoose.Schema({
//   itemName: { type: String, required: true, index: true },
//   category: { type: String, required: true },
//   quantity: { type: Number, required: true, min: 0 },
//   price: { type: Number, required: true, min: 0 },
//   threshold: { type: Number, default: 10 },
//   updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
// }, { timestamps: true });

// inventorySchema.index({ quantity: 1 }); 

// module.exports = mongoose.model('Inventory', inventorySchema);

const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 }, 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);