"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Briefcase,
  CreditCard,
  Calendar,
  TrendingUp,
  User,
  Award,
  ArrowUp,
  ArrowDown,
  Repeat,
  PieChartIcon,
  BarChart2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";

// Color palette
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
const STATUS_COLORS = {
  Completed: "bg-green-600 text-green-100",
  Pending: "bg-yellow-600 text-yellow-100",
  "In Progress": "bg-blue-600 text-blue-100",
};

const Dashboard = () => {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const toastId = toast.loading(t('loading'));
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error(t('no_token'));

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/dashboard?startDate=${dateRange.start}&endDate=${dateRange.end}`,
          {
            headers: { "x-auth-token": token },
          }
        );

        setDashboardData(response.data);
        toast.success(t('success'), { id: toastId });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        const errorMessage = err.response?.data?.message || t('error');
        toast.error(errorMessage, { id: toastId });
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange, t]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "MMM dd, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Prepare data for charts
  const prepareUserRoleData = () => {
    if (!dashboardData) return [];
    const { roleDistribution } = dashboardData.users;
    return [
      { name: t('admins'), value: roleDistribution.admin },
      { name: t('employees'), value: roleDistribution.employee },
    ];
  };

  const prepareSalesByTypeData = () => {
    if (!dashboardData) return [];
    const { byType } = dashboardData.sales;
    return [
      { name: t('inventory'), value: byType.inventory.revenue },
      { name: t('service'), value: byType.service.revenue },
    ];
  };

  const prepareCommissionStatusData = () => {
    if (!dashboardData) return [];
    const { byStatus } = dashboardData.commissions;
    return [
      { name: t('pending'), value: byStatus.pending.amount },
      { name: t('paid'), value: byStatus.paid.amount },
    ];
  };

  const prepareInventoryCategoryData = () => {
    if (!dashboardData) return [];
    return dashboardData.inventory.byCategory.map((category) => ({
      name: category.name,
      value: category.totalValue,
    }));
  };

  const prepareBankingTransactionData = () => {
    if (!dashboardData) return [];
    const { transactionSummary } = dashboardData.banking;
    return [
      { name: t('deposits'), value: transactionSummary.deposit.totalAmount },
      { name: t('withdrawals'), value: transactionSummary.withdrawal.totalAmount },
      { name: t('ledger_transfers'), value: transactionSummary.ledger_transfer.totalAmount },
      { name: t('borrowing'), value: transactionSummary.borrowing.totalAmount },
    ];
  };

  const prepareBankingProfitData = () => {
    if (!dashboardData) return [];
    const { transactionSummary } = dashboardData.banking;
    return [
      { name: t('deposits'), value: transactionSummary.deposit.totalProfit },
      { name: t('withdrawals'), value: transactionSummary.withdrawal.totalProfit },
      { name: t('ledger_transfers'), value: transactionSummary.ledger_transfer.totalProfit },
      { name: t('borrowing'), value: transactionSummary.borrowing.totalProfit },
    ];
  };

  const prepareSalesTrendData = () => {
    if (!dashboardData) return [];
    return dashboardData.sales.trend.map((item) => ({
      date: item._id,
      revenue: item.revenue,
      count: item.count,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 dark:bg-gray-900">
        <div className="bg-red-800 border border-red-600 text-red-100 px-6 py-4 rounded-lg shadow-lg" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Toaster position="top-right" toastOptions={{ className: 'bg-gray-800 text-gray-100 dark:bg-gray-700 dark:text-gray-200' }} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Selector */}
        <div className="mb-8 bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h2 className="text-xl font-semibold text-gray-100">{t('title')}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="start-date" className="text-sm font-medium text-gray-300">
                  {t('from')}:
                </label>
                <input
                  type="date"
                  id="start-date"
                  name="start"
                  value={dateRange.start}
                  onChange={handleDateChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 bg-gray-700 text-gray-100 rounded-md transition-colors duration-200"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="end-date" className="text-sm font-medium text-gray-300">
                  {t('to')}:
                </label>
                <input
                  type="date"
                  id="end-date"
                  name="end"
                  value={dateRange.end}
                  onChange={handleDateChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 bg-gray-700 text-gray-100 rounded-md transition-colors duration-200"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t('apply')}
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-600 rounded-md p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400">{t('total_users')}</dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-100">{dashboardData.users.total}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-700 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-blue-400 hover:text-blue-300">
                  {dashboardData.users.roleDistribution.admin} {t('admins')}, {dashboardData.users.roleDistribution.employee} {t('employees')}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-600 rounded-md p-3">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400">{t('total_sales')}</dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-100">{dashboardData.sales.total}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-700 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-green-400 hover:text-green-300">
                  {t('revenue')}: {formatCurrency(dashboardData.sales.totalRevenue)}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-600 rounded-md p-3">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400">{t('total_commissions')}</dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-100">{dashboardData.commissions.total}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-700 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-yellow-400 hover:text-yellow-300">
                  {t('amount')}: {formatCurrency(dashboardData.commissions.totalAmount)}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-600 rounded-md p-3">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400">{t('inventory_items')}</dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-100">{dashboardData.inventory.total}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-700 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-purple-400 hover:text-purple-300">
                  {t('low_stock')}: {dashboardData.inventory.lowStock}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Banking Overview */}
        <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-100 mb-6">{t('banking_overview')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-900 rounded-lg p-4 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-400">{t('main_balance')}</p>
                  <p className="text-xl font-semibold text-gray-100">{formatCurrency(dashboardData.banking.balances.mainBalance)}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-900 rounded-lg p-4 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-400">{t('cash_balance')}</p>
                  <p className="text-xl font-semibold text-gray-100">{formatCurrency(dashboardData.banking.balances.cashBalance)}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-900 rounded-lg p-4 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-400">{t('ledger_balance')}</p>
                  <p className="text-xl font-semibold text-gray-100">{formatCurrency(dashboardData.banking.balances.ledgerBalance)}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-900 rounded-lg p-4 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-400">{t('online_wallet')}</p>
                  <p className="text-xl font-semibold text-gray-100">{formatCurrency(dashboardData.banking.balances.onlineWalletBalance)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg p-6 transform hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">{t('sales_trend')}</h2>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-400 mr-1" />
                <span className="text-sm font-medium text-green-400">
                  {formatCurrency(dashboardData.sales.totalRevenue)} {t('total')}
                </span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareSalesTrendData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? formatCurrency(value) : value,
                      name === "revenue" ? t('revenue') : t('count'),
                    ]}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#F3F4F6', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    activeDot={{ r: 8 }}
                    name={t('revenue')}
                    strokeWidth={2}
                  />
                  <Line type="monotone" dataKey="count" stroke="#10B981" name={t('count')} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg p-6 transform hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">{t('sales_by_type')}</h2>
              <div className="flex items-center">
                <PieChartIcon className="h-5 w-5 text-blue-400 mr-1" />
                <span className="text-sm font-medium text-blue-400">{t('revenue_distribution')}</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prepareSalesByTypeData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {prepareSalesByTypeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#F3F4F6', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg p-6 transform hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">{t('user_role_distribution')}</h2>
              <div className="flex items-center">
                <User className="h-5 w-5 text-indigo-400 mr-1" />
                <span className="text-sm font-medium text-indigo-400">{dashboardData.users.total} {t('total_users')}</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prepareUserRoleData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {prepareUserRoleData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#F3F4F6', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg p-6 transform hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">{t('commission_status')}</h2>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-yellow-400 mr-1" />
                <span className="text-sm font-medium text-yellow-400">
                  {formatCurrency(dashboardData.commissions.totalAmount)} {t('total')}
                </span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prepareCommissionStatusData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {prepareCommissionStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#F3F4F6', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg p-6 transform hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">{t('banking_transactions')}</h2>
              <div className="flex items-center">
                <BarChart2 className="h-5 w-5 text-blue-400 mr-1" />
                <span className="text-sm font-medium text-blue-400">{t('transaction_summary')}</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepareBankingTransactionData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#F3F4F6', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="value" name={t('amount')}>
                    {prepareBankingTransactionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg p-6 transform hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">{t('banking_profit')}</h2>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-400 mr-1" />
                <span className="text-sm font-medium text-green-400">{t('profit_by_transaction_type')}</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepareBankingProfitData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#F3F4F6', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="value" name={t('profit')}>
                    {prepareBankingProfitData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value >= 0 ? COLORS[index % COLORS.length] : "#EF4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activities Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-100">{t('recent_sales')}</h2>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-600 text-green-100">
                  {dashboardData.sales.total} {t('total')}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 dark:divide-gray-700">
                <thead className="bg-gray-700 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('type')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('quantity')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('price')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('date')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 dark:bg-gray-800 divide-y divide-gray-700 dark:divide-gray-700">
                  {dashboardData.sales.recent.map((sale) => (
                    <tr key={sale._id} className="hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {sale.type === "inventory" ? (
                            <Package className="h-5 w-5 text-purple-400 mr-2" />
                          ) : (
                            <Briefcase className="h-5 w-5 text-blue-400 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-100 capitalize">{sale.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{sale.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{formatCurrency(sale.finalPrice)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(sale.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-700 dark:border-gray-700">
              <a href="#" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center justify-center transition-colors duration-200">
                {t('view_all_sales')}
                <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-100">{t('recent_banking_transactions')}</h2>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-600 text-blue-100">
                  {dashboardData.banking.recent.length} {t('recent')}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 dark:divide-gray-700">
                <thead className="bg-gray-700 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('type')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('amount')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('profit')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('date')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 dark:bg-gray-800 divide-y divide-gray-700 dark:divide-gray-700">
                  {dashboardData.banking.recent.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {transaction.type === "deposit" ? (
                            <ArrowDown className="h-5 w-5 text-green-400 mr-2" />
                          ) : transaction.type === "withdrawal" ? (
                            <ArrowUp className="h-5 w-5 text-red-400 mr-2" />
                          ) : (
                            <Repeat className="h-5 w-5 text-blue-400 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-100 capitalize">{transaction.type.replace("_", " ")}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{formatCurrency(transaction.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.profit >= 0 ? "bg-green-600 text-green-100" : "bg-red-600 text-red-100"
                          }`}
                        >
                          {transaction.profit >= 0 ? "+" : ""}{formatCurrency(transaction.profit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(transaction.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-700 dark:border-gray-700">
              <a href="#" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center justify-center transition-colors duration-200">
                {t('view_all_transactions')}
                <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-100">{t('recent_users')}</h2>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-600 text-indigo-100">
                  {dashboardData.users.total} {t('total')}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 dark:divide-gray-700">
                <thead className="bg-gray-700 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('name')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('email')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('role')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('joined')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 dark:bg-gray-800 divide-y divide-gray-700 dark:divide-gray-700">
                  {dashboardData.users.recent.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-100">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === "admin" ? "bg-purple-600 text-purple-100" : "bg-blue-600 text-blue-100"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-700 dark:border-gray-700">
              <a href="#" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center justify-center transition-colors duration-200">
                {t('view_all_users')}
                <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-100">{t('top_commission_earners')}</h2>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-600 text-yellow-100">
                  {formatCurrency(dashboardData.commissions.totalAmount)} {t('total')}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 dark:divide-gray-700">
                <thead className="bg-gray-700 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('employee')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('email')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('commissions')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('amount')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 dark:bg-gray-800 divide-y divide-gray-700 dark:divide-gray-700">
                  {dashboardData.commissions.topEarners.map((earner) => (
                    <tr key={earner._id} className="hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-900 flex items-center justify-center">
                            <Award className="h-6 w-6 text-yellow-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-100">{earner.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{earner.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{earner.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{formatCurrency(earner.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-700 dark:border-gray-700">
              <a href="#" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center justify-center transition-colors duration-200">
                {t('view_all_commissions')}
                <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;