const mongoose = require('mongoose');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })],
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB connected');
    console.log('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;