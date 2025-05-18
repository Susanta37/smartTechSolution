// const mongoose = require('mongoose');

// const commissionSchema = new mongoose.Schema({
//   employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
//   transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
//   amount: { type: Number, required: true, min: 0 },
//   month: { type: String, required: true }, 
//   paid: { type: Boolean, default: false },
//   paymentDate: { type: Date },
// }, { timestamps: true });

// commissionSchema.index({ employeeId: 1, month: 1 }); 

// module.exports = mongoose.model('Commission', commissionSchema);
const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidOn: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Commission', commissionSchema);