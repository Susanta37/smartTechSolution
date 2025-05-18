const Category = require('../models/Category');
const Inventory = require('../models/Inventory');
const { auth, restrictTo } = require('../middleware/auth');

exports.createCategory = [
  auth,
  restrictTo('admin'),
  async (req, res) => {
    const { name, description,photoUrl } = req.body;
    try {
      let category = await Category.findOne({ name });
      if (category) return res.status(400).json({ message: 'Category already exists' });

      category = new Category({
        name,
        description,
        photoUrl,
        createdBy: req.user.id,
      });
      await category.save();
      res.status(201).json(category);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];

exports.getCategories = [
  auth,
  async (req, res) => {
    try {
      const categories = await Category.find();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];

exports.updateCategory = [
  auth,
  restrictTo('admin'),
  async (req, res) => {
    const { name, description,photoUrl } = req.body;
    try {
      const category = await Category.findById(req.params.id);
      if (!category) return res.status(404).json({ message: 'Category not found' });

      if (name) {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory && existingCategory._id.toString() !== category._id.toString()) {
          return res.status(400).json({ message: 'Category name already exists' });
        }
        category.name = name;
      }
      if (description) category.description = description;
      if (photoUrl) category.photoUrl = photoUrl;

      await category.save();
      res.json(category);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];

exports.deleteCategory = [
  auth,
  restrictTo('admin'),
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) return res.status(404).json({ message: 'Category not found' });

      // Check if category is used in inventory
      const inventory = await Inventory.findOne({ categoryId: category._id });
      if (inventory) {
        return res.status(400).json({ message: 'Cannot delete category used in inventory' });
      }

      await Category.deleteOne({ _id: req.params.id });
      res.json({ message: 'Category deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Server error',err});
    }
  },
];