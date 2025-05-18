"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  ChevronDownIcon,
  Loader2Icon,
  PackageIcon,
  RefreshCwIcon,
  SearchIcon,
  TrashIcon,
  WrenchIcon,
  EditIcon,
  PlusIcon,
  XIcon,
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
 */

/**
 * @typedef {Object} ServiceItem
 * @property {string} _id
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {string} [photoUrl]
 * @property {string} createdBy
 * @property {{inventoryId: string, quantity: number}[]} [inventoryItems]
 * @property {string} createdAt
 */

export default function ServicesPage() {
  const { t } = useTranslation();
  // State
  const [services, setServices] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [timeFilter, setTimeFilter] = useState("all");
  const [specificDate, setSpecificDate] = useState("");

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      photoUrl: "",
      inventoryItems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "inventoryItems",
  });

  // Fetch services and inventory
  useEffect(() => {
    fetchServices();
    fetchInventory();
  }, [t]);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/services`, {
        headers: { "x-auth-token": token },
      });

      setServices(response.data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error(t("errorFetchingServices"));
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/inventory`, {
        headers: { "x-auth-token": token },
      });

      setInventoryItems(response.data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error(t("errorFetchingInventory"));
    } finally {
      setLoadingInventory(false);
    }
  };

  // Handle form submission (create or update)
  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const serviceData = {
        name: data.name,
        description: data.description,
        price: data.price,
        photoUrl: data.photoUrl || undefined,
        inventoryItems: data.inventoryItems.map((item) => ({
          inventoryId: item.inventoryId,
          quantity: item.quantity,
        })),
      };

      let response;
      if (editingService) {
        // Update service
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/services/${editingService._id}`,
          serviceData,
          {
            headers: { "x-auth-token": token },
          }
        );
        setServices(
          services.map((s) => (s._id === editingService._id ? response.data : s))
        );
        toast.success(t("serviceUpdated"));
      } else {
        // Create service
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/services`,
          serviceData,
          {
            headers: { "x-auth-token": token },
          }
        );
        setServices([response.data, ...services]);
        toast.success(t("serviceCreated"));
      }

      reset();
      setEditingService(null);
    } catch (error) {
      console.error("Error saving service:", error);
      const errorMessage =
        error.response?.data?.message || t(editingService ? "serviceUpdateFailed" : "serviceCreateFailed");
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit service
  const handleEdit = (service) => {
    setEditingService(service);
    setValue("name", service.name);
    setValue("description", service.description);
    setValue("price", service.price);
    setValue("photoUrl", service.photoUrl || "");
    setValue(
      "inventoryItems",
      service.inventoryItems.map((item) => ({
        inventoryId: item.inventoryId,
        quantity: item.quantity,
      }))
    );
  };

  // Handle delete service
  const handleDelete = async (id) => {
    if (!confirm(t("confirmDeleteService"))) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      await axios.delete(`${import.meta.env.VITE_API_URL}/api/services/${id}`, {
        headers: { "x-auth-token": token },
      });

      setServices(services.filter((s) => s._id !== id));
      toast.success(t("serviceDeleted"));
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error(t("serviceDeleteFailed"));
    }
  };

  // Filter and sort services
  const filteredServices = services
    .filter((service) => {
      if (searchTerm) {
        if (
          !service.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !service.description?.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }
      }

      const serviceDate = new Date(service.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (timeFilter) {
        case "today":
          return (
            serviceDate >= today &&
            serviceDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
          );
        case "yesterday": {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return (
            serviceDate >= yesterday &&
            serviceDate < new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
          );
        }
        case "week": {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          return serviceDate >= startOfWeek && serviceDate < endOfWeek;
        }
        case "month": {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          return serviceDate >= startOfMonth && serviceDate < endOfMonth;
        }
        case "year": {
          const startOfYear = new Date(today.getFullYear(), 0, 1);
          const endOfYear = new Date(today.getFullYear() + 1, 0, 1);
          return serviceDate >= startOfYear && serviceDate < endOfYear;
        }
        case "specific":
          if (!specificDate) return false;
          const selectedDate = new Date(specificDate);
          selectedDate.setHours(0, 0, 0, 0);
          return (
            serviceDate >= selectedDate &&
            serviceDate < new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
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

  // Get inventory item name by ID
  const getInventoryItemName = (inventoryId) => {
    const item = inventoryItems.find((i) => i._id === inventoryId);
    return item ? item.name : "Unknown";
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t("servicesManagement")}</h1>
          <button
            onClick={() => {
              fetchServices();
              fetchInventory();
            }}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            {t("refresh")}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create/Update Service Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                {editingService ? t("updateService") : t("createService")}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("serviceName")}
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register("name", { required: t("nameRequired") })}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("description")}
                  </label>
                  <textarea
                    id="description"
                    {...register("description", { required: t("descriptionRequired") })}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    rows="4"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("price")} (₹)
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    {...register("price", {
                      required: t("priceRequired"),
                      min: { value: 0, message: t("priceNonNegative") },
                      valueAsNumber: true,
                    })}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.price.message}</p>
                  )}
                </div>

                {/* Photo URL */}
                <div>
                  <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("photoUrl")} ({t("optional")})
                  </label>
                  <input
                    id="photoUrl"
                    type="url"
                    {...register("photoUrl")}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Inventory Items */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("inventoryItems")} ({t("optional")})
                  </label>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 mb-2">
                      <div className="flex-1">
                        <select
                          {...register(`inventoryItems.${index}.inventoryId`, {
                            required: t("inventoryItemRequired"),
                          })}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          disabled={loadingInventory}
                        >
                          <option value="">{t("selectInventoryItem")}</option>
                          {inventoryItems.map((item) => (
                            <option key={item._id} value={item._id}>
                              {item.name} - ₹{item.unitPrice.toLocaleString()} ({item.quantity} {t("inStock")})
                            </option>
                          ))}
                        </select>
                        {errors.inventoryItems?.[index]?.inventoryId && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.inventoryItems[index].inventoryId.message}
                          </p>
                        )}
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          {...register(`inventoryItems.${index}.quantity`, {
                            required: t("quantityRequired"),
                            min: { value: 1, message: t("quantityMin") },
                            validate: (value) => {
                              const inventoryId = control._formValues.inventoryItems[index]?.inventoryId;
                              const item = inventoryItems.find((i) => i._id === inventoryId);
                              return !item || value <= item.quantity || t("insufficientStock", { quantity: item.quantity });
                            },
                            valueAsNumber: true,
                          })}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        {errors.inventoryItems?.[index]?.quantity && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.inventoryItems[index].quantity.message}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => append({ inventoryId: "", quantity: 1 })}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    disabled={loadingInventory}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    {t("addInventoryItem")}
                  </button>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
                        {t("processing")}
                      </>
                    ) : (
                      <>
                        <WrenchIcon className="mr-2 h-5 w-5" />
                        {editingService ? t("updateService") : t("createService")}
                      </>
                    )}
                  </button>
                  {editingService && (
                    <button
                      type="button"
                      onClick={() => {
                        reset();
                        setEditingService(null);
                      }}
                      className="flex-1 flex items-center justify-center rounded-lg bg-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                    >
                      {t("cancel")}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Services List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t("servicesList")}</h2>

                {/* Search and Filter */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder={t("searchServices")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={timeFilter}
                      onChange={(e) => {
                        setTimeFilter(e.target.value);
                        if (e.target.value !== "specific") setSpecificDate("");
                      }}
                      className="block w-full sm:w-40 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">{t("allServices")}</option>
                      <option value="today">{t("today")}</option>
                      <option value="yesterday">{t("yesterday")}</option>
                      <option value="week">{t("thisWeek")}</option>
                      <option value="month">{t("thisMonth")}</option>
                      <option value="year">{t("thisYear")}</option>
                      <option value="specific">{t("specificDate")}</option>
                    </select>
                  </div>
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
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Services Table */}
              <div className="overflow-x-auto">
                {loadingServices || loadingInventory ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{t("loadingServices")}</span>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <WrenchIcon className="h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">{t("noServices")}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {searchTerm || timeFilter !== "all" ? t("tryDifferentSearch") : t("createFirstService")}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                          onClick={() => toggleSort("name")}
                        >
                          <div className="flex items-center">
                            <span>{t("name")}</span>
                            {sortField === "name" && (
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
                          onClick={() => toggleSort("price")}
                        >
                          <div className="flex items-center">
                            <span>{t("price")}</span>
                            {sortField === "price" && (
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
                          {t("inventoryItems")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                          onClick={() => toggleSort("createdAt")}
                        >
                          <div className="flex items-center">
                            <span>{t("createdAt")}</span>
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
                      {filteredServices.map((service) => (
                        <tr key={service._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <WrenchIcon className="h-5 w-5 text-purple-500 mr-2" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {service.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              ₹{service.price.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {service.inventoryItems.length > 0 ? (
                                <ul className="list-disc list-inside">
                                  {service.inventoryItems.map((item, index) => (
                                    <li key={index}>
                                      {getInventoryItemName(item.inventoryId)}: {item.quantity}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                t("none")
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(service.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEdit(service)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                            >
                              <EditIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(service._id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Services Summary */}
              {filteredServices.length > 0 && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("totalServices")}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{filteredServices.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("averagePrice")}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ₹{Math.round(
                          filteredServices.reduce((sum, s) => sum + s.price, 0) / filteredServices.length
                        ).toLocaleString()}
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