const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Xerox", "Photography"
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  inventoryItems: [
    {
      inventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
      },
      quantity: Number, 
    },
  ],
  photoUrl: { type: String }, // URL to the service photo
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin who added
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);