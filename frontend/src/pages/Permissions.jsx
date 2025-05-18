import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Shield, User, X, ChevronDown, Search, Filter, RefreshCw } from "lucide-react";
import axios from "axios";

// Permission categories and operations
const PERMISSION_CATEGORIES = [
  {
    name: "inventory",
    label: "Inventory",
    operations: [
      { key: "inventory_add", label: "Add Inventory" },
      { key: "inventory_update", label: "Update Inventory" },
      { key: "inventory_view", label: "View Inventory" },
      { key: "inventory_sale", label: "Sell Inventory" },
    ],
  },
  {
    name: "service",
    label: "Services",
    operations: [
      { key: "service_add", label: "Add Service" },
      { key: "service_update", label: "Update Service" },
      { key: "service_view", label: "View Service" },
      { key: "service_sale", label: "Sell Service" },
    ],
  },
  {
    name: "banking",
    label: "Banking",
    operations: [
      { key: "banking_transaction", label: "Perform Transactions" },
      { key: "banking_view", label: "View Banking" },
    ],
  },
];

// All operations flattened
const ALL_OPERATIONS = PERMISSION_CATEGORIES.flatMap((category) => category.operations);

// Toast notification component
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
        <X className="w-4 h-4" />
      </button>
    </div >

  );
};

