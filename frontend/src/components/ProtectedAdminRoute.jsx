/**
 * ProtectedAdminRoute — wraps routes that require admin privileges.
 *
 * Redirects to /login if unauthenticated.
 * Redirects to / (home) if authenticated but not an admin.
 * This prevents regular users from reaching management pages even if they
 * navigate to the URL directly — y de todos modos el backend revalida cada
 * acción de admin: esta ruta es comodidad, no seguridad.
 *
 * No hay pantalla de espera: AuthProvider lee la sesión guardada antes del
 * primer render.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin()) {
    // Authenticated but lacks admin rights — send to home instead of showing an error page
    return <Navigate to="/" replace />;
  }

  return children;
}
