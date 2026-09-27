/**
 * AdopcionesLayout — shared layout for the /adopciones section.
 *
 * Renders the section heading and a tabbed navigation bar that lets the
 * user switch between the Summary view (/adopciones) and the History view
 * (/adopciones/historial). The active tab is highlighted automatically by
 * React Router's NavLink component.
 *
 * Child routes are rendered via <Outlet />.
 */

import { Outlet, NavLink } from "react-router-dom";
import Layout from "../../components/Layout";

export default function AdopcionesLayout() {
  return (
    <Layout>
      <div className="flex flex-col">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-mar sm:text-4xl">Adopciones</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-niebla-oscuro">
            Cada número de acá abajo es un animal que hoy duerme en una casa.
          </p>
        </header>

        {/* Tab navigation */}
        <div className="mb-8 flex gap-2">
          <NavLink
            to="/adopciones"
            end
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                isActive
                  ? "bg-bruma/50 text-mar"
                  : "text-niebla-oscuro hover:bg-bruma/30 hover:text-mar"
              }`
            }
          >
            Resumen
          </NavLink>
          <NavLink
            to="/adopciones/historial"
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                isActive
                  ? "bg-bruma/50 text-mar"
                  : "text-niebla-oscuro hover:bg-bruma/30 hover:text-mar"
              }`
            }
          >
            Historial
          </NavLink>
        </div>

        {/* Child route content (AdopcionesResumen or AdopcionesHistorial) */}
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </Layout>
  );
}