const PermissionsDashboard = () => {
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [permissionSearchTerm, setPermissionSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [permissionForm, setPermissionForm] = useState({
    employeeId: "",
    operations: ALL_OPERATIONS.map((op) => ({ operation: op.key, allowed: false })),
  });
  const { t } = useTranslation();

  // Fetch users and permissions on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        const config = {
          headers: {
            "x-auth-token": token,
          },
        };

        const [usersResponse, permissionsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/users`, config),
          axios.get(`${import.meta.env.VITE_API_URL}/api/permissions`, config),
        ]);

        setUsers(usersResponse.data || []);
        setPermissions(permissionsResponse.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setToast({
          show: true,
          message: error.response?.data?.message || t("errorFetchingData"),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  // Filter users based on search term
  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Filter permissions based on search term and role filter
  const filteredPermissions = permissions.filter((permission) => {
    if (!permission.employeeId) return false;
    const matchesSearch =
      permission.employeeId.name?.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
      permission.employeeId.email?.toLowerCase().includes(permissionSearchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || permission.employeeId.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle selecting a user
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setUserDropdownOpen(false);

    const existingPermissions = permissions.find((p) => p.employeeId?._id === user._id);

    if (existingPermissions) {
      setPermissionForm({
        _id: existingPermissions._id,
        employeeId: user._id,
        operations: ALL_OPERATIONS.map((op) => ({
          operation: op.key,
          allowed:
            existingPermissions.operations.find((permOp) => permOp.operation === op.key)?.allowed || false,
        })),
      });
    } else {
      setPermissionForm({
        employeeId: user._id,
        operations: ALL_OPERATIONS.map((op) => ({ operation: op.key, allowed: false })),
      });
    }

    setEditMode(true);
  };

  // Handle permission toggle
  const handlePermissionToggle = (operationKey) => {
    setPermissionForm((prev) => ({
      ...prev,
      operations: prev.operations.map((op) =>
        op.operation === operationKey ? { ...op, allowed: !op.allowed } : op
      ),
    }));
  };

  // Handle category toggle
  const handleCategoryToggle = (categoryName) => {
    const categoryOperations = PERMISSION_CATEGORIES.find(
      (category) => category.name === categoryName
    ).operations.map((op) => op.key);

    const allAllowed = categoryOperations.every((opKey) =>
      permissionForm.operations.find((op) => op.operation === opKey)?.allowed
    );

    setPermissionForm((prev) => ({
      ...prev,
      operations: prev.operations.map((op) =>
        categoryOperations.includes(op.operation) ? { ...op, allowed: !allAllowed } : op
      ),
    }));
  };

  // Handle select all / deselect all
  const handleSelectAll = (select) => {
    setPermissionForm((prev) => ({
      ...prev,
      operations: prev.operations.map((op) => ({ ...op, allowed: select })),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const config = {
        headers: {
          "x-auth-token": token,
        },
      };

      // Backend handles both create and update via POST
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/permissions`,
        {
          employeeId: permissionForm.employeeId,
          operations: permissionForm.operations,
        },
        config
      );
      setToast({
        show: true,
        message: permissionForm._id ? t("permissionUpdated") : t("permissionSaved"),
        type: "success",
      });

      // Refresh permissions
      const permissionsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/permissions`,
        config
      );
      setPermissions(permissionsResponse.data || []);

      // Reset form
      setEditMode(false);
      setSelectedUser(null);
      setPermissionForm({
        employeeId: "",
        operations: ALL_OPERATIONS.map((op) => ({ operation: op.key, allowed: false })),
      });
    } catch (error) {
      console.error("Error saving permissions:", error);
      setToast({
        show: true,
        message:
          error.response?.data?.message ||
          (permissionForm._id ? t("permissionUpdateFailed") : t("permissionSaveFailed")),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // Check if all operations in a category are allowed
  const isCategoryAllowed = (categoryName) => {
    const categoryOperations = PERMISSION_CATEGORIES.find(
      (category) => category.name === categoryName
    ).operations.map((op) => op.key);

    return categoryOperations.every((opKey) =>
      permissionForm.operations.find((op) => op.operation === opKey)?.allowed
    );
  };

  // Check if some (but not all) operations in a category are allowed
  const isCategoryPartiallyAllowed = (categoryName) => {
    const categoryOperations = PERMISSION_CATEGORIES.find(
      (category) => category.name === categoryName
    ).operations.map((op) => op.key);

    const allowedCount = categoryOperations.filter((opKey) =>
      permissionForm.operations.find((op) => op.operation === opKey)?.allowed
    ).length;

    return allowedCount > 0 && allowedCount < categoryOperations.length;
  };

  // Check if an operation is allowed
  const isOperationAllowed = (operationKey) => {
    return permissionForm.operations.find((op) => op.operation === operationKey)?.allowed || false;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6">
      {/* Toast notification */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("permissions")}</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Permission Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t("managePermissions")}</h2>

            {/* User selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("selectUser")}
              </label>
              <div className="relative">
                <button
                  type="button"
                  className="relative w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  disabled={saving}
                >
                  <span className="flex items-center">
                    {selectedUser ? (
                      <>
                        <User className="flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="block truncate">{selectedUser.name}</span>
                      </>
                    ) : (
                      <span className="block truncate text-gray-500 dark:text-gray-400">{t("selectUser")}</span>
                    )}
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-700 px-2 py-2">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder={t("searchUsers")}
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <div
                          key={user._id}
                          className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="flex items-center">
                            <User className="flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                            <span className="font-normal block truncate">{user.name}</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-7">{user.email}</span>
                        </div>
                      ))
                    ) : (
                      <div className="py-2 px-3 text-gray-500 dark:text-gray-400 text-center">{t("noUsersFound")}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {editMode && selectedUser && (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">{t("permissionSettings")}</h3>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={() => handleSelectAll(true)}
                      >
                        {t("selectAll")}
                      </button>
                      <span className="text-gray-400">|</span>
                      <button
                        type="button"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={() => handleSelectAll(false)}
                      >
                        {t("deselectAll")}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {PERMISSION_CATEGORIES.map((category) => (
                      <div
                        key={category.name}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer mb-2"
                          onClick={() => handleCategoryToggle(category.name)}
                        >
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">{t(category.name)}</h4>
                          <div
                            className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors duration-300 ease-in-out ${
                              isCategoryAllowed(category.name)
                                ? "bg-blue-600"
                                : isCategoryPartiallyAllowed(category.name)
                                ? "bg-blue-400"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                                isCategoryAllowed(category.name) ? "translate-x-5" : "translate-x-0"
                              }`}
                            ></div>
                          </div>
                        </div>

                        <div className="ml-2 space-y-2">
                          {category.operations.map((operation) => (
                            <div
                              key={operation.key}
                              className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <span className="text-sm text-gray-700 dark:text-gray-300">{t(operation.key)}</span>
                              <button
                                type="button"
                                className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors duration-300 ease-in-out ${
                                  isOperationAllowed(operation.key) ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                }`}
                                onClick={() => handlePermissionToggle(operation.key)}
                              >
                                <div
                                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                                    isOperationAllowed(operation.key) ? "translate-x-5" : "translate-x-0"
                                  }`}
                                ></div>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    onClick={() => {
                      setEditMode(false);
                      setSelectedUser(null);
                    }}
                    disabled={saving}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                    disabled={saving}
                  >
                    {saving && <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                    {saving ? t("saving") : t("saveChanges")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Permissions List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("userPermissions")}</h2>
            </div>

            {/* Search and filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                    placeholder={t("searchPermissions")}
                    value={permissionSearchTerm}
                    onChange={(e) => setPermissionSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex items-center">
                  <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <select
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">{t("allRoles")}</option>
                    <option value="admin">{t("admin")}</option>
                    <option value="manager">{t("manager")}</option>
                    <option value="employee">{t("employee")}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Permissions table */}
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
              </div>
            ) : filteredPermissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {t("user")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {t("email")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {t("role")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {t("permissions")}
                      </th>
                      {/* <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {t("actions")}
                      </th> */}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPermissions.map((permission) => (
                      <tr key={permission._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {permission.employeeId?.name || "Unknown"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {permission.employeeId?.email || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              permission.employeeId?.role === "admin"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                                : permission.employeeId?.role === "manager"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            }`}
                          >
                            {t(permission.employeeId?.role || "employee")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {permission.operations
                              .filter((op) => op.allowed)
                              .map((op) => (
                                <span
                                  key={op.operation}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                >
                                  {t(op.operation)}
                                </span>
                              ))}
                          </div>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleSelectUser(permission.employeeId)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                            disabled={!permission.employeeId}
                          >
                            {t("edit")}
                          </button>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t("noPermissionsFound")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsDashboard;