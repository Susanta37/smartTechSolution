const Service = require('../models/Service');
const { restrictOperation } = require('../middleware/auth');

exports.createService = [
  restrictOperation('service_add'),
  async (req, res) => {
    const { name, description, price, photoUrl, inventoryItems } = req.body;
    try {
      const service = new Service({
        name,
        description,
        price,
        photoUrl,
        createdBy: req.user.id,
        inventoryItems: inventoryItems || [],
      });
      await service.save();
      res.status(201).json(service);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },
];


exports.getServices = [
  restrictOperation('service_view'),
  async (req, res) => {
    try {
      const services = await Service.find();
      res.json(services);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];

exports.updateService = [
  restrictOperation('service_update'),
  async (req, res) => {
    const { name, description, price, inventoryItems } = req.body;
    try {
      const service = await Service.findById(req.params.id);
      if (!service) return res.status(404).json({ message: 'Service not found' });
      if (name) service.name = name;
      if (description) service.description = description;
      if (price !== undefined) service.price = price;
      if (inventoryItems) service.inventoryItems = inventoryItems;
      await service.save();
      res.json(service);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];

exports.deleteService = [
  restrictOperation('service_delete'),
  async (req, res) => {
    try {
      const service = await Service.findByIdAndDelete(req.params.id);
      if (!service) return res.status(404).json({ message: 'Service not found' });
      res.json({ message: 'Service deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];