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

const AuthContext = createContext(null);

/** Hook to consume the auth context from any component. */
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

  /** Authenticate with email + password and store the returned JWT. */
  const login = async (email, password) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Login failed");
      }

      const data = await response.json();

      // Persist token and user so the session survives a refresh
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      const data = await response.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

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
