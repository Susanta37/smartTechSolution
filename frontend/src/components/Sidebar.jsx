import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { logout } from "../redux/authSlice";
import {
  ArchiveBoxIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  HomeIcon,
  ShoppingBagIcon,
  XMarkIcon,
  UserPlusIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import { Banknote, ClipboardCheckIcon, ReceiptIndianRupee } from "lucide-react";


const Sidebar = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);

 

  const navItems = [
    { name: "dashboard", path: "/", icon: <HomeIcon className="w-5 h-5" /> },
    { name: "sales", path: "/sales", icon: <ScaleIcon className="w-5 h-5" /> },
    { name: "banking", path: "/banking", icon: <ReceiptIndianRupee className="w-5 h-5" /> },
    { name: "inventory", path: "/inventory", icon: <ArchiveBoxIcon className="w-5 h-5" /> },
    { name: "services", path: "/services", icon: <ShoppingBagIcon className="w-5 h-5" /> },
    { name: "categories", path: "/categories", icon: <ClipboardCheckIcon className="w-5 h-5" /> },
    { name: "commissions", path: "/commissions", icon: <BanknotesIcon className="w-5 h-5" /> },
    { name: "permissions", path: "/permissions", icon: <Cog6ToothIcon className="w-5 h-5" /> },
  ];

  if (user?.role !== "admin") return null;
  if (user?.role === "admin") {
    navItems.push({ name: "Add User", path: "/add-user", icon: <UserPlusIcon className="w-5 h-5" /> });
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" onClick={onClose}></div>}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 transform bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Smart Tech Solution</h1>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-blue-400 ${
                        isActive ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400" : ""
                      }`
                    }
                  >
                    {item.icon}
                    <span className="ml-3">{t(item.name)}</span>
                  </NavLink>
                </li>
              ))}
              <li>
                <button
                  onClick={() => dispatch(logout())}
                  className="flex items-center rounded-md px-4 py-3 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-gray-700 w-full text-left"
                >
                  <ArrowTrendingUpIcon className="w-5 h-5" />
                  <span className="ml-3">{t("logout")}</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;