import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  ChevronDownIcon,
  IndianRupeeIcon,
  Loader2Icon,
  PackageIcon,
  RefreshCwIcon,
  SearchIcon,
  ShoppingCartIcon,
  TagIcon,
  WrenchIcon,
} from "lucide-react";
import toast from "react-hot-toast";

// JSDoc for data structures
/**
 * @typedef {Object} InventoryItem
 * @property {string} _id
 * @property {string} name
 * @property {string} description
 * @property {number} unitPrice
 * @property {number} quantity
 * @property {string} category
 * @property {string} [image]
 */

/**
 * @typedef {Object} ServiceItem
 * @property {string} _id
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {number} duration
 * @property {string} category
 * @property {{inventoryId: string, quantity: number}[]} [inventoryItems]
 */

/**
 * @typedef {Object} Sale
 * @property {string} _id
 * @property {"inventory" | "service"} type
 * @property {string} itemId
 * @property {string} [itemName]
 * @property {number} quantity
 * @property {number} totalPrice
 * @property {number} discount
 * @property {number} finalPrice
 * @property {string} employeeId
 * @property {number} commission
 * @property {string} createdAt
 */

export default function SalesPage() {
  const { t } = useTranslation();
  // State
  const [inventoryItems, setInventoryItems] = useState([]);
  const [serviceItems, setServiceItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedType, setSelectedType] = useState("inventory");
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [timeFilter, setTimeFilter] = useState("all"); // New: time filter state
  const [specificDate, setSpecificDate] = useState(""); // New: specific date state

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
      type: "inventory",
      itemId: "",
      quantity: 1,
      discount: 0,
    },
  });

  const watchType = watch("type");
  const watchItemId = watch("itemId");
  const watchQuantity = watch("quantity");
  const watchDiscount = watch("discount");

  // Calculate prices
  const calculatePrices = () => {
    if (!selectedItem) {
      return { totalPrice: 0, finalPrice: 0, commission: 0 };
    }

    const price = selectedType === "inventory" ? selectedItem.unitPrice : selectedItem.price;
    const totalPrice = price * watchQuantity;
    const finalPrice = totalPrice - (watchDiscount || 0);
    const commission = finalPrice * 0.05; // 5% commission rate

    return {
      totalPrice,
      finalPrice: finalPrice < 0 ? 0 : finalPrice,
      commission,
    };
  };

  const { totalPrice, finalPrice, commission } = calculatePrices();

  // Fetch inventory and service items
  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        const config = {
          headers: { "x-auth-token": token },
        };

        const [inventoryResponse, serviceResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/inventory`, config),
          axios.get(`${import.meta.env.VITE_API_URL}/api/services`, config),
        ]);

        setInventoryItems(inventoryResponse.data || []);
        setServiceItems(serviceResponse.data || []);
      } catch (error) {
        console.error("Error fetching items:", error);
        toast.error(t("errorFetchingItems"));
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [t]);

  // Fetch sales
  useEffect(() => {
    fetchSales();
  }, [t]);

  const fetchSales = async () => {
    setLoadingSales(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sales`, {
        headers: { "x-auth-token": token },
      });

      // Add itemName to sales for display
      const salesWithNames = response.data.map((sale) => {
        const item =
          sale.type === "inventory"
            ? inventoryItems.find((i) => i._id === sale.itemId)
            : serviceItems.find((s) => s._id === sale.itemId);
        return { ...sale, itemName: item?.name || "Unknown" };
      });

      setSales(salesWithNames || []);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error(t("errorFetchingSales"));
    } finally {
      setLoadingSales(false);
    }
  };

  // Update selected item
  useEffect(() => {
    if (watchType === "inventory") {
      setSelectedType("inventory");
      const item = inventoryItems.find((item) => item._id === watchItemId);
      setSelectedItem(item || null);
    } else {
      setSelectedType("service");
      const item = serviceItems.find((item) => item._id === watchItemId);
      setSelectedItem(item || null);
    }
  }, [watchType, watchItemId, inventoryItems, serviceItems]);

  // Handle form submission
  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const saleData = {
        type: data.type,
        itemId: data.itemId,
        quantity: data.quantity,
        discount: data.discount || 0,
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/sales`, saleData, {
        headers: { "x-auth-token": token },
      });

      // Update sales list with itemName
      const newSale = {
        ...response.data,
        itemName: selectedItem?.name || "Unknown",
      };

      setSales([newSale, ...sales]);
      toast.success(t("saleCreated"));
      reset();

      // Refresh inventory and services to reflect updated quantities
      const [inventoryResponse, serviceResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/inventory`, {
          headers: { "x-auth-token": token },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/services`, {
          headers: { "x-auth-token": token },
        }),
      ]);

      setInventoryItems(inventoryResponse.data || []);
      setServiceItems(serviceResponse.data || []);
    } catch (error) {
      console.error("Error creating sale:", error);
      const errorMessage = error.response?.data?.message || t("saleCreateFailed");
      toast.error(t(errorMessage));
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and sort sales
  const filteredSales = sales
    .filter((sale) => {
      // Existing search filter
      if (searchTerm) {
        if (
          !sale.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !sale.type.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !sale.finalPrice.toString().includes(searchTerm)
        ) {
          return false;
        }
      }

      // New time filter
      const saleDate = new Date(sale.createdAt);
      const today = new Date(); // Current date: May 17, 2025
      today.setHours(0, 0, 0, 0); // Start of today

      switch (timeFilter) {
        case "today":
          return (
            saleDate >= today &&
            saleDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
          );
        case "yesterday": {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return (
            saleDate >= yesterday &&
            saleDate < new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
          );
        }
        case "week": {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Monday
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          return saleDate >= startOfWeek && saleDate < endOfWeek;
        }
        case "month": {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          return saleDate >= startOfMonth && saleDate < endOfMonth;
        }
        case "year": {
          const startOfYear = new Date(today.getFullYear(), 0, 1);
          const endOfYear = new Date(today.getFullYear() + 1, 0, 1);
          return saleDate >= startOfYear && saleDate < endOfYear;
        }
        case "specific":
          if (!specificDate) return false;
          const selectedDate = new Date(specificDate);
          selectedDate.setHours(0, 0, 0, 0);
          return (
            saleDate >= selectedDate &&
            saleDate < new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
          );
        case "all":
        default:
          return true;
      }
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
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc"
        ? aValue - bValue
        : bValue - aValue;
    });

  // Handle sort toggle
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t("salesManagement")}</h1>
          <button
            onClick={fetchSales}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            {t("refresh")}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Sale Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">{t("createSale")}</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Sale Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("saleType")}</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      className={`flex items-center justify-center p-3 rounded-lg border ${
                        watchType === "inventory"
                          ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => {
                        setValue("type", "inventory");
                        setValue("itemId", "");
                      }}
                    >
                      <PackageIcon className="w-5 h-5 mr-2" />
                      <span>{t("inventory")}</span>
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center p-3 rounded-lg border ${
                        watchType === "service"
                          ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => {
                        setValue("type", "service");
                        setValue("itemId", "");
                      }}
                    >
                      <WrenchIcon className="w-5 h-5 mr-2" />
                      <span>{t("service")}</span>
                    </button>
                  </div>
                  <input type="hidden" {...register("type")} />
                </div>

                {/* Item Selection */}
                <div>
                  <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("selectItem", { type: watchType === "inventory" ? t("product") : t("service") })}
                  </label>
                  <div className="relative">
                    <select
                      id="itemId"
                      {...register("itemId", { required: t("itemRequired") })}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      disabled={loadingItems}
                    >
                      <option value="">{t("selectPlaceholder", { type: watchType === "inventory" ? t("product") : t("service") })}</option>
                      {watchType === "inventory"
                        ? inventoryItems.map((item) => (
                            <option key={item._id} value={item._id}>
                              {item.name} - ₹{item.unitPrice.toLocaleString()} ({item.quantity} {t("inStock")}) [{item.category}]
                            </option>
                          ))
                        : serviceItems.map((item) => (
                            <option key={item._id} value={item._id}>
                              {item.name} - ₹{item.price.toLocaleString()} [{item.category}]
                            </option>
                          ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                      {loadingItems ? (
                        <Loader2Icon className="h-5 w-5 animate-spin" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                  {errors.itemId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.itemId.message}</p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("quantity")}
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    {...register("quantity", {
                      required: t("quantityRequired"),
                      min: { value: 1, message: t("quantityMin") },
                      valueAsNumber: true,
                    })}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.quantity.message}</p>
                  )}
                  {selectedType === "inventory" &&
                    selectedItem &&
                    watchQuantity > selectedItem.quantity && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {t("insufficientStock", { quantity: selectedItem.quantity })}
                      </p>
                    )}
                </div>

                {/* Discount */}
                <div>
                  <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("discount")} (₹)
                  </label>
                  <input
                    id="discount"
                    type="number"
                    min="0"
                    {...register("discount", {
                      min: { value: 0, message: t("discountNonNegative") },
                      valueAsNumber: true,
                    })}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  {errors.discount && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.discount.message}</p>
                  )}
                  {watchDiscount > totalPrice && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{t("discountExceedsTotal")}</p>
                  )}
                </div>

                {/* Price Summary */}
                {selectedItem && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t("unitPrice")}:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        ₹{selectedType === "inventory" ? selectedItem.unitPrice.toLocaleString() : selectedItem.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t("totalPrice")}:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">₹{totalPrice.toLocaleString()}</span>
                    </div>
                    {watchDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{t("discount")}:</span>
                        <span className="font-medium text-red-600 dark:text-red-400">
                          -₹{watchDiscount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{t("finalPrice")}:</span>
                      <span className="font-bold text-gray-900 dark:text-white">₹{finalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t("commission")} (5%):</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        ₹{commission.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !selectedItem ||
                    (selectedType === "inventory" &&
                      selectedItem &&
                      watchQuantity > selectedItem.quantity) ||
                    watchDiscount > totalPrice
                  }
                  className="w-full flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
                      {t("processing")}
                    </>
                  ) : (
                    <>
                      <ShoppingCartIcon className="mr-2 h-5 w-5" />
                      {t("createSale")}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sales List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t("recentSales")}</h2>

                {/* Search and Filter */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder={t("searchSales")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {/* Time Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={timeFilter}
                      onChange={(e) => {
                        setTimeFilter(e.target.value);
                        if (e.target.value !== "specific") setSpecificDate("");
                      }}
                      className="block w-full sm:w-40 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">{t("allSales")}</option>
                      <option value="today">{t("today")}</option>
                      <option value="yesterday">{t("yesterday")}</option>
                      <option value="week">{t("thisWeek")}</option>
                      <option value="month">{t("thisMonth")}</option>
                      <option value="year">{t("thisYear")}</option>
                      <option value="specific">{t("specificDate")}</option>
                    </select>
                  </div>

                  {/* Date Picker for Specific Date */}
                  {timeFilter === "specific" && (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        value={specificDate}
                        onChange={(e) => setSpecificDate(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        max={new Date().toISOString().split("T")[0]} // Prevent future dates
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Sales Table */}
              <div className="overflow-x-auto">
                {loadingSales ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{t("loadingSales")}</span>
                  </div>
                ) : filteredSales.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <TagIcon className="h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">{t("noSales")}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {searchTerm || timeFilter !== "all" ? t("tryDifferentSearch") : t("createFirstSale")}
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
                          onClick={() => toggleSort("itemName")}
                        >
                          <div className="flex items-center">
                            <span>{t("item")}</span>
                            {sortField === "itemName" && (
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
                          onClick={() => toggleSort("quantity")}
                        >
                          <div className="flex items-center">
                            <span>{t("qty")}</span>
                            {sortField === "quantity" && (
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
                          onClick={() => toggleSort("finalPrice")}
                        >
                          <div className="flex items-center">
                            <span>{t("price")}</span>
                            {sortField === "finalPrice" && (
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
                          onClick={() => toggleSort("commission")}
                        >
                          <div className="flex items-center">
                            <span>{t("commission")}</span>
                            {sortField === "commission" && (
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
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredSales.map((sale) => (
                        <tr key={sale._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {sale.type === "inventory" ? (
                                <PackageIcon className="h-5 w-5 text-blue-500 mr-2" />
                              ) : (
                                <WrenchIcon className="h-5 w-5 text-purple-500 mr-2" />
                              )}
                              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                {t(sale.type)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{sale.itemName}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{sale.quantity}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                              <IndianRupeeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                              {sale.finalPrice.toLocaleString()}
                              {sale.discount > 0 && (
                                <span className="ml-2 text-xs text-red-500 dark:text-red-400">
                                  (-₹{sale.discount.toLocaleString()})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              ₹{sale.commission.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(sale.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Sales Summary */}
              {filteredSales.length > 0 && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("totalSales")}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{filteredSales.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("totalRevenue")}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ₹{filteredSales.reduce((sum, sale) => sum + sale.finalPrice, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("totalCommission")}</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        ₹{filteredSales.reduce((sum, sale) => sum + sale.commission, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}