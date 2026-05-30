import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export const RoleRoute = ({ roles, children }) => {
  const { user, loading } = useAuth();

  // While auth is still loading (token check / getMe), don't decide yet.
  // The parent ProtectedRoute already shows a full-screen loader.
  if (loading) {
    return null;
  }

  // Only perform role check after we know the user
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};
