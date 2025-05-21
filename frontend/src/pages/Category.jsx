import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Edit2, Trash2, ChevronLeft, ChevronRight, ImageIcon, X } from "lucide-react";
import { Dialog } from "@headlessui/react";
import api from "../redux/api";

const Category = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    photoUrl: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;

  // Prevent state updates on unmounted component
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchCategories = useCallback(async () => {
    const toastId = toast.loading(t("loading"));
    try {
      setLoading(true);
      const response = await api.get("/api/categories");
      const allCategories = Array.isArray(response.data) ? response.data : [];
      if (isMounted.current) {
        setCategories(allCategories);
        setTotalPages(Math.max(1, Math.ceil(allCategories.length / itemsPerPage)));
        toast.success(t("success"), { id: toastId });
      }
    } catch (error) {
      const status = error.response?.status;
      let errorMessage = t("error");
      if (status === 401 || status === 403) errorMessage = t("unauthorized");
      else if (status === 404) errorMessage = t("not_found");
      else if (status === 500) errorMessage = t("server_error");
      else errorMessage = error.response?.data?.message || t("error");
      if (isMounted.current) {
        toast.error(errorMessage, { id: toastId });
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchCategories]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error(t("name_required"));
      return false;
    }
    if (formData.photoUrl && !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(formData.photoUrl)) {
      toast.error(t("invalid_url"));
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (addLoading) return; // Prevent double submission
    const toastId = toast.loading(editingCategory ? t("updating") : t("creating"));
    setAddLoading(true);
    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        photoUrl: formData.photoUrl.trim() || undefined,
      };
      let response;
      if (editingCategory) {
        response = await api.put(`/api/categories/${editingCategory._id}`, data);
        if (isMounted.current) {
          setCategories(categories.map((cat) => (cat._id === editingCategory._id ? response.data : cat)));
          toast.success(t("updated"), { id: toastId });
        }
      } else {
        response = await api.post("/api/categories", data);
        if (isMounted.current) {
          setCategories([...categories, response.data]);
          toast.success(t("created"), { id: toastId });
        }
      }
      resetForm();
      // Recalculate pagination
      if (isMounted.current) {
        setTotalPages(Math.max(1, Math.ceil(categories.length / itemsPerPage)));
        if (currentPage > totalPages) setCurrentPage(totalPages);
      }
    } catch (error) {
      const status = error.response?.status;
      let errorMessage = t("error");
      if (status === 400) errorMessage = error.response?.data?.message || t("bad_request");
      else if (status === 401 || status === 403) errorMessage = t("unauthorized");
      else if (status === 404) errorMessage = t("not_found");
      else if (status === 500) errorMessage = t("server_error");
      if (isMounted.current) {
        toast.error(errorMessage, { id: toastId });
      }
    } finally {
      if (isMounted.current) {
        setAddLoading(false);
      }
    }
  };

  const resetForm = () => {
    if (isMounted.current) {
      setFormData({ name: "", description: "", photoUrl: "" });
      setEditingCategory(null);
    }
  };

  const handleEdit = (category) => {
    if (isMounted.current) {
      setEditingCategory(category);
      setFormData({
        name: category.name || "",
        description: category.description || "",
        photoUrl: category.photoUrl || "",
      });
    }
  };

  const handleDeleteConfirm = (category) => {
    if (isMounted.current) {
      setCategoryToDelete(category);
      setDeleteModalOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    const toastId = toast.loading(t("deleting"));
    try {
      await api.delete(`/api/categories/${categoryToDelete._id}`);
      if (isMounted.current) {
        const updatedCategories = categories.filter((cat) => cat._id !== categoryToDelete._id);
        setCategories(updatedCategories);
        setTotalPages(Math.max(1, Math.ceil(updatedCategories.length / itemsPerPage)));
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
        toast.success(t("deleted"), { id: toastId });
        setDeleteModalOpen(false);
        setCategoryToDelete(null);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message === "Cannot delete category used in inventory"
          ? t("cannot_delete")
          : t("error");
      if (isMounted.current) {
        toast.error(errorMessage, { id: toastId });
      }
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return t("unknown_date");
    }
  };

  const paginatedCategories = categories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center">
        <p className="text-gray-400">{t("please_login")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">{t("categories")}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          {user?.role === "admin" && (
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">
                    {editingCategory ? t("edit_category") : t("add_category")}
                  </h3>
                  {editingCategory && (
                    <button
                      onClick={resetForm}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label={t("cancel")}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      {t("name")} *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition-colors"
                      placeholder={t("enter_category_name")}
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
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition-colors"
                      placeholder={t("enter_description")}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="photoUrl"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      {t("photo_url")}
                    </label>
                    <div className="flex">
                      <input
                        id="photoUrl"
                        name="photoUrl"
                        type="url"
                        value={formData.photoUrl}
                        onChange={handleChange}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition-colors"
                        placeholder={t("enter_image_url")}
                      />
                    </div>
                    {formData.photoUrl && (
                      <div className="mt-2 relative w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={formData.photoUrl || "/placeholder.svg"}
                          alt={t("preview")}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={addLoading}
                      className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {addLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          {editingCategory ? t("updating") : t("creating")}
                        </>
                      ) : (
                        <>{editingCategory ? t("update_category") : t("add_category")}</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Categories List Section */}
          <div className={user?.role === "admin" ? "lg:col-span-2" : "lg:col-span-3"}>
            {paginatedCategories.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">{t("no_categories")}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                        <th scope="col" className="px-6 py-3">{t("name")}</th>
                        <th scope="col" className="px-6 py-3 hidden md:table-cell">{t("description")}</th>
                        <th scope="col" className="px-6 py-3 hidden lg:table-cell">{t("photo")}</th>
                        <th scope="col" className="px-6 py-3">{t("created")}</th>
                        {user?.role === "admin" && (
                          <th scope="col" className="px-6 py-3">{t("actions")}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCategories.map((category) => (
                        <tr
                          key={category._id}
                          className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            {category.name || t("unknown")}
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            {(category.description?.slice(0, 50) || t("no_description")) +
                              (category.description?.length > 50 ? "..." : "")}
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            {category.photoUrl ? (
                              <img
                                src={category.photoUrl || "/placeholder.svg"}
                                alt={category.name || t("unknown")}
                                className="h-10 w-10 object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/placeholder.svg";
                                }}
                              />
                            ) : (
                              t("no_image")
                            )}
                          </td>
                          <td className="px-6 py-4">{formatDate(category.createdAt)}</td>
                          {user?.role === "admin" && (
                            <td className="px-6 py-4 flex space-x-2">
                              <button
                                onClick={() => handleEdit(category)}
                                className="p-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                aria-label={t("edit")}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteConfirm(category)}
                                className="p-2 text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                aria-label={t("delete")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-8 space-x-2">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      aria-label={t("previous_page")}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
                      {currentPage} / {totalPages}
                    </div>
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      aria-label={t("next_page")}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                {t("confirm_delete")}
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("delete_message", { name: categoryToDelete?.name || t("unknown") })}
                </p>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  aria-label={t("cancel")}
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  aria-label={t("delete")}
                >
                  {t("delete")}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default Category;