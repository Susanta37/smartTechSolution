import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { toast } from "react-hot-toast";
import Papa from "papaparse";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "react-qr-code";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanknoteIcon,
  CalendarIcon,
  ChevronDownIcon,
  CreditCardIcon,
  DownloadIcon,
  IndianRupeeIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  WalletIcon,
  ArrowRightIcon,
  EyeIcon,
} from "lucide-react";

export default function BankingPage() {
  const { t } = useTranslation();
  // State
  const [transactions, setTransactions] = useState([]);
  const [currentBalances, setCurrentBalances] = useState({
    cashBalance: 0,
    ledgerBalance: 0,
    onlineWalletBalance: 0,
    mainBalance: 0,
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterType, setFilterType] = useState("all");
  const [showReceipt, setShowReceipt] = useState(null); // For receipt modal
  const receiptRef = useRef(); // Reference for receipt PDF generation
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: "deposit",
      amount: "", 
      userId: "",
      description: "",
      charge: undefined,
      paymentMethod: "online",
    },
  });

  const watchType = watch("type");
  const watchAmount = watch("amount");
  const watchPaymentMethod = watch("paymentMethod");
  const watchCharge = watch("charge");

  // Calculate charge
  const calculateCharge = () => {
    if (watchType === "borrowing") return 0;
    if (watchType === "ledger_transfer") return watchCharge !== undefined ? watchCharge : -5;
    if (watchCharge !== undefined) return watchCharge;
    return (watchAmount / 1000) * 10; // 1% per 1000
  };

  const charge = calculateCharge();

  // Fetch users and transactions
  useEffect(() => {
    fetchData();
  }, [t]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      // Fetch users
      const usersResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users`,
        {
          headers: { "x-auth-token": token },
        }
      );
      setUsers(usersResponse.data || []);

      // Fetch transactions
      const transactionsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/banking`,
        {
          headers: { "x-auth-token": token },
        }
      );
      setTransactions(transactionsResponse.data || []);

      // Set current balances from the latest transaction
      if (transactionsResponse.data.length > 0) {
        const latest = transactionsResponse.data[0];
        setCurrentBalances({
          cashBalance: latest.cashBalance,
          ledgerBalance: latest.ledgerBalance,
          onlineWalletBalance: latest.onlineWalletBalance,
          mainBalance: latest.mainBalance,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(t("errorFetchingData"));
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    setLoadingTransactions(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      // Client-side validation
      if (!data.amount || data.amount <= 0) {
        toast.error(t("amountPositive"));
        return;
      }

      if (data.type === "borrowing" && !data.userId) {
        toast.error(t("userRequired"));
        return;
      }

      if (
        data.type === "withdrawal" &&
        !["paynearby", "online"].includes(data.paymentMethod)
      ) {
        toast.error(t("invalidPaymentMethod"));
        return;
      }

      if (data.type === "ledger_transfer" && data.amount < 5) {
        toast.error(t("amountMin5"));
        return;
      }

      if (data.type !== "withdrawal") {
        data.paymentMethod = null;
      }

      if (data.type !== "borrowing") {
        data.userId = null;
      }

      if (data.charge !== undefined && data.charge < 0 && data.type !== "ledger_transfer") {
        toast.error(t("chargeNonNegative"));
        return;
      }

      // Balance validation
      let newCashBalance = currentBalances.cashBalance;
      let newLedgerBalance = currentBalances.ledgerBalance;
      let newOnlineWalletBalance = currentBalances.onlineWalletBalance;

      if (data.type === "deposit") {
        if (newOnlineWalletBalance < data.amount) {
          toast.error(t("insufficientOnlineWallet"));
          return;
        }
        newCashBalance += data.amount + charge;
        newOnlineWalletBalance -= data.amount;
      } else if (data.type === "withdrawal") {
        const projectedCashBalance = newCashBalance - data.amount + charge;
        if (projectedCashBalance < 0) {
          toast.error(t("insufficientCashBalance"));
          return;
        }
        newCashBalance = projectedCashBalance;
        if (data.paymentMethod === "paynearby") {
          newLedgerBalance += data.amount;
        } else if (data.paymentMethod === "online") {
          newOnlineWalletBalance += data.amount;
        }
      } else if (data.type === "borrowing") {
        if (newCashBalance < data.amount) {
          toast.error(t("insufficientCashBalanceBorrowing"));
          return;
        }
        newCashBalance -= data.amount;
      } else if (data.type === "ledger_transfer") {
        if (newLedgerBalance < data.amount) {
          toast.error(t("insufficientLedgerBalance"));
          return;
        }
        newLedgerBalance -= data.amount;
        newOnlineWalletBalance += data.amount + charge;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/banking`,
        {
          ...data,
          charge: charge,
          employeeId: data.userId, // Map userId to employeeId for backend
        },
        {
          headers: { "x-auth-token": token },
        }
      );

      setTransactions([response.data, ...transactions]);
      setCurrentBalances({
        cashBalance: response.data.cashBalance,
        ledgerBalance: response.data.ledgerBalance,
        onlineWalletBalance: response.data.onlineWalletBalance,
        mainBalance: response.data.mainBalance,
      });

      // Show receipt
      setShowReceipt(response.data);

      toast.success(t("transactionCreated"));
      reset({ type: "deposit", amount: "", userId: "", description: "", charge: undefined, paymentMethod: "online" });
      setShowForm(false);
    } catch (error) {
      console.error("Error creating transaction:", error);
      const errorMessage =
        error.response?.data?.message || t("transactionCreateFailed");
      toast.error(errorMessage);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Generate and download receipt as PDF
  const downloadReceipt = async () => {
    const element = receiptRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 190; // A4 width in mm minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save(`receipt_${showReceipt._id}.pdf`);
  };

  // Export transactions as CSV
  const exportTransactions = () => {
    const csvData = filteredTransactions.map((transaction) => ({
      Type: transaction.type,
      Amount: transaction.amount,
      Charge: transaction.charge,
      Profit: transaction.profit,
      PaymentMethod: transaction.paymentMethod || "-",
      User: transaction.employeeId?.name || "-",
      Description: transaction.description || "-",
      CashBalance: transaction.cashBalance,
      LedgerBalance: transaction.ledgerBalance,
      OnlineWalletBalance: transaction.onlineWalletBalance,
      MainBalance: transaction.mainBalance,
      Date: formatDate(transaction.createdAt),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString()}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter((transaction) => {
      if (filterType !== "all" && transaction.type !== filterType) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.type.toLowerCase().includes(searchLower) ||
          transaction.description.toLowerCase().includes(searchLower) ||
          transaction.amount.toString().includes(searchLower) ||
          (transaction.employeeId?.name || "").toLowerCase().includes(searchLower)
        );
      }
      if (dateRange.startDate && dateRange.endDate) {
        const transactionDate = new Date(transaction.createdAt);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        return transactionDate >= startDate && transactionDate <= endDate;
      }
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortField === "createdAt") {
        return sortDirection === "asc"
          ? new Date(aValue).getTime() - new Date(bValue).getTime()
          : new Date(bValue).getTime() - new Date(aValue).getTime();
      }
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(bValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      if (aValue && bValue && typeof aValue === "object" && typeof bValue === "object") {
        const aName = aValue.name || "";
        const bName = bValue.name || "";
        return sortDirection === "asc"
          ? aName.localeCompare(bName)
          : bName.localeCompare(bName);
      }
      return 0;
    });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Toggle sort
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setDateRange({ startDate: "", endDate: "" });
    setFilterType("all");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
          {t("bankingManagement")}
        </h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("cashBalance")}
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                  {formatCurrency(currentBalances.cashBalance)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <BanknoteIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("ledgerBalance")}
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                  {formatCurrency(currentBalances.ledgerBalance)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <CreditCardIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("onlineWalletBalance")}
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                  {formatCurrency(currentBalances.onlineWalletBalance)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                <WalletIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("mainBalance")}
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                  {formatCurrency(currentBalances.mainBalance)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                <IndianRupeeIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* New Transaction Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
          >
            {showForm ? (
              <>
                <ChevronDownIcon className="mr-2 h-5 w-5" />
                {t("hideTransactionForm")}
              </>
            ) : (
              <>
                <PlusIcon className="mr-2 h-5 w-5" />
                {t("newTransaction")}
              </>
            )}
          </button>
        </div>

        {/* Transaction Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
              {t("createTransaction")}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("transactionType")}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      type="button"
                      className={`flex items-center justify-center p-3 rounded-lg border ${
                        watchType === "deposit"
                          ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-400 dark:text-green-300"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setValue("type", "deposit")}
                    >
                      <ArrowDownIcon className="w-5 h-5 mr-2" />
                      <span>{t("deposit")}</span>
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center p-3 rounded-lg border ${
                        watchType === "withdrawal"
                          ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setValue("type", "withdrawal")}
                    >
                      <ArrowUpIcon className="w-5 h-5 mr-2" />
                      <span>{t("withdrawal")}</span>
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center p-3 rounded-lg border ${
                        watchType === "borrowing"
                          ? "bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/20 dark:border-purple-400 dark:text-purple-300"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setValue("type", "borrowing")}
                    >
                      <BanknoteIcon className="w-5 h-5 mr-2" />
                      <span>{t("borrowing")}</span>
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center p-3 rounded-lg border ${
                        watchType === "ledger_transfer"
                          ? "bg-yellow-50 border-yellow-500 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-400 dark:text-yellow-300"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setValue("type", "ledger_transfer")}
                    >
                      <ArrowRightIcon className="w-5 h-5 mr-2" />
                      <span>{t("ledgerTransfer")}</span>
                    </button>
                  </div>
                  <input type="hidden" {...register("type")} />
                </div>

                {/* Amount */}
                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t("amount")} (₹)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IndianRupeeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="amount"
                      type="number"
                      min="1"
                      step="1"
                      placeholder={t("enterAmount")} // Added placeholder
                      {...register("amount", {
                        required: t("amountRequired"),
                        min: {
                          value: watchType === "ledger_transfer" ? 5 : 1,
                          message:
                            watchType === "ledger_transfer"
                              ? t("amountMin5")
                              : t("amountPositive"),
                        },
                        valueAsNumber: true,
                      })}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.amount.message}
                    </p>
                  )}
                </div>

                {/* Payment Method (for withdrawals) */}
                {watchType === "withdrawal" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("paymentMethod")}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        className={`flex items-center justify-center p-3 rounded-lg border ${
                          watchPaymentMethod === "paynearby"
                            ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                        onClick={() => setValue("paymentMethod", "paynearby")}
                      >
                        <CreditCardIcon className="w-5 h-5 mr-2" />
                        <span>{t("paynearby")}</span>
                      </button>
                      <button
                        type="button"
                        className={`flex items-center justify-center p-3 rounded-lg border ${
                          watchPaymentMethod === "online"
                            ? "bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/20 dark:border-purple-400 dark:text-purple-300"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                        onClick={() => setValue("paymentMethod", "online")}
                      >
                        <WalletIcon className="w-5 h-5 mr-2" />
                        <span>{t("online")}</span>
                      </button>
                    </div>
                    <input type="hidden" {...register("paymentMethod")} />
                  </div>
                )}

                {/* User (for borrowing) */}
                {watchType === "borrowing" && (
                  <div>
                    <label
                      htmlFor="userId"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {t("user")}
                    </label>
                    <select
                      id="userId"
                      {...register("userId", {
                        required: watchType === "borrowing" ? t("userRequired") : false,
                      })}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">{t("selectUser")}</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    {errors.userId && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.userId.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Custom Charge */}
                {watchType !== "borrowing" && (
                  <div>
                    <label
                      htmlFor="charge"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {t("customCharge")} (₹) <span className="text-gray-500 text-xs">({t("optional")})</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IndianRupeeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="charge"
                        type="number"
                        step="1"
                        {...register("charge", {
                          min:
                            watchType === "ledger_transfer"
                              ? { value: -5, message: t("chargeMinNegative5") }
                              : { value: 0, message: t("chargeNonNegative") },
                          valueAsNumber: true,
                        })}
                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder={
                          watchType === "ledger_transfer"
                            ? t("default") + ": ₹-5"
                            : `${t("default")}: ₹${(watchAmount / 1000) * 10 || 0}`
                        }
                      />
                    </div>
                    {errors.charge && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.charge.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {watchType === "ledger_transfer"
                        ? t("ledgerTransferChargeInfo")
                        : t("defaultChargeInfo")}
                    </p>
                  </div>
                )}

                {/* Description */}
                <div
                  className={
                    watchType === "borrowing" || watchType === "withdrawal"
                      ? "md:col-span-2"
                      : ""
                  }
                >
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t("description")}
                  </label>
                  <textarea
                    id="description"
                    {...register("description")}
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder={t("enterDescription")}
                  ></textarea>
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                <h3 className="font-medium text-gray-800 dark:text-white">{t("transactionSummary")}</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t("type")}:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                    {t(watchType)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t("amount")}:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    ₹{(watchAmount || 0).toLocaleString()}
                  </span>
                </div>
                {watchType !== "borrowing" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t("charge")}:</span>
                    <span
                      className={`font-medium ${
                        charge < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      ₹{charge.toLocaleString()}
                    </span>
                  </div>
                )}
                {watchType === "withdrawal" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t("paymentMethod")}:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                      {t(watchPaymentMethod)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {watchType === "deposit"
                      ? t("cashReceived")
                      : watchType === "withdrawal"
                      ? t("cashGiven")
                      : watchType === "borrowing"
                      ? t("cashBorrowed")
                      : t("amountTransferred")}
                    :
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    ₹
                    {watchType === "deposit"
                      ? ((watchAmount || 0) + charge).toLocaleString()
                      : watchType === "withdrawal"
                      ? ((watchAmount || 0) - charge).toLocaleString()
                      : watchType === "ledger_transfer"
                      ? ((watchAmount || 0) + charge).toLocaleString()
                      : (watchAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loadingTransactions}
                  className="flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingTransactions ? (
                    <>
                      <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
                      {t("processing")}
                    </>
                  ) : (
                    <>
                      <PlusIcon className="mr-2 h-5 w-5" />
                      {t("createTransaction")}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div ref={receiptRef} className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center">
                  {t("transactionReceipt")}
                </h2>
                <div className="flex justify-center">
                  <QRCode
                    value={JSON.stringify({
                      transactionId: showReceipt._id,
                      type: showReceipt.type,
                      amount: showReceipt.amount,
                      charge: showReceipt.charge,
                      date: formatDate(showReceipt.createdAt),
                    })}
                    size={128}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("transactionId")}:</span>
                    <span className="font-medium text-white">{showReceipt._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("type")}:</span>
                    <span className="font-medium capitalize text-white">{t(showReceipt.type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("amount")}:</span>
                    <span className="font-medium text-white">{formatCurrency(showReceipt.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("charge")}:</span>
                    <span
                      className={`font-medium ${
                        showReceipt.charge < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {formatCurrency(showReceipt.charge)}
                    </span>
                  </div>
                  {showReceipt.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t("paymentMethod")}:</span>
                      <span className="font-medium capitalize text-white">{t(showReceipt.paymentMethod)}</span>
                    </div>
                  )}
                  {showReceipt.employeeId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t("user")}:</span>
                      <span className="font-medium text-white">{showReceipt.employeeId.name}</span>
                    </div>
                  )}
                  {showReceipt.description && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t("description")}:</span>
                      <span className="font-medium text-white">{showReceipt.description}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("date")}:</span>
                    <span className="font-medium text-white">{formatDate(showReceipt.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setShowReceipt(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  {t("close")}
                </button>
                <button
                  onClick={downloadReceipt}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  {t("downloadPDF")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {t("transactionHistory")}
              </h2>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={t("searchTransactions")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="block w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">{t("allTypes")}</option>
                  <option value="deposit">{t("deposit")}</option>
                  <option value="withdrawal">{t("withdrawal")}</option>
                  <option value="borrowing">{t("borrowing")}</option>
                  <option value="ledger_transfer">{t("ledgerTransfer")}</option>
                </select>

                {/* Reset Filters */}
                <button
                  onClick={resetFilters}
                  className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  {t("reset")}
                </button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-1 sm:col-span-2 md:col-span-1 flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t("dateRange")}:</span>
              </div>
              <div>
                <label htmlFor="startDate" className="sr-only">
                  {t("startDate")}
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="sr-only">
                  {t("endDate")}
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <button
                  onClick={() => setDateRange({ startDate: "", endDate: "" })}
                  className="w-full flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  {t("clearDates")}
                </button>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {t("loadingTransactions")}
                </span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <BanknoteIcon className="h-12 w-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  {t("noTransactions")}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {searchTerm || dateRange.startDate || dateRange.endDate || filterType !== "all"
                    ? t("tryDifferentFilters")
                    : t("createFirstTransaction")}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort("type")}
                    >
                      <div className="flex items-center">
                        <span>{t("type")}</span>
                        {sortField === "type" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort("amount")}
                    >
                      <div className="flex items-center">
                        <span>{t("amount")}</span>
                        {sortField === "amount" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort("charge")}
                    >
                      <div className="flex items-center">
                        <span>{t("charge")}</span>
                        {sortField === "charge" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell"
                    >
                      {t("details")}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort("createdAt")}
                    >
                      <div className="flex items-center">
                        <span>{t("date")}</span>
                        {sortField === "createdAt" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentTransactions.map((transaction) => (
                    <tr
                      key={transaction._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {transaction.type === "deposit" ? (
                            <div className="p-1.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                              <ArrowDownIcon className="h-4 w-4" />
                            </div>
                          ) : transaction.type === "withdrawal" ? (
                            <div className="p-1.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                              <ArrowUpIcon className="h-4 w-4" />
                            </div>
                          ) : transaction.type === "borrowing" ? (
                            <div className="p-1.5 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                              <BanknoteIcon className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="p-1.5 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                              <ArrowRightIcon className="h-4 w-4" />
                            </div>
                          )}
                          <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {t(transaction.type)}
                            {transaction.type === "withdrawal" &&
                              transaction.paymentMethod && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                  ({t(transaction.paymentMethod)})
                                </span>
                              )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(transaction.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            transaction.charge < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {transaction.charge !== 0
                            ? formatCurrency(transaction.charge)
                            : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {transaction.description || "-"}
                          {transaction.employeeId && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {t("user")}: {transaction.employeeId.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setShowReceipt(transaction)}
                          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          {t("viewReceipt")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredTransactions.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
                {t("showing")} {indexOfFirstItem + 1} -{" "}
                {Math.min(indexOfLastItem, filteredTransactions.length)} {t("of")}{" "}
                {filteredTransactions.length} {t("transactions")}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursornot-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  {t("previous")}
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => paginate(index + 1)}
                    className={`px-3 py-1 rounded-lg border border-gray-300 ${
                      currentPage === index + 1
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  {t("next")}
                </button>
              </div>
            </div>
          )}

          {/* Export Button */}
          {filteredTransactions.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={exportTransactions}
                className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                {t("exportTransactions")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}