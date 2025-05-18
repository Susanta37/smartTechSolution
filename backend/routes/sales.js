const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { createSale, getSales } = require('../controllers/sale');

router.post('/', auth, createSale);
router.get('/', auth, getSales);

module.exports = router;