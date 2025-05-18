const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { createBankingTransaction, getBankingTransactions } = require('../controllers/banking');

router.post('/', auth, createBankingTransaction);
router.get('/', auth, getBankingTransactions);

module.exports = router;