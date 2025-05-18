const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

exports.register = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  check('role', 'Role must be admin or employee').isIn(['admin', 'employee']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role, phone, address, photo } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ message: 'User already exists' });

      user = new User({
        name,
        email,
        password,
        role,
        phone,
        address,
        photo,
        createdBy: req.user ? req.user.id : null,
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      const payload = { id: user.id, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          photo: user.photo,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },
];

exports.login = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      if (user.role === 'employee') {
        user.loginTimestamps.push({ timestamp: new Date() });
        await user.save();
      }

      const payload = { id: user.id, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          photo: user.photo,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },
];

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'employee' }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = [
  check('name', 'Name is required').optional().not().isEmpty(),
  check('email', 'Please include a valid email').optional().isEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const { name, email, phone, address, photo } = req.body;
      if (name) user.name = name;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (address) user.address = address;
      if (photo) user.photo = photo;

      await user.save();
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // req.user should be set by your auth middleware
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};