const Commission = require('../models/Commission');
const { restrictOperation } = require('../middleware/auth');

exports.getCommissions = [
  restrictOperation('commission_view'),
  async (req, res) => {
    const {
      startDate,
      endDate,
      status,
      saleId,
      minAmount,
      maxAmount,
      type,
      employeeId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    try {
      let query = {};

      // Restrict to employee's own commissions unless user is admin
      if (!req.user.isAdmin) {
        query.employeeId = req.user.id;
      } else if (employeeId) {
        query.employeeId = employeeId;
      }

      // Date range filter
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        };
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // Sale ID filter
      if (saleId) {
        query.saleId = saleId;
      }

      // Amount range filter
      if (minAmount || maxAmount) {
        query.amount = {};
        if (minAmount) query.amount.$gte = Number(minAmount);
        if (maxAmount) query.amount.$lte = Number(maxAmount);
      }

      // Sale type filter (inventory or service)
      if (type) {
        query['saleId.type'] = type;
      }

      // Pagination
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Sorting
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with population for both saleId and employeeId
      const commissions = await Commission.find(query)
        .populate({
          path: 'saleId',
          select: 'type itemId quantity totalPrice discount finalPrice commission createdAt',
        })
        .populate({
          path: 'employeeId',
          select: 'name email', // Adjust fields based on your User model
        })
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Get total count for pagination
      const total = await Commission.countDocuments(query);

      // Calculate total commission amount
      const totalAmount = commissions.reduce((sum, commission) => sum + commission.amount, 0);

      res.json({
        commissions,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalAmount,
      });
    } catch (err) {
      console.error('Error fetching commissions:', err);
      res.status(500).json({ message: 'Failed to fetch commissions' });
    }
  },
];

exports.payCommissions = [
  restrictOperation('commission_pay'),
  async (req, res) => {
    const { commissionIds, startDate, endDate, minAmount, maxAmount } = req.body;

    try {
      let query = { status: 'pending' };

      // Restrict to employee's own commissions unless user is admin
      if (!req.user.isAdmin) {
        query.employeeId = req.user.id;
      }

      // Filter by commission IDs if provided
      if (commissionIds && Array.isArray(commissionIds) && commissionIds.length > 0) {
        query._id = { $in: commissionIds };
      }

      // Date range filter
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        };
      }

      // Amount range filter
      if (minAmount || maxAmount) {
        query.amount = {};
        if (minAmount) query.amount.$gte = Number(minAmount);
        if (maxAmount) query.amount.$lte = Number(maxAmount);
      }

      // Find eligible commissions
      const commissions = await Commission.find(query);
      if (!commissions.length) {
        return res.status(404).json({ message: 'No eligible pending commissions found' });
      }

      // Update commissions to paid
      const paidCommissions = [];
      let totalPaidAmount = 0;

      for (let commission of commissions) {
        commission.status = 'paid';
        commission.paidOn = new Date();
        await commission.save();
        paidCommissions.push({
          _id: commission._id,
          amount: commission.amount,
          saleId: commission.saleId,
          paidOn: commission.paidOn,
        });
        totalPaidAmount += commission.amount;
      }

      res.json({
        message: 'Commissions paid successfully',
        paidCommissions,
        totalPaidAmount,
        count: paidCommissions.length,
      });
    } catch (err) {
      console.error('Error paying commissions:', err);
      res.status(500).json({ message: 'Failed to pay commissions' });
    }
  },
];