/**
 * Authentication context.
 *
 * Provides login, register, and logout functions to the entire app,
 * plus the current user object and authentication state.
 *
 * The JWT access token and user data are persisted in localStorage so the
 * session survives a page refresh. They are read back while the state is being
 * created — not in an effect — so the very first render already knows who is
 * logged in.
 *
 * Restoring it in an effect meant every reload rendered once as a stranger: the
 * header showed "Iniciá sesión" for a frame and /candidatos mounted the public
 * catalogue before swapping to the shelter's panel, firing requests nobody
 * needed. Reading localStorage is synchronous, so there is nothing to wait for.
 */

import { createContext, useContext, useState } from "react";
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

/**
 * Read the persisted session once, when the provider's state is created.
 *
 * Anything unreadable (a half-written value, a browser that blocks storage)
 * counts as "no session": es preferible pedir que inicie sesión de nuevo antes
 * que dejar la app a medio andar.
 */
const sesionGuardada = () => {
  try {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token || !user) return { token: null, user: null };
    return { token, user: JSON.parse(user) };
  } catch {
    return { token: null, user: null };
  }
};

export function AuthProvider({ children }) {
  const [sesion] = useState(sesionGuardada);
  const [user, setUser] = useState(sesion.user);
  const [token, setToken] = useState(sesion.token);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
