/**
 * MisSolicitudesPage — shows the current user's visit requests and their status.
 *
 * Status values: 'revision' (pending), 'aceptada' (accepted with date), 'rechazada'.
 * Accessible to any authenticated user.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Button from "../components/Button";
import { solicitudesService } from "../services/api";

const estadoInfo = {
  revision:  { label: "En revisión", cls: "bg-yellow-100 text-yellow-800" },
  aceptada:  { label: "Aceptada",    cls: "bg-green-100 text-green-800"   },
  rechazada: { label: "Rechazada",   cls: "bg-red-100 text-red-700"       },
};

export default function MisSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await solicitudesService.getAll();
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error al cargar tus solicitudes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3 text-glacial">
            <span className="text-4xl animate-pulse">🐾</span>
            <span className="text-sm font-medium">Cargando solicitudes...</span>
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
          onClick={load}
          className="px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest-dark text-sm font-semibold"
        >
          Reintentar
        </button>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-extrabold text-deep mb-1">Mis solicitudes</h1>
        <p className="text-glacial text-sm mb-6">Seguí el estado de tus solicitudes de visita.</p>

        {solicitudes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] text-glacial gap-3">
            <span className="text-5xl">🐾</span>
            <p className="font-medium text-base">Todavía no tenés solicitudes.</p>
            <p className="text-sm">Explorá los candidatos y pedí una visita.</p>
            <Link to="/candidatos">
              <Button className="mt-2">Ver candidatos</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {solicitudes.map((s) => {
              const info = estadoInfo[s.estado] ?? estadoInfo.revision;
              const fechaFormateada = s.fecha_visita
                ? new Date(s.fecha_visita).toLocaleDateString("es-AR", {
                    year: "numeric", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })
                : null;

              return (
                <div key={s.id} className="bg-snowmelt rounded-2xl border border-rim shadow-sm p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-deep text-base">
                        {s.candidato_detalle?.nombre || `Animal #${s.candidato}`}
                      </h3>
                      {s.candidato_detalle?.especie && (
                        <p className="text-xs text-glacial mt-0.5 capitalize">
                          {s.candidato_detalle.especie}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${info.cls}`}>
                      {info.label}
                    </span>
                  </div>

                  {/* Accepted date — only shown when the request was accepted */}
                  {fechaFormateada && (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-3">
                      <p className="text-sm text-green-800 font-medium">
                        📅 Fecha de visita: <span className="font-normal">{fechaFormateada}</span>
                      </p>
                    </div>
                  )}

                  {/* Rejection message */}
                  {s.estado === "rechazada" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-3">
                      <p className="text-sm text-red-700">
                        Tu solicitud fue rechazada. Podés intentar con otro candidato.
                      </p>
                    </div>
                  )}

                  {/* Pending message */}
                  {s.estado === "revision" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-3">
                      <p className="text-sm text-yellow-800">
                        Tu solicitud está siendo revisada por el equipo del refugio.
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-glacial italic mb-2">"{s.motivo}"</p>
                  <p className="text-xs text-glacial/70">
                    Solicitada el {new Date(s.fecha_creacion).toLocaleDateString("es-AR")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
