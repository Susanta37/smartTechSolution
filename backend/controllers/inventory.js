const Inventory = require('../models/Inventory');
const Category = require('../models/Category');
const { restrictOperation } = require('../middleware/auth');

exports.createInventory = [
  restrictOperation('inventory_add'),
  async (req, res) => {
    const { name, description, categoryId, quantity, unitPrice } = req.body;
    try {
      // Validate category
      const category = await Category.findById(categoryId);
      if (!category) return res.status(404).json({ message: 'Category not found' });

      // Check if inventory with same name and categoryId exists
      let inventory = await Inventory.findOne({ name, categoryId });
      if (inventory) {
        // Update existing inventory by adding quantity
        inventory.quantity += quantity;
        inventory.unitPrice = unitPrice; // Update price if changed
        if (description) inventory.description = description;
        await inventory.save();
        return res.json(inventory);
      }

      // Create new inventory
      inventory = new Inventory({
        name,
        description,
        categoryId,
        quantity,
        unitPrice,
        createdBy: req.user.id,
      });
      await inventory.save();
      res.status(201).json(inventory);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];

exports.getInventory = [
  restrictOperation('inventory_view'),
  async (req, res) => {
    try {
      const inventory = await Inventory.find().populate('categoryId', 'name description photoUrl');
      res.json(inventory);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];

exports.updateInventory = [
  restrictOperation('inventory_update'),
  async (req, res) => {
    const { name, description, categoryId, quantity, unitPrice } = req.body;
    try {
      const inventory = await Inventory.findById(req.params.id);
      if (!inventory) return res.status(404).json({ message: 'Item not found' });

      // Validate category if provided
      if (categoryId) {
        const category = await Category.findById(categoryId);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        inventory.categoryId = categoryId;
      }

      if (name) inventory.name = name;
      if (description) inventory.description = description;
      if (quantity !== undefined) inventory.quantity = quantity;
      if (unitPrice !== undefined) inventory.unitPrice = unitPrice;

      await inventory.save();
      res.json(inventory);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];

exports.deleteInventory = [
  restrictOperation('inventory_delete'),
  async (req, res) => {
    try {
      const inventory = await Inventory.findByIdAndDelete(req.params.id);
      if (!inventory) return res.status(404).json({ message: 'Item not found' });
      res.json({ message: 'Item deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];