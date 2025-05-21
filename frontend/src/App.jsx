import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Inventory from "./pages/Inventory";
import Services from "./pages/Services";
import Transactions from "./pages/Transactions";
import Commissions from "./pages/Commissions";
import Permissions from "./pages/Permissions";
import { fetchProfile } from "./redux/authSlice"; 
import AddUser from "./pages/AddUser";
import Sale from "./pages/Sale";
import Banking from "./pages/Banking";
import Category from "./pages/Category";

const Home = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" />;
  return user?.role === "admin" ? <Dashboard /> : <EmployeeDashboard />;
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated,user } = useSelector((state) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();

 useEffect(() => {
  const saved = localStorage.getItem("darkMode");
  const isDark = saved ? JSON.parse(saved) : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", isDark);

  if (isAuthenticated && (!user || !user.name)) {
    dispatch(fetchProfile());
  }
}, [isAuthenticated, user, dispatch]);


  
  // Hide Navbar and Sidebar on login/register pages
  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {!isAuthPage && <Navbar onMenuClick={() => setSidebarOpen(true)} />}
      {!isAuthPage && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      <div className={`${!isAuthPage ? "lg:ml-64" : ""} transition-all duration-300`}>
        <ErrorBoundary>
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to={location.state?.from || "/"} replace /> : <Login />}
            />
            <Route
              path="/register"
              element={isAuthenticated ? <Navigate to={location.state?.from || "/"} replace /> : <Register />}
            />
            <Route path="/" element={<Home />} />
            <Route path="/sales" element={<Sale/>} />
            <Route path="/banking" element={<Banking/>} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/services" element={<Services />} />
            <Route path="/categories" element={<Category />} />
            <Route path="/commissions" element={<Commissions />} />
            <Route path="/permissions" element={<Permissions />} />
            <Route path="/add-user" element={isAuthenticated && user?.role === "admin" ? <AddUser /> : <Navigate to="/" />} />
            <Route path="*" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;