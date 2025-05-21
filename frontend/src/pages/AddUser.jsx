import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { User, UserPlus, Search, Filter, X, Edit, Trash2, RefreshCw, Phone, Mail, Shield, Eye, EyeOff, AlertCircle, Check, Plus, MapPin } from 'lucide-react'
import axios from "axios"

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  const { t } = useTranslation()
  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 mb-4 rounded-lg shadow ${
        type === "success"
          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
          : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
      }`}
      role="alert"
    >
      <div className="text-sm font-medium">{t(message)}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
        onClick={onClose}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Confirmation modal component
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const { t } = useTranslation()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          ​
        </span>
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">{t(title)}</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t(message)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onConfirm}
            >
              {t("confirm")}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onCancel}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const AddUser = () => {
  const { t } = useTranslation()
  
  // State for user list
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [sortField, setSortField] = useState("name")
  const [sortDirection, setSortDirection] = useState("asc")

  // State for add user form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    phone: "",
    address: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for toast notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })

  // State for confirmation modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token found")

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
        headers: { "x-auth-token": token },
      })
      setUsers(response.data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      showToast("errorFetchingUsers", "error")
    } finally {
      setLoading(false)
    }
  }

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
  }

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null })
    }
  }

  // Validate form
  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = "nameRequired"
    if (!formData.email.trim()) errors.email = "emailRequired"
    if (!formData.password.trim()) errors.password = "passwordRequired"
    if (formData.password && formData.password.length < 6) errors.password = "passwordMinLength"
    if (!formData.role) errors.role = "roleRequired"

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) errors.email = "invalidEmail"

    // Phone validation (optional)
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) errors.phone = "invalidPhone"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token found")

      const config = {
        headers: { "x-auth-token": token },
      }

      // Create new user
      await axios.post(`${import.meta.env.VITE_API_URL}/api/users/register`, formData, config)
      showToast("userAdded", "success")

      // Reset form and refresh user list
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error("Error adding user:", error)
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "userAddFailed"
      showToast(errorMessage, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "employee",
      phone: "",
      address: "",
    })
    setShowPassword(false)
    setFormErrors({})
  }

  // Delete user
  const handleDeleteUser = (userId) => {
    setConfirmModal({
      isOpen: true,
      title: "deleteUser",
      message: "confirmDeleteUser",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token")
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
            headers: { "x-auth-token": token },
          })
          showToast("userDeleted", "success")
          fetchUsers()
        } catch (error) {
          console.error("Error deleting user:", error)
          showToast(error.response?.data?.message || "userDeleteFailed", "error")
        } finally {
          setConfirmModal({ ...confirmModal, isOpen: false })
        }
      },
    })
  }

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm)) ||
        (user.address && user.address.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      return matchesSearch && matchesRole
    })
    .sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      if (sortField === "createdAt") {
        aValue = new Date(a.createdAt)
        bValue = new Date(b.createdAt)
      }
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6">
      {/* Toast notification */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}

      {/* Confirmation modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center">
          <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("addUser")}</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add User Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center mb-4">
              <Plus className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("addNewUser")}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("name")}*
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`bg-gray-50 dark:bg-gray-700 border ${
                    formErrors.name ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                  placeholder={t("enterName")}
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-500">{t(formErrors.name)}</p>}
              </div>
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("email")}*
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`bg-gray-50 dark:bg-gray-700 border ${
                    formErrors.email ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                  placeholder={t("enterEmail")}
                />
                {formErrors.email && <p className="mt-1 text-sm text-red-500">{t(formErrors.email)}</p>}
              </div>
              
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("password")}*
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className={`bg-gray-50 dark:bg-gray-700 border ${
                      formErrors.password
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10`}
                    placeholder={t("enterPassword")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formErrors.password && <p className="mt-1 text-sm text-red-500">{t(formErrors.password)}</p>}
              </div>
              
              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("role")}*
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`bg-gray-50 dark:bg-gray-700 border ${
                    formErrors.role ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                >
                  <option value="employee">{t("employee")}</option>
                  <option value="admin">{t("admin")}</option>
                  <option value="manager">{t("manager")}</option>
                </select>
                {formErrors.role && <p className="mt-1 text-sm text-red-500">{t(formErrors.role)}</p>}
              </div>
              
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("phone")}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`bg-gray-50 dark:bg-gray-700 border ${
                    formErrors.phone ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
                  } text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                  placeholder={t("enterPhone")}
                />
                {formErrors.phone && <p className="mt-1 text-sm text-red-500">{t(formErrors.phone)}</p>}
              </div>
              
              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("address")}
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder={t("enterAddress")}
                />
              </div>
              
              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {t("reset")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                  {isSubmitting ? t("adding") : t("addUser")}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* User List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("userList")}</h2>
              </div>
            </div>
            
            {/* Search and filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                    placeholder={t("searchUsers")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center">
                  <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <select
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">{t("allRoles")}</option>
                    <option value="admin">{t("admin")}</option>
                    <option value="employee">{t("employee")}</option>
                    <option value="manager">{t("manager")}</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* User table */}
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
              </div>
            ) : filteredAndSortedUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => {
                          if (sortField === "name") {
                            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                          } else {
                            setSortField("name")
                            setSortDirection("asc")
                          }
                        }}
                      >
                        <div className="flex items-center">
                          {t("user")}
                          {sortField === "name" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? (
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                              ) : (
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => {
                          if (sortField === "email") {
                            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                          } else {
                            setSortField("email")
                            setSortDirection("asc")
                          }
                        }}
                      >
                        <div className="flex items-center">
                          {t("email")}
                          {sortField === "email" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? (
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                              ) : (
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => {
                          if (sortField === "role") {
                            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                          } else {
                            setSortField("role")
                            setSortDirection("asc")
                          }
                        }}
                      >
                        <div className="flex items-center">
                          {t("role")}
                          {sortField === "role" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? (
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                              ) : (
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {t("contact")}
                      </th>
                      <th
                        scope="col"
                        className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAndSortedUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.photo ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={user.photo || "/placeholder.svg"}
                                  alt={user.name}
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = "/placeholder.svg?height=40&width=40"
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {t("addedOn")} {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Mail className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate max-w-[120px] sm:max-w-[150px]" title={user.email}>
                              {user.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === "admin"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                                  : user.role === "manager"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                  : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              }`}
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              {t(user.role)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-normal">
                          {user.phone && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                              <Phone className="h-4 w-4 mr-1 flex-shrink-0" />
                              <span className="truncate">{user.phone}</span>
                            </div>
                          )}
                          {user.address && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                              <span className="truncate max-w-[120px] sm:max-w-[150px]" title={user.address}>
                                {user.address}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            aria-label={t("deleteUser")}
                          >
                            <Trash2 className="h-5 w-5" />
                            <span className="sr-only">{t("delete")}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t("noUsersFound")}</p>
              </div>
            )}
            
            {/* Mobile view for users (visible on small screens) */}
            <div className="sm:hidden">
              {!loading && filteredAndSortedUsers.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase">
                  {t("swipeToSeeMore")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddUser
