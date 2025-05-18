const Permission = require('../models/Permission');
const { auth, restrictTo } = require('../middleware/auth');

exports.createPermission = [
  auth,
  restrictTo('admin'),
  async (req, res) => {
    const { employeeId, operations } = req.body;
    try {
      // Validate employee exists
      const employee = await require('../models/User').findById(employeeId);
      if (!employee || employee.role !== 'employee') {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }

      // Check if permission already exists
      let permission = await Permission.findOne({ employeeId });
      if (permission) {
        permission.operations = operations;
        permission.createdBy = req.user.id; 
        await permission.save();
        return res.json(permission);
      }

      // Create new permission
      permission = new Permission({
        employeeId,
        operations,
        createdBy: req.user.id, // Set createdBy to admin's ID
      });
      await permission.save();
      res.status(201).json(permission);
    } catch (err) {
      console.error('Error in createPermission:', err.stack);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },
];

exports.getPermissions = [
  auth,
  restrictTo('admin'),
  async (req, res) => {
    try {
      const permissions = await Permission.find().populate('employeeId createdBy');
      res.json(permissions);
    } catch (err) {
      console.error('Error in getPermissions:', err.stack);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },
];