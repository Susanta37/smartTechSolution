const express = require('express');
const router = express.Router();
const { createPermission, getPermissions } = require('../controllers/permissions'); 

router.post('/', createPermission);
router.get('/', getPermissions);

module.exports = router;