/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * Redirects unauthenticated users to /login and stores the attempted
 * path in location state so they can be sent back after logging in.
 *
 * No hay pantalla de espera: AuthProvider lee la sesión guardada antes del
 * primer render, así que acá ya se sabe quién entró.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated()) {
    // Pass the current path so the user is redirected back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
