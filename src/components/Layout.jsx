/**
 * Layout — shared page shell used by every route.
 *
 * Renders the top navigation bar, the main content area, and the footer.
 * Navigation items are conditionally shown based on authentication status
 * and admin privileges:
 *   - Unauthenticated: only the Login link is shown.
 *   - Authenticated regular user: Candidates and Adoptions.
 *   - Authenticated admin: also sees New Candidate, Visits, and New Visit.
 */

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";

/** Single navigation link with active-state styling. */
function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `text-sm font-semibold transition-colors pb-0.5 ${
          isActive
            ? "text-sun border-b-2 border-sun"
            : "text-rim hover:text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  const authed = isAuthenticated();

  return (
    <div className="min-h-screen flex flex-col bg-sun">

      {/* ── Header / Navigation ── */}
      <header className="bg-deep text-white px-6 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">

          {/* Brand logo */}
          <NavLink to="/" className="flex items-center gap-2 text-white hover:text-sun transition-colors">
            <span className="text-2xl">🐾</span>
            <span className="font-extrabold text-lg tracking-tight">Refugio del Mar</span>
          </NavLink>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {authed ? (
              <>
                <NavItem to="/">Home</NavItem>
                <NavItem to="/candidatos">Candidates</NavItem>
                {isAdmin() && (
                  <>
                    <NavItem to="/nuevo">New Candidate</NavItem>
                    <NavItem to="/visitas">Visits</NavItem>
                    <NavItem to="/nueva-visita">New Visit</NavItem>
                  </>
                )}
                <NavItem to="/adopciones">Adoptions</NavItem>
                {/* Display the logged-in user's email */}
                <span className="text-xs text-rim ml-2">{user?.email || user?.name}</span>
                <Button onClick={handleLogout} variant="secondary" className="py-1 px-3 text-xs">
                  Log Out
                </Button>
              </>
            ) : (
              <NavItem to="/login">Log In</NavItem>
            )}
          </nav>

          {/* Hamburger button — visible on mobile only */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile slide-down menu */}
        {menuOpen && (
          <div className="md:hidden mt-3 pb-3 border-t border-glacial/30 flex flex-col gap-3 pt-3">
            {authed ? (
              <>
                <NavLink to="/" onClick={() => setMenuOpen(false)} className="text-sm text-rim hover:text-white font-semibold">Home</NavLink>
                <NavLink to="/candidatos" onClick={() => setMenuOpen(false)} className="text-sm text-rim hover:text-white font-semibold">Candidates</NavLink>
                {isAdmin() && (
                  <>
                    <NavLink to="/nuevo" onClick={() => setMenuOpen(false)} className="text-sm text-rim hover:text-white font-semibold">New Candidate</NavLink>
                    <NavLink to="/visitas" onClick={() => setMenuOpen(false)} className="text-sm text-rim hover:text-white font-semibold">Visits</NavLink>
                    <NavLink to="/nueva-visita" onClick={() => setMenuOpen(false)} className="text-sm text-rim hover:text-white font-semibold">New Visit</NavLink>
                  </>
                )}
                <NavLink to="/adopciones" onClick={() => setMenuOpen(false)} className="text-sm text-rim hover:text-white font-semibold">Adoptions</NavLink>
                <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 text-left font-semibold">Log Out</button>
              </>
            ) : (
              <NavLink to="/login" onClick={() => setMenuOpen(false)} className="text-sm text-rim hover:text-white font-semibold">Log In</NavLink>
            )}
          </div>
        )}
      </header>

      {/* ── Main content area ── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-deep text-rim text-center py-4 text-sm">
        © {new Date().getFullYear()} Refugio del Mar — All rights reserved
      </footer>

    </div>
  );
}
