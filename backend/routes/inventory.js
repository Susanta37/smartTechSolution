const express = require('express');
const router = express.Router();
const { auth, restrictTo } = require('../middleware/auth');
const { createInventory, getInventory, updateInventory, deleteInventory } = require('../controllers/inventory');

router.post('/', auth, createInventory);
router.get('/', auth, getInventory);
router.put('/:id', auth, updateInventory);
router.delete('/:id', auth, restrictTo('admin'), deleteInventory);

module.exports = router;