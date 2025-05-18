const express = require('express');
const router = express.Router();
const { auth, restrictTo } = require('../middleware/auth');
const { getCommissions, payCommissions } = require('../controllers/commissions');

router.get('/', auth, getCommissions);
router.post('/pay', auth, restrictTo('admin'), payCommissions);

module.exports = router;