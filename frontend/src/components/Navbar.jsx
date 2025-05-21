import { useTranslation } from "react-i18next";
import { Bars3Icon, GlobeAltIcon, MoonIcon, SunIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useSelector, useDispatch } from "react-redux"; // Add useDispatch
import { useState } from "react";
import { logout } from "../redux/authSlice"; // Import logout
import { useNavigate } from "react-router-dom"; // Add useNavigate
import Modal from "./Modal"; // Import Modal


const Navbar = ({ onMenuClick }) => {
  const { t, i18n } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // Profile modal state

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode);
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    setIsProfileModalOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto w-full">
          <div className="flex items-center space-x-3">
            {user?.role === "admin" && (
              <button
                onClick={onMenuClick}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
                aria-label="Open menu"
              >
                <Bars3Icon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              </button>
            )}
            <img src="/logo.png" alt="logo"  className="h-10 w-10 flex justify-center items-center"/>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <SunIcon className="w-6 h-6 text-yellow-400" />
              ) : (
                <MoonIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              )}
            </button>
            <button
              onClick={() => i18n.changeLanguage(i18n.language === "en" ? "od" : "en")}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle language"
            >
              <GlobeAltIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              <span className="sr-only">{i18n.language === "en" ? "Switch to Odia" : "Switch to English"}</span>
            </button>
            <div className="flex items-center">
              <div className="hidden md:block mr-3 text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || "Role"}</p>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors"
                aria-label="Open profile"
              >
                <UserCircleIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title={t("profile")}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("name")}</p>
            <p className="text-gray-800 dark:text-gray-100">{user?.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("email")}</p>
            <p className="text-gray-800 dark:text-gray-100">{user?.email || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("role")}</p>
            <p className="text-gray-800 dark:text-gray-100 capitalize">{user?.role || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("phone")}</p>
            <p className="text-gray-800 dark:text-gray-100">{user?.phone || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("address")}</p>
            <p className="text-gray-800 dark:text-gray-100">{user?.address || "N/A"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            {t("logout")}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Navbar;