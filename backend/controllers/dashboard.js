const User = require('../models/User');
const Service = require('../models/Service');
const Sale = require('../models/Sale');
const Commission = require('../models/Commission');
const Permission = require('../models/Permission');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');
const Banking = require('../models/Banking');
const { restrictOperation } = require('../middleware/auth');

exports.getDashboard = [
  restrictOperation('dashboard_view'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Default to last 30 days if no date range provided
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      end.setHours(23, 59, 59, 999);

      // Helper function to create date-based aggregation pipeline
      const dateFilter = {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      };

      // 1. User Metrics
      const userStats = await User.aggregate([
        {
          $facet: {
            totalUsers: [{ $count: 'count' }],
            byRole: [
              {
                $group: {
                  _id: '$role',
                  count: { $sum: 1 },
                },
              },
            ],
            recentUsers: [
              dateFilter,
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $project: {
                  name: 1,
                  email: 1,
                  role: 1,
                  createdAt: 1,
                },
              },
            ],
          },
        },
      ]);

      const totalUsers = userStats[0].totalUsers[0]?.count || 0;
      const roleDistribution = userStats[0].byRole.reduce(
        (acc, { _id, count }) => ({ ...acc, [_id]: count }),
        { admin: 0, employee: 0 }
      );
      const recentUsers = userStats[0].recentUsers;

      // 2. Sales Metrics
      const salesStats = await Sale.aggregate([
        dateFilter,
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
            byDate: [
              {
                $group: {
                  _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                  },
                  count: { $sum: 1 },
                  revenue: { $sum: '$finalPrice' },
                },
              },
              { $sort: { _id: 1 } },
            ],
            recentSales: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: 'users',
                  localField: 'employeeId',
                  foreignField: '_id',
                  as: 'employee',
                },
              },
              { $unwind: '$employee' },
              {
                $project: {
                  type: 1,
                  quantity: 1,
                  finalPrice: 1,
                  createdAt: 1,
                  'employee.name': 1,
                },
              },
            ],
          },
        },
      ]);

      const totalSales = salesStats[0].totalSales[0]?.count || 0;
      const totalRevenue = salesStats[0].totalRevenue[0]?.total || 0;
      const salesByType = salesStats[0].byType.reduce(
        (acc, { _id, count, revenue }) => ({
          ...acc,
          [_id]: { count, revenue },
        }),
        { inventory: { count: 0, revenue: 0 }, service: { count: 0, revenue: 0 } }
      );
      const salesTrend = salesStats[0].byDate;
      const recentSales = salesStats[0].recentSales;

      // 3. Commission Metrics
      const commissionStats = await Commission.aggregate([
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
            topEarners: [
              {
                $group: {
                  _id: '$employeeId',
                  totalAmount: { $sum: '$amount' },
                  count: { $sum: 1 },
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'employee',
                },
              },
              { $unwind: '$employee' },
              { $sort: { totalAmount: -1 } },
              { $limit: 5 },
              {
                $project: {
                  name: '$employee.name',
                  email: '$employee.email',
                  totalAmount: 1,
                  count: 1,
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
      const topEarners = commissionStats[0].topEarners;

      // 4. Inventory Metrics
      const inventoryStats = await Inventory.aggregate([
        {
          $facet: {
            totalItems: [{ $count: 'count' }],
            lowStock: [
              { $match: { quantity: { $lte: 10 } } }, // Threshold for low stock
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

      const totalInventoryItems = inventoryStats[0].totalItems[0]?.count || 0;
      const lowStockItems = inventoryStats[0].lowStock[0]?.count || 0;
      const inventoryByCategory = inventoryStats[0].byCategory;

      // 5. Service Metrics
      const serviceStats = await Service.aggregate([
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

      const totalServices = serviceStats[0].totalServices[0]?.count || 0;
      const serviceRevenue = serviceStats[0].totalRevenue[0]?.total || 0;

      // 6. Banking Metrics
      const bankingStats = await Banking.aggregate([
        {
          $facet: {
            latestBalances: [
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
              {
                $project: {
                  cashBalance: 1,
                  ledgerBalance: 1,
                  onlineWalletBalance: 1,
                  mainBalance: 1,
                },
              },
            ],
            transactionSummary: [
              dateFilter,
              {
                $group: {
                  _id: '$type',
                  count: { $sum: 1 },
                  totalAmount: { $sum: '$amount' },
                  totalProfit: { $sum: '$profit' },
                },
              },
            ],
            profitTrend: [
              dateFilter,
              {
                $group: {
                  _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                  },
                  profit: { $sum: '$profit' },
                },
              },
              { $sort: { _id: 1 } },
            ],
            recentTransactions: [
              dateFilter,
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: 'users',
                  localField: 'employeeId',
                  foreignField: '_id',
                  as: 'employee',
                },
              },
              {
                $project: {
                  type: 1,
                  amount: 1,
                  profit: 1,
                  paymentMethod: 1,
                  description: 1,
                  createdAt: 1,
                  employeeName: { $arrayElemAt: ['$employee.name', 0] },
                },
              },
            ],
          },
        },
      ]);

      const balances = bankingStats[0].latestBalances[0] || {
        cashBalance: 0,
        ledgerBalance: 0,
        onlineWalletBalance: 0,
        mainBalance: 0,
      };
      const transactionSummary = bankingStats[0].transactionSummary.reduce(
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
      );
      const profitTrend = bankingStats[0].profitTrend;
      const recentTransactions = bankingStats[0].recentTransactions;

      // 7. Permission Metrics
      const permissionStats = await Permission.aggregate([
        {
          $facet: {
            totalPermissions: [{ $count: 'count' }],
            operationDistribution: [
              { $unwind: '$operations' },
              {
                $group: {
                  _id: '$operations',
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]);

      const totalPermissions = permissionStats[0].totalPermissions[0]?.count || 0;
      const operationDistribution = permissionStats[0].operationDistribution.reduce(
        (acc, { _id, count }) => ({ ...acc, [_id]: count }),
        {}
      );

      // Construct response
      const response = {
        users: {
          total: totalUsers,
          roleDistribution,
          recent: recentUsers,
        },
        sales: {
          total: totalSales,
          totalRevenue,
          byType: salesByType,
          trend: salesTrend,
          recent: recentSales,
        },
        commissions: {
          total: totalCommissions,
          totalAmount: totalCommissionAmount,
          byStatus: commissionsByStatus,
          topEarners,
        },
        inventory: {
          total: totalInventoryItems,
          lowStock: lowStockItems,
          byCategory: inventoryByCategory,
        },
        services: {
          total: totalServices,
          totalRevenue: serviceRevenue,
        },
        banking: {
          balances,
          transactionSummary,
          profitTrend,
          recent: recentTransactions,
        },
        permissions: {
          total: totalPermissions,
          operationDistribution,
        },
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      };

      res.json(response);
    } catch (err) {
      console.error('Error fetching dashboard data:', err.stack);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },
];