const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  operations: [{
    operation: {
      type: String,
      enum: [
        'inventory_add',
        'inventory_update',
        'inventory_view',
        'inventory_sale',
        'service_add',
        'service_update',
        'service_view',
        'service_sale',
        'banking_transaction',
        'banking_view'        
      ],
      required: true
    },
    allowed: { type: Boolean, default: false }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);