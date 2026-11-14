import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  // Wait until authentication state is restored
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  // Redirect unauthenticated users
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Allow authenticated users
  return <Outlet />;
}

export default ProtectedRoute;
