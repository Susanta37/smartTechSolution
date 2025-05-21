const express = require('express');
const router = express.Router();
const { getEmployeeDashboard } = require('../controllers/employeeDashboard');
const { auth } = require('../middleware/auth');

router.get('/dashboard', auth, getEmployeeDashboard);

module.exports = router;