import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInventory, fetchCategories } from "../redux/inventorySlice";
import { PlusIcon, XIcon, FilterIcon, SearchIcon, ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const Toast = ({ message, type, onClose }) => {
  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 mb-4 rounded-lg shadow ${
        type === "success"
          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
          : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
      }`}
      role="alert"
    >
      <div className="text-sm font-medium">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
        onClick={onClose}
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

const InventoryDashboard = () => {
  const dispatch = useDispatch();
  const { items, categories, loading, loadingCategories, error, errorCategories } = useSelector(
    (state) => state.inventory
  );
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    _id: null,
    name: "",
    description: "",
    categoryId: "",
    quantity: "",
    unitPrice: "",
  });
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [showFilters, setShowFilters] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  useEffect(() => {
    dispatch(fetchInventory());
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (error) setToast({ show: true, message: error, type: "error" });
    if (errorCategories) setToast({ show: true, message: errorCategories, type: "error" });
  }, [error, errorCategories]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);

    try {
      if (formData._id) {
        await axios.put(
          `http://localhost:5000/api/inventory/${formData._id}`,
          {
            name: formData.name,
            description: formData.description,
            categoryId: formData.categoryId,
            quantity: Number(formData.quantity),
            unitPrice: Number(formData.unitPrice),
          },
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );
        setToast({
          show: true,
          message: t("itemUpdated"),
          type: "success",
        });
      } else {
        await axios.post(
          `http://localhost:5000/api/inventory`,
          {
            name: formData.name,
            description: formData.description,
            categoryId: formData.categoryId,
            quantity: Number(formData.quantity),
            unitPrice: Number(formData.unitPrice),
          },
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );
        setToast({
          show: true,
          message: t("itemAdded"),
          type: "success",
        });
      }

      dispatch(fetchInventory());
      setFormData({
        _id: null,
        name: "",
        description: "",
        categoryId: "",
        quantity: "",
        unitPrice: "",
      });
      setIsModalOpen(false);
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || formData._id ? t("updateFailed") : t("addFailed"),
        type: "error",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      _id: item._id,
      name: item.name,
      description: item.description || "",
      categoryId: item.categoryId?._id || "",
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/inventory/${deleteItemId}`, {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });
      dispatch(fetchInventory());
      setToast({
        show: true,
        message: t("deleteSuccess"),
        type: "success",
      });
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || t("deleteFailed"),
        type: "error",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteItemId(null);
    }
  };

  const openDeleteDialog = (itemId) => {
    setDeleteItemId(itemId);
    setIsDeleteDialogOpen(true);
  };

  const lowStock = items.filter((item) => item.quantity < 130);

  const filteredAndSortedItems = items
    .filter((item) => {
      if (filter !== "all" && item.categoryId?._id !== filter) {
        return false;
      }
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortField) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "category":
          aValue = a.categoryId?.name || "";
          bValue = b.categoryId?.name || "";
          break;
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case "unitPrice":
          aValue = a.unitPrice;
          bValue = b.unitPrice;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getStockStatusClass = (quantity) => {
    if (quantity === 0) {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    } else if (quantity < 130) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    } else {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    }
  };

  const getStockStatusText = (quantity) => {
    if (quantity === 0) {
      return t("outOfStock");
    } else if (quantity < 130) {
      return t("lowStockWarning");
    } else {
      return t("inStock");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">{t("inventory")}</h1>
        <button
          onClick={() => {
            setFormData({ _id: null, name: "", description: "", categoryId: "", quantity: "", unitPrice: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          {t("addNewItem")}
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">{t("lowStock")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {lowStock.map((item) => (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-800 rounded-md p-2 text-sm border border-yellow-200 dark:border-yellow-800"
              >
                <span className="font-medium">{item.name}</span>: {item.quantity} {t("quantity")}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              placeholder={t("search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
            >
              <FilterIcon className="w-5 h-5 mr-2" />
              {t("filterBy")}
            </button>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              <option value="all">{t("all")}</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t("sortBy")}</label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                <option value="name">{t("name")}</option>
                <option value="category">{t("category")}</option>
                <option value="quantity">{t("quantity")}</option>
                <option value="unitPrice">{t("unitPrice")}</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {t("sortDirection")}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortDirection("asc")}
                  className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg transition-colors ${
                    sortDirection === "asc"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  <ArrowUpIcon className="w-4 h-4 mr-2" />
                  {t("ascending")}
                </button>
                <button
                  onClick={() => setSortDirection("desc")}
                  className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg transition-colors ${
                    sortDirection === "desc"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  <ArrowDownIcon className="w-4 h-4 mr-2" />
                  {t("descending")}
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilter("all");
                  setSearchTerm("");
                  setSortField("name");
                  setSortDirection("asc");
                  setShowFilters(false);
                }}
                className="w-full px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                {t("clearFilters")}
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedItems.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.categoryId?.name || "Unknown"}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <img
                      src={item.categoryId?.photoUrl || "/placeholder.svg"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md bg-gray-100 dark:bg-gray-700"
                      onError={(e) => (e.target.src = "/placeholder.svg")}
                    />
                  </div>
                </div>

                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{item.description}</p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("quantity")}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.quantity}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("unitPrice")}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ₹{item.unitPrice.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 rounded-md p-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("stockValue")}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    ₹{(item.quantity * item.unitPrice).toLocaleString()}
                  </p>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatusClass(item.quantity)}`}>
                    {getStockStatusText(item.quantity)}
                  </span>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteDialog(item._id)}
                      className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredAndSortedItems.length === 0 && !loading && (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">{t("noItemsFound")}</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Item Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 backdrop-blur-md" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {formData._id ? t("editItem") : t("addNewItem")}
                  </Dialog.Title>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>

                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t("name")}
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        {t("description")}
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="categoryId"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        {t("category")}
                      </label>
                      <select
                        id="categoryId"
                        name="categoryId"
                        required
                        value={formData.categoryId}
                        onChange={handleChange}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      >
                        <option value="">{t("selectCategory")}</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="quantity"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          {t("quantity")}
                        </label>
                        <input
                          id="quantity"
                          name="quantity"
                          type="number"
                          min="0"
                          required
                          value={formData.quantity}
                          onChange={handleChange}
                          className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="unitPrice"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          {t("unitPrice")}
                        </label>
                        <input
                          id="unitPrice"
                          name="unitPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={formData.unitPrice}
                          onChange={handleChange}
                          className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        {t("cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={addLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {addLoading ? (formData._id ? t("updating") : t("adding")) : t("submit")}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Dialog */}
      <Transition appear show={isDeleteDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDeleteDialogOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 backdrop-blur-md" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {t("confirmDeleteTitle")}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t("confirmDelete")}</p>
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsDeleteDialogOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      {t("delete")}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default InventoryDashboard;