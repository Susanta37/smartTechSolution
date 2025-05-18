const jwt = require('jsonwebtoken');
const Permission = require('../models/Permission');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please log in again' });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

const restrictOperation = (operation) => {
  return async (req, res, next) => {
    if (req.user.role === 'admin') return next(); 
    try {
      const permission = await Permission.findOne({ employeeId: req.user.id });
      if (!permission || !permission.operations.find(op => op.operation === operation && op.allowed)) {
        return res.status(403).json({ message: `Not authorized to perform ${operation}` });
      }
      next();
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = { auth, restrictTo, restrictOperation };