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
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-3xl font-bold mb-6 text-glacial">
          Adoptions
        </h1>

        {/* Tab navigation */}
        <div className="flex gap-6 mb-8">
          <NavLink
            to="/adopciones"
            end
            className={({ isActive }) =>
              `pb-2 text-lg font-medium transition-colors ${
                isActive
                  ? "text-glacial border-b-4 border-glacial"
                  : "text-glacial/50 hover:text-glacial"
              }`
            }
          >
            Summary
          </NavLink>
          <NavLink
            to="/adopciones/historial"
            className={({ isActive }) =>
              `pb-2 text-lg font-medium transition-colors ${
                isActive
                  ? "text-glacial border-b-4 border-glacial"
                  : "text-glacial/50 hover:text-glacial"
              }`
            }
          >
            History
          </NavLink>
        </div>

        {/* Child route content (AdopcionesResumen or AdopcionesHistorial) */}
        <div className="w-full max-w-4xl">
          <Outlet />
        </div>
      </div>
    </Layout>
  );
}
