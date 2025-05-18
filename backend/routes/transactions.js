const express = require('express');
const router = express.Router();
const { auth, restrictTo, restrictOperation } = require('../middleware/auth');
const { createTransaction, getTransactions } = require('../controllers/transactions');

router.post('/', auth, restrictTo('admin', 'employee'), restrictOperation('create_transaction'), createTransaction);
router.get('/', auth, restrictTo('admin', 'employee'), getTransactions);

module.exports = router;