const express = require('express');
const router = express.Router();
const { auth, restrictTo } = require('../middleware/auth');
const { register, login, getUsers, updateUser, deleteUser,getProfile } = require('../controllers/users');

router.post('/register', auth, restrictTo('admin'), register);
router.post('/login', login);
router.get('/', auth, restrictTo('admin'), getUsers);
router.get('/profile', auth, getProfile);
router.put('/:id', auth, restrictTo('admin'), updateUser);
router.delete('/:id', auth, restrictTo('admin'), deleteUser);


module.exports = router;