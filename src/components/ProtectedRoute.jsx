/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * Redirects unauthenticated users to /login and stores the attempted
 * path in location state so they can be sent back after logging in.
 * Shows nothing while the session is being restored from localStorage.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Wait for the auth context to finish reading localStorage before rendering
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    // Pass the current path so the user is redirected back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
