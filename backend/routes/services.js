const express = require('express');
const router = express.Router();
const { auth, restrictTo } = require('../middleware/auth');
const { createService, getServices, updateService, deleteService } = require('../controllers/services');

router.post('/', auth, createService);
router.get('/', auth, getServices);
router.put('/:id', auth, updateService);
router.delete('/:id', auth, restrictTo('admin'), deleteService);

module.exports = router;