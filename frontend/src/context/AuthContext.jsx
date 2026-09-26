/**
 * Authentication context.
 *
 * Provides login, register, and logout functions to the entire app,
 * plus the current user object and authentication state.
 *
 * The JWT access token and user data are persisted in localStorage so
 * the session survives a page refresh. On mount, both values are read
 * back and restored to state before rendering protected routes.
 */

import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";

const AuthContext = createContext(null);

/**
 * Hook to consume the auth context from any component.
 * It lives next to the provider on purpose; the only cost is that Fast Refresh
 * reloads this module instead of hot-patching it.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // True while restoring session from localStorage

  // Restore session from localStorage on first render
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  /**
   * Persist the session returned by the API and update the context state.
   * Both login and register end the same way, so the logic lives in one place.
   */
  const startSession = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  /** Authenticate with email + password and store the returned JWT. */
  const login = async (email, password) => {
    try {
      startSession(await authService.login(email, password));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Create a new regular user account.
   * On success, the user is immediately logged in — no separate login step needed.
   */
  const register = async (email, password, name) => {
    try {
      startSession(await authService.register(email, password, name));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /** Clear session data and remove tokens from localStorage. */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  /** Returns true if the user has a valid token in state. */
  const isAuthenticated = () => !!token;

  /** Returns true if the current user has staff or superuser privileges. */
  const isAdmin = () => user && (user.is_staff || user.is_superuser);

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
