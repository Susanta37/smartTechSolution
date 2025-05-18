const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee'], required: true },
  phone: { type: String },
  address: { type: String },
  photo: { type: String, default: '' },
  loginTimestamps: [{ timestamp: { type: Date, default: Date.now } }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);