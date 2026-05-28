/**
 * ProtectedAdminRoute — wraps routes that require admin privileges.
 *
 * Redirects to /login if unauthenticated.
 * Redirects to / (home) if authenticated but not an admin.
 * This prevents regular users from accessing management pages
 * even if they navigate to the URL directly.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin()) {
    // Authenticated but lacks admin rights — send to home instead of showing an error page
    return <Navigate to="/" replace />;
  }

  return children;
}
