import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;