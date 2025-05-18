const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const Service = require('../models/Service');
const Commission = require('../models/Commission');
const { restrictOperation } = require('../middleware/auth');

exports.createSale = [
  restrictOperation('inventory_sale', 'service_sale'),
  async (req, res) => {
    const { type, itemId, quantity, discount } = req.body;
    try {
      let item, totalPrice, commissionRate = 0.05; 

      if (type === 'inventory') {
        item = await Inventory.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });
        if (item.quantity < quantity) return res.status(400).json({ message: 'Insufficient stock' });
        totalPrice = item.unitPrice * quantity;
        item.quantity -= quantity; 
        await item.save();
      } else if (type === 'service') {
        // Fetch service and validate availability
        item = await Service.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Service not found' });
        totalPrice = item.price * quantity;

        // Deduct inventory items used in the service (if any)
        if (item.inventoryItems && item.inventoryItems.length > 0) {
          for (let invItem of item.inventoryItems) {
            const inventory = await Inventory.findById(invItem.inventoryId);
            if (!inventory) {
              return res.status(404).json({ message: `Inventory item ${invItem.inventoryId} not found` });
            }
            if (inventory.quantity < invItem.quantity * quantity) {
              return res.status(400).json({ message: `Insufficient stock for ${inventory.name}` });
            }
            inventory.quantity -= invItem.quantity * quantity;
            await inventory.save();
          }
        }
      } else {
        return res.status(400).json({ message: 'Invalid sale type' });
      }

      // Calculate final price and commission
      const finalPrice = totalPrice - (discount || 0);
      if (finalPrice < 0) {
        return res.status(400).json({ message: 'Final price cannot be negative' });
      }
      const commission = finalPrice * commissionRate;

      // Create sale record
      const sale = new Sale({
        type,
        itemId,
        quantity,
        totalPrice,
        discount: discount || 0,
        finalPrice,
        employeeId: req.user.id,
        commission,
      });
      await sale.save();

      // Record commission
      const commissionRecord = new Commission({
        employeeId: req.user.id,
        saleId: sale._id,
        amount: commission,
      });
      await commissionRecord.save();

      res.status(201).json(sale);
    } catch (err) {
      console.error('Error in createSale:', err.stack); 
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },
];

exports.getSales = [
  restrictOperation('inventory_view', 'service_view'),
  async (req, res) => {
    try {
      const sales = await Sale.find();
      res.json(sales);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },
];