const User = require('../models/User');
const Sale = require('../models/Sale');
const Commission = require('../models/Commission');
const Permission = require('../models/Permission');
const Inventory = require('../models/Inventory');
const Service = require('../models/Service');
const Banking = require('../models/Banking');
const Category = require('../models/Category');
const { restrictOperation } = require('../middleware/auth');

exports.getEmployeeDashboard = [
 // Ensure employee has permission to view dashboard
  async (req, res) => {
    try {
      const employeeId = req.user.id; // Get logged-in employee's ID
      const { startDate, endDate } = req.query;

      // Default to last 30 days if no date range provided
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      end.setHours(23, 59, 59, 999);

      // Helper function for date-based filtering
      const dateFilter = {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      };

      // 1. Employee Profile
      const employeeProfile = await User.findById(employeeId).select('name email role createdAt');

      // 2. Permissions
      const permissions = await Permission.findOne({ employeeId }).select('operations');
      const employeePermissions = permissions ? permissions.operations : [];

      // 3. Commission Metrics
      const commissionStats = await Commission.aggregate([
        { $match: { employeeId: employeeId } },
        dateFilter,
        {
          $facet: {
            totalCommissions: [{ $count: 'count' }],
            totalAmount: [
              {
                $group: {
                  _id: null,
                  total: { $sum: '$amount' },
                },
              },
            ],
            byStatus: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 },
                  amount: { $sum: '$amount' },
                },
              },
            ],
            recentCommissions: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: 'sales',
                  localField: 'saleId',
                  foreignField: '_id',
                  as: 'sale',
                },
              },
              { $unwind: '$sale' },
              {
                $project: {
                  amount: 1,
                  status: 1,
                  createdAt: 1,
                  'sale.type': 1,
                  'sale.finalPrice': 1,
                  'sale.quantity': 1,
                },
              },
            ],
          },
        },
      ]);

      const totalCommissions = commissionStats[0].totalCommissions[0]?.count || 0;
      const totalCommissionAmount = commissionStats[0].totalAmount[0]?.total || 0;
      const commissionsByStatus = commissionStats[0].byStatus.reduce(
        (acc, { _id, count, amount }) => ({
          ...acc,
          [_id]: { count, amount },
        }),
        { pending: { count: 0, amount: 0 }, paid: { count: 0, amount: 0 } }
      );
      const recentCommissions = commissionStats[0].recentCommissions;

      // 4. Sales Metrics (if employee has 'inventory_view' or 'service_view' permission)
      let salesStats = {};
      if (employeePermissions.includes('inventory_view') || employeePermissions.includes('service_view')) {
        const salesFilter = {
          $match: {
            employeeId: employeeId,
            createdAt: { $gte: start, $lte: end },
          },
        };
        if (!employeePermissions.includes('inventory_view')) {
          salesFilter.$match.type = 'service';
        } else if (!employeePermissions.includes('service_view')) {
          salesFilter.$match.type = 'inventory';
        }

        const salesData = await Sale.aggregate([
          salesFilter,
          {
            $facet: {
              totalSales: [{ $count: 'count' }],
              totalRevenue: [
                {
                  $group: {
                    _id: null,
                    total: { $sum: '$finalPrice' },
                  },
                },
              ],
              byType: [
                {
                  $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    revenue: { $sum: '$finalPrice' },
                  },
                },
              ],
              recentSales: [
                { $sort: { createdAt: -1 } },
                { $limit: 5 },
                {
                  $project: {
                    type: 1,
                    quantity: 1,
                    finalPrice: 1,
                    createdAt: 1,
                  },
                },
              ],
            },
          },
        ]);

        salesStats = {
          total: salesData[0].totalSales[0]?.count || 0,
          totalRevenue: salesData[0].totalRevenue[0]?.total || 0,
          byType: salesData[0].byType.reduce(
            (acc, { _id, count, revenue }) => ({
              ...acc,
              [_id]: { count, revenue },
            }),
            { inventory: { count: 0, revenue: 0 }, service: { count: 0, revenue: 0 } }
          ),
          recent: salesData[0].recentSales,
        };
      }

      // 5. Banking Transactions (if employee has 'banking_view' permission)
      let bankingStats = {};
      if (employeePermissions.includes('banking_view')) {
        const bankingData = await Banking.aggregate([
          { $match: { employeeId: employeeId } },
          dateFilter,
          {
            $facet: {
              totalTransactions: [{ $count: 'count' }],
              byType: [
                {
                  $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    totalProfit: { $sum: '$profit' },
                  },
                },
              ],
              recentTransactions: [
                { $sort: { createdAt: -1 } },
                { $limit: 5 },
                {
                  $project: {
                    type: 1,
                    amount: 1,
                    profit: 1,
                    paymentMethod: 1,
                    description: 1,
                    createdAt: 1,
                  },
                },
              ],
            },
          },
        ]);

        bankingStats = {
          total: bankingData[0].totalTransactions[0]?.count || 0,
          byType: bankingData[0].byType.reduce(
            (acc, { _id, count, totalAmount, totalProfit }) => ({
              ...acc,
              [_id]: { count, totalAmount, totalProfit },
            }),
            {
              deposit: { count: 0, totalAmount: 0, totalProfit: 0 },
              withdrawal: { count: 0, totalAmount: 0, totalProfit: 0 },
              borrowing: { count: 0, totalAmount: 0, totalProfit: 0 },
              ledger_transfer: { count: 0, totalAmount: 0, totalProfit: 0 },
            }
          ),
          recent: bankingData[0].recentTransactions,
        };
      }

      // 6. Inventory Metrics (if employee has 'inventory_view' permission)
      let inventoryStats = {};
      if (employeePermissions.includes('inventory_view')) {
        const inventoryData = await Inventory.aggregate([
          {
            $facet: {
              totalItems: [{ $count: 'count' }],
              lowStock: [
                { $match: { quantity: { $lte: 10 } } },
                { $count: 'count' },
              ],
              byCategory: [
                {
                  $group: {
                    _id: '$categoryId',
                    count: { $sum: 1 },
                    totalValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
                  },
                },
                {
                  $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category',
                  },
                },
                { $unwind: '$category' },
                {
                  $project: {
                    name: '$category.name',
                    count: 1,
                    totalValue: 1,
                  },
                },
              ],
            },
          },
        ]);

        inventoryStats = {
          total: inventoryData[0].totalItems[0]?.count || 0,
          lowStock: inventoryData[0].lowStock[0]?.count || 0,
          byCategory: inventoryData[0].byCategory,
        };
      }

      // 7. Service Metrics (if employee has 'service_view' permission)
      let serviceStats = {};
      if (employeePermissions.includes('service_view')) {
        const serviceData = await Service.aggregate([
          {
            $facet: {
              totalServices: [{ $count: 'count' }],
              totalRevenue: [
                {
                  $lookup: {
                    from: 'sales',
                    let: { serviceId: '$_id' },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ['$itemId', '$$serviceId'] },
                              { $eq: ['$type', 'service'] },
                              { $eq: ['$employeeId', employeeId] },
                              { $gte: ['$createdAt', start] },
                              { $lte: ['$createdAt', end] },
                            ],
                          },
                        },
                      },
                      {
                        $group: {
                          _id: null,
                          total: { $sum: '$finalPrice' },
                        },
                      },
                    ],
                    as: 'sales',
                  },
                },
                { $unwind: { path: '$sales', preserveNullAndEmptyArrays: true } },
                {
                  $group: {
                    _id: null,
                    total: { $sum: '$sales.total' },
                  },
                },
              ],
            },
          },
        ]);

        serviceStats = {
          total: serviceData[0].totalServices[0]?.count || 0,
          totalRevenue: serviceData[0].totalRevenue[0]?.total || 0,
        };
      }

      // Construct response
      const response = {
        profile: employeeProfile,
        permissions: employeePermissions,
        commissions: {
          total: totalCommissions,
          totalAmount: totalCommissionAmount,
          byStatus: commissionsByStatus,
          recent: recentCommissions,
        },
        sales: employeePermissions.includes('inventory_view') || employeePermissions.includes('service_view') ? salesStats : null,
        banking: employeePermissions.includes('banking_view') ? bankingStats : null,
        inventory: employeePermissions.includes('inventory_view') ? inventoryStats : null,
        services: employeePermissions.includes('service_view') ? serviceStats : null,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      };

      res.json(response);
    } catch (err) {
      console.error('Error fetching employee dashboard data:', err.stack);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },
];