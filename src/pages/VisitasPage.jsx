/**
 * VisitasPage — admin view for managing all visit activity.
 *
 * Sections:
 *   1. Visit requests (SolicitudVisita) — pending ones show accept/reject actions.
 *   2. Manually scheduled visits (Visita model) — classic VisitaCard view.
 *   3. "Programar visita manualmente" link at the bottom.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import VisitaCard from "../components/VisitaCard";
import SolicitudAdminCard from "../components/SolicitudAdminCard";
import Button from "../components/Button";
import { visitasService, solicitudesService } from "../services/api";

export default function VisitasPage() {
  const [visitas, setVisitas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [visitasData, solicitudesData] = await Promise.all([
        visitasService.getAll(),
        solicitudesService.getAll(),
      ]);
      setVisitas(Array.isArray(visitasData) ? visitasData : []);
      setSolicitudes(Array.isArray(solicitudesData) ? solicitudesData : []);
    } catch (err) {
      if (err.message?.includes("404")) {
        setSolicitudes([]);
      } else {
        setError(err.message || "Error al cargar los datos");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVisita = async (id) => {
    try {
      await visitasService.delete(id);
      await loadAll();
    } catch (err) {
      setError(err.message || "Error al eliminar la visita");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3 text-glacial">
            <span className="text-4xl animate-pulse">🐾</span>
            <span className="text-sm font-medium">Cargando...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
        <button
          onClick={loadAll}
          className="px-4 py-2 bg-glacial text-white rounded-lg hover:bg-glacial-dark text-sm font-semibold transition-colors"
        >
          Reintentar
        </button>
      </Layout>
    );
  }

  const pendientes = solicitudes.filter((s) => s.estado === "revision");
  const procesadas = solicitudes.filter((s) => s.estado !== "revision");

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-8 text-deep">Gestión de visitas</h1>

      {/* ── Section 1: Visit requests ── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-extrabold text-deep">Solicitudes de visita</h2>
          {pendientes.length > 0 && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {solicitudes.length === 0 ? (
          <p className="text-glacial text-sm">No hay solicitudes de visita aún.</p>
        ) : (
          <>
            {pendientes.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-3">
                  Pendientes de aprobación
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendientes.map((s) => (
                    <SolicitudAdminCard key={s.id} solicitud={s} onUpdate={loadAll} />
                  ))}
                </div>
              </div>
            )}

            {procesadas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-glacial uppercase tracking-wide mb-3">
                  Procesadas
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {procesadas.map((s) => (
                    <SolicitudAdminCard key={s.id} solicitud={s} onUpdate={loadAll} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Section 2: Manually scheduled visits ── */}
      <section className="mb-10">
        <h2 className="text-lg font-extrabold text-deep mb-4">Visitas programadas manualmente</h2>
        {visitas.length === 0 ? (
          <p className="text-glacial text-sm">No hay visitas manuales próximas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitas.map((visita) => (
              <VisitaCard
                key={visita.id}
                visita={visita}
                onDelete={handleDeleteVisita}
                onUpdate={loadAll}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Section 3: Manual entry at the bottom ── */}
      <div className="border-t border-rim pt-6">
        <p className="text-sm text-glacial mb-3">
          ¿Necesitás cargar una cita a mano? Usá el formulario de programación manual.
        </p>
        <Link to="/nueva-visita">
          <Button variant="secondary">+ Programar visita manualmente</Button>
        </Link>
      </div>
    </Layout>
  );
}
