"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CreditCardIcon,
  DownloadIcon,
  FilterIcon,
  IndianRupeeIcon,
  Loader2Icon,
  PackageIcon,
  SearchIcon,
  ShoppingBagIcon,
  UserIcon,
  XIcon,
} from "lucide-react";

export default function CommissionsPage() {
  // State for commissions data
  const [commissionsData, setCommissionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payingCommissions, setPayingCommissions] = useState(false);
  const [selectedCommissions, setSelectedCommissions] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [employees, setEmployees] = useState([]);
  const tableRef = useRef(null);

  // State for filters
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "all",
    minAmount: "",
    maxAmount: "",
    type: "all",
    employeeId: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 10,
  });

  // Utility function to convert oklch to rgb
  const convertOklchToRgb = (oklch) => {
    try {
      const div = document.createElement("div");
      div.style.color = oklch;
      document.body.appendChild(div);
      const computed = window.getComputedStyle(div).color;
      document.body.removeChild(div);
      const match = computed.match(/rgb\((\d+), (\d+), (\d+)\)/);
      return match ? `rgb(${match[1]}, ${match[2]}, ${match[3]})` : "rgb(0, 0, 0)";
    } catch {
      return "rgb(0, 0, 0)";
    }
  };

  // Utility function to replace oklch colors in a DOM node
  const replaceOklchColors = (node) => {
    const walker = document.createTreeWalker(node, Node.ELEMENT_NODE);
    let currentNode = walker.currentNode;
    while (currentNode) {
      const style = currentNode.style;
      if (style && style.cssText && style.cssText.includes("oklch")) {
        const newCssText = style.cssText.replace(
          /oklch\([^)]+\)/g,
          (match) => convertOklchToRgb(match)
        );
        currentNode.style.cssText = newCssText;
      }
      const computedStyle = window.getComputedStyle(currentNode);
      ["color", "backgroundColor", "borderColor"].forEach((prop) => {
        const value = computedStyle.getPropertyValue(prop);
        if (value.includes("oklch")) {
          currentNode.style[prop] = convertOklchToRgb(value);
        }
      });
      currentNode = walker.nextNode();
    }
  };

  // Fetch commissions data
  useEffect(() => {
    const fetchCommissions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const params = {};
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== "all") params[key] = value;
        });

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/commissions`,
          {
            headers: { "x-auth-token": token },
            params,
          }
        );

        setCommissionsData(response.data);

        // Extract unique employees for the filter dropdown
        const uniqueEmployees = Array.from(
          new Map(
            response.data.commissions.map((item) => [item.employeeId._id, item.employeeId])
          ).values()
        );
        setEmployees(uniqueEmployees);
      } catch (error) {
        console.error("Error fetching commissions:", error);
        toast.error(error.response?.data?.message || "Failed to load commissions");
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name !== "page" && { page: 1 }),
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      status: "all",
      minAmount: "",
      maxAmount: "",
      type: "all",
      employeeId: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      limit: 10,
    });
  };

  // Handle commission selection
  const toggleCommissionSelection = (id) => {
    setSelectedCommissions((prev) => {
      if (prev.includes(id)) {
        return prev.filter((commissionId) => commissionId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(commissionsData?.commissions.map((commission) => commission._id) || []);
    }
    setSelectAll(!selectAll);
  };

  // Pay selected commissions
  const paySelectedCommissions = async () => {
    if (selectedCommissions.length === 0) {
      toast.error("No commissions selected");
      return;
    }

    setPayingCommissions(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/commissions/pay`,
        { commissionIds: selectedCommissions },
        { headers: { "x-auth-token": token } }
      );

      // Update local state to reflect paid commissions
      if (commissionsData) {
        const updatedCommissions = commissionsData.commissions.map((commission) => {
          if (selectedCommissions.includes(commission._id)) {
            return {
              ...commission,
              status: "paid",
              paidOn: new Date().toISOString(),
            };
          }
          return commission;
        });

        setCommissionsData({
          ...commissionsData,
          commissions: updatedCommissions,
        });
      }

      toast.success(`Successfully paid ${selectedCommissions.length} commissions`);
      setSelectedCommissions([]);
      setSelectAll(false);
    } catch (error) {
      console.error("Error paying commissions:", error);
      toast.error(error.response?.data?.message || "Failed to pay commissions");
    } finally {
      setPayingCommissions(false);
    }
  };

  // Export commissions as PDF
  const downloadCommissionsPDF = async () => {
    try {
      const element = tableRef.current;
      if (!element) {
        toast.error("Table element not found");
        return;
      }

      // Clone the element to avoid modifying the visible DOM
      const clonedElement = element.cloneNode(true);
      replaceOklchColors(clonedElement);

      // Create a temporary container
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

      const canvas = await html2canvas(tempContainer, { scale: 2 });
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save("commissions.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
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
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!commissionsData) return { pending: 0, paid: 0, pendingAmount: 0, paidAmount: 0 };

    const pending = commissionsData.commissions.filter((c) => c.status === "pending").length;
    const paid = commissionsData.commissions.filter((c) => c.status === "paid").length;
    const pendingAmount = commissionsData.commissions
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + c.amount, 0);
    const paidAmount = commissionsData.commissions
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.amount, 0);

    return { pending, paid, pendingAmount, paidAmount };
  };

  const stats = calculateStats();

  // Calculate pagination
  const totalPages = commissionsData?.totalPages || 1;
  const currentPage = filters.page;
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  // Handle pagination
  const goToPage = (page) => {
    handleFilterChange("page", page.toString());
  };

  // Toggle sort
  const toggleSort = (field) => {
    if (filters.sortBy === field) {
      handleFilterChange("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc");
    } else {
      setFilters((prev) => ({
        ...prev,
        sortBy: field,
        sortOrder: "desc",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Commissions Management</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Commissions</p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">{commissionsData?.total || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <CreditCardIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
                  {formatCurrency(commissionsData?.totalAmount || 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <IndianRupeeIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.pending}</p>
                  <p className="ml-2 text-sm text-amber-600 dark:text-amber-400">
                    {formatCurrency(stats.pendingAmount)}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Paid</p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.paid}</p>
                  <p className="ml-2 text-sm text-green-600 dark:text-green-400">{formatCurrency(stats.paidAmount)}</p>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Commission List</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="ml-4 flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <FilterIcon className="w-4 h-4 mr-1" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Pay Selected Button */}
              <button
                onClick={paySelectedCommissions}
                disabled={selectedCommissions.length === 0 || payingCommissions}
                className="flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {payingCommissions ? (
                  <>
                    <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCardIcon className="mr-2 h-5 w-5" />
                    Pay Selected ({selectedCommissions.length})
                  </>
                )}
              </button>

              {/* Export Button */}
              <button
                onClick={downloadCommissionsPDF}
                className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                <DownloadIcon className="mr-2 h-5 w-5" />
                Export
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange("startDate", e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange("endDate", e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {/* Sale Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sale Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="inventory">Inventory</option>
                    <option value="service">Service</option>
                  </select>
                </div>

                {/* Employee Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee</label>
                  <select
                    value={filters.employeeId}
                    onChange={(e) => handleFilterChange("employeeId", e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">All Employees</option>
                    {employees.map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minAmount}
                        onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxAmount}
                        onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Reset Filters */}
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 text-sm"
                  >
                    <XIcon className="mr-2 h-4 w-4" />
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Commissions Table */}
          <div className="overflow-x-auto" ref={tableRef}>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading commissions...</span>
              </div>
            ) : commissionsData?.commissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <CreditCardIcon className="h-12 w-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No commissions found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {filters.startDate || filters.status !== "all" || filters.type !== "all"
                    ? "Try different filters"
                    : "No commissions have been recorded yet"}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort("employeeId.name")}
                    >
                      <div className="flex items-center">
                        <span>Employee</span>
                        {filters.sortBy === "employeeId.name" && (
                          <span className="ml-1">
                            {filters.sortOrder === "asc" ? (
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
                      onClick={() => toggleSort("saleId.type")}
                    >
                      <div className="flex items-center">
                        <span>Sale Type</span>
                        {filters.sortBy === "saleId.type" && (
                          <span className="ml-1">
                            {filters.sortOrder === "asc" ? (
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
                      onClick={() => toggleSort("saleId.finalPrice")}
                    >
                      <div className="flex items-center">
                        <span>Sale Amount</span>
                        {filters.sortBy === "saleId.finalPrice" && (
                          <span className="ml-1">
                            {filters.sortOrder === "asc" ? (
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
                        <span>Commission</span>
                        {filters.sortBy === "amount" && (
                          <span className="ml-1">
                            {filters.sortOrder === "asc" ? (
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
                      onClick={() => toggleSort("status")}
                    >
                      <div className="flex items-center">
                        <span>Status</span>
                        {filters.sortBy === "status" && (
                          <span className="ml-1">
                            {filters.sortOrder === "asc" ? (
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
                      onClick={() => toggleSort("createdAt")}
                    >
                      <div className="flex items-center">
                        <span>Date</span>
                        {filters.sortBy === "createdAt" && (
                          <span className="ml-1">
                            {filters.sortOrder === "asc" ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {commissionsData?.commissions.map((commission) => (
                    <tr key={commission._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCommissions.includes(commission._id)}
                            onChange={() => toggleCommissionSelection(commission._id)}
                            disabled={commission.status === "paid"}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {commission.employeeId.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {commission.employeeId.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {commission.saleId.type === "inventory" ? (
                            <div className="p-1.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                              <PackageIcon className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="p-1.5 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                              <ShoppingBagIcon className="h-4 w-4" />
                            </div>
                          )}
                          <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {commission.saleId.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {formatCurrency(commission.saleId.finalPrice)}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Qty: {commission.saleId.quantity}
                            {commission.saleId.discount > 0 &&
                              ` | Discount: ${formatCurrency(commission.saleId.discount)}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(commission.amount)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {((commission.amount / commission.saleId.finalPrice) * 100).toFixed(1)}% of sale
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {commission.status === "pending" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                            <ClockIcon className="mr-1 h-3 w-3" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <CheckCircleIcon className="mr-1 h-3 w-3" />
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(commission.createdAt)}
                        {commission.paidOn && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Paid: {formatDate(commission.paidOn)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && commissionsData && commissionsData.total > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{(currentPage - 1) * filters.limit + 1}</span> to{" "}
                <span className="font-medium">{Math.min(currentPage * filters.limit, commissionsData.total)}</span> of{" "}
                <span className="font-medium">{commissionsData.total}</span> commissions
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!hasPreviousPage}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                      page === currentPage
                        ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-400"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasNextPage}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}