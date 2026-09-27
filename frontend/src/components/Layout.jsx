/**
 * Layout — el marco que comparten todas las páginas.
 *
 * Header claro y translúcido sobre arena (no la barra oscura de la v1), menú
 * móvil tipo drawer y footer en mar separado por una ola.
 *
 * Los links visibles dependen de la sesión:
 *   cualquiera        → Inicio, Candidatos, Adopciones (el catálogo es público)
 *   usuario común     → + Mis solicitudes
 *   admin             → + Visitas, Quieren ayudar, Nuevo candidato
 * Esconder un link no es seguridad: cada acción de admin se valida en el backend.
 */

import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import Logo from "./Logo";

/** Link del nav de escritorio, con subrayado suave cuando está activo. */
function NavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        "rounded-full px-3 py-1.5 text-sm font-bold transition-colors duration-200 " +
        (isActive ? "bg-bruma/50 text-mar" : "text-niebla-oscuro hover:bg-bruma/30 hover:text-mar")
      }
    >
      {children}
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const botonMenuRef = useRef(null);
  const drawerRef = useRef(null);

  const authed = isAuthenticated();
  const admin = isAdmin();

  const cerrarMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    cerrarMenu();
    navigate("/login");
  };

  // El drawer se cierra al cambiar de ruta
  useEffect(cerrarMenu, [location.pathname]);

  // Mientras el drawer está abierto: Esc lo cierra, el foco entra adentro,
  // el fondo no scrollea y al cerrar el foco vuelve al botón que lo abrió.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    // Se guarda el botón ahora: en la limpieza el ref ya podría apuntar a otro nodo
    const botonQueAbrio = botonMenuRef.current;

    document.addEventListener("keydown", onKeyDown);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector("a, button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowPrevio;
      botonQueAbrio?.focus();
    };
  }, [menuOpen]);

  /** Los mismos links para escritorio y para el drawer. */
  const links = [
    { to: "/", label: "Inicio" },
    { to: "/candidatos", label: "Candidatos" },
    { to: "/adopciones", label: "Adopciones" },
    ...(admin
      ? [
          { to: "/visitas", label: "Visitas" },
          { to: "/colaboraciones", label: "Quieren ayudar" },
          { to: "/nuevo", label: "Nuevo candidato" },
        ]
      : []),
    ...(authed && !admin ? [{ to: "/mis-solicitudes", label: "Mis solicitudes" }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-arena">

      {/* Salto de navegación: lo primero que encuentra el teclado */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-mar focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white"
      >
        Saltar al contenido
      </a>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-bruma/60 bg-arena/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">

          <NavLink
            to="/"
            className="flex shrink-0 items-center gap-2.5 rounded-full text-mar transition-opacity hover:opacity-80"
          >
            <Logo className="h-9 w-9 shrink-0" olaClassName="text-niebla" />
            <span className="font-display text-lg font-bold leading-tight tracking-tight">
              Refugio del Mar
            </span>
          </NavLink>

          {/* Nav de escritorio */}
          <nav aria-label="Navegación principal" className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <NavItem key={l.to} to={l.to}>{l.label}</NavItem>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            {authed ? (
              <>
                <span className="max-w-[14ch] truncate text-xs text-niebla-oscuro" title={user?.email}>
                  {user?.name || user?.email}
                </span>
                <Button variant="secondary" size="sm" icon={LogOut} onClick={handleLogout}>
                  Salir
                </Button>
              </>
            ) : (
              <Button as={NavLink} to="/login" size="sm">Iniciá sesión</Button>
            )}
          </div>

          {/* Botón del drawer — solo en pantallas chicas */}
          <button
            ref={botonMenuRef}
            type="button"
            className="rounded-full p-2 text-mar transition-colors hover:bg-bruma/40 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            aria-controls="menu-movil"
          >
            <Menu className="size-6" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ── Drawer móvil ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Fondo: clickearlo cierra. No es foco de teclado porque Esc ya cierra. */}
          <div
            className="absolute inset-0 bg-mar/50 backdrop-blur-sm"
            onClick={cerrarMenu}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            id="menu-movil"
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="absolute right-0 top-0 flex h-full w-[min(20rem,85vw)] flex-col gap-1 overflow-y-auto bg-arena p-5 shadow-elevada"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-base font-bold text-mar">Menú</span>
              <button
                type="button"
                onClick={cerrarMenu}
                aria-label="Cerrar menú"
                className="rounded-full p-2 text-mar transition-colors hover:bg-bruma/40"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Navegación principal" className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={cerrarMenu}
                  className={({ isActive }) =>
                    "rounded-2xl px-4 py-3 text-sm font-bold transition-colors " +
                    (isActive ? "bg-bruma/50 text-mar" : "text-niebla-oscuro hover:bg-bruma/30 hover:text-mar")
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto border-t border-bruma pt-4">
              {authed ? (
                <>
                  <p className="mb-3 truncate px-4 text-xs text-niebla-oscuro">{user?.email}</p>
                  <Button variant="secondary" icon={LogOut} className="w-full" onClick={handleLogout}>
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <Button as={NavLink} to="/login" className="w-full" onClick={cerrarMenu}>
                  Iniciá sesión
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Contenido ── */}
      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 text-arena">
        {/* Divisor de ola: pura decoración, invisible para el lector de pantalla */}
        <svg
          viewBox="0 0 1440 80"
          className="block h-12 w-full text-mar sm:h-16"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 40c120-32 240-32 360 0s240 32 360 0 240-32 360 0 240 32 360 0v40H0Z"
            fill="currentColor"
          />
        </svg>

        <div className="bg-mar">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">

            <div>
              <div className="flex items-center gap-2.5">
                <Logo className="h-9 w-9 shrink-0" olaClassName="text-bruma" />
                <span className="font-display text-lg font-bold">Refugio del Mar</span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-bruma">
                Rescatamos, cuidamos y buscamos una casa para los animales de la costa.
                Desde 2019, en Pinamar.
              </p>
            </div>

            <div>
              <h2 className="font-display text-base font-bold">Visitanos</h2>
              <ul className="mt-3 space-y-2.5 text-sm text-bruma">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>Av. de los Pinos 1450, Pinamar,<br />Buenos Aires</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="size-4 shrink-0" aria-hidden="true" />
                  <a href="tel:+542254400000" className="rounded hover:text-white hover:underline">
                    +54 2254 40-0000
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  <a href="mailto:hola@refugiodelmar.org" className="rounded hover:text-white hover:underline">
                    hola@refugiodelmar.org
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-base font-bold">Horarios</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-bruma">
                <li>Lunes a viernes, 10 a 17 h</li>
                <li>Sábados, 10 a 13 h</li>
                <li>Las visitas se coordinan con turno.</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-niebla/40">
            <p className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-bruma sm:px-6">
              © {new Date().getFullYear()} Refugio del Mar · Proyecto de portafolio.
              Los animales, las personas y los datos de contacto son ficticios.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
