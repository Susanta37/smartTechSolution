const express = require('express');
const router = express.Router();
const { auth, restrictTo } = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboard');

router.get(
  '/',
  auth,
  restrictTo('admin'),
  getDashboard
);

module.exports = router;