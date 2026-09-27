/**
 * MisSolicitudesPage — shows the current user's visit requests and their status.
 *
 * Status values: 'revision' (pending), 'aceptada' (accepted with date), 'rechazada'.
 * Accessible to any authenticated user.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { Cargando } from "../components/Skeleton";
import { solicitudesService } from "../services/api";
import { formatFechaHora } from "../lib/format";

// Lo que ve quien pidió la visita. El backend distingue "rechazada", pero acá
// no se habla de rechazo: se dice que no pudimos coordinar y se ofrece otra
// puerta, que es más honesto sobre por qué suele pasar y menos frío.
const estadoInfo = {
  revision:  { label: "Recibida" },
  aceptada:  { label: "Visita confirmada" },
  rechazada: { label: "Sin coordinar" },
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
      if (err.message?.includes("404")) {
        setSolicitudes([]);
      } else {
        setError(err.message || "Error al cargar tus solicitudes");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Cargando texto="Cargando tus solicitudes…" />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
        <Button variant="secondary" onClick={load}>Reintentar</Button>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="mb-1 text-3xl font-bold text-mar">Mis solicitudes</h1>
        <p className="mb-8 text-sm text-niebla-oscuro">Seguí el estado de tus pedidos de visita.</p>

        {solicitudes.length === 0 ? (
          <EmptyState
            title="Todavía no pediste ninguna visita"
            description="Mirá el catálogo y pedí conocer al que te guste. Te avisamos cuando el equipo responda."
            action={<Button as={Link} to="/candidatos">Ver candidatos</Button>}
          />
        ) : (
          <div className="space-y-4">
            {solicitudes.map((s) => {
              const info = estadoInfo[s.estado] ?? estadoInfo.revision;
              const fechaFormateada = s.fecha_visita ? formatFechaHora(s.fecha_visita) : null;

              return (
                <div key={s.id} className="rounded-card border border-bruma bg-espuma p-5 shadow-suave">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-mar">
                        {s.candidato_detalle?.nombre || `Animal #${s.candidato}`}
                      </h3>
                      {s.candidato_detalle?.especie && (
                        <p className="text-xs text-niebla-oscuro mt-0.5 capitalize">
                          {s.candidato_detalle.especie}
                        </p>
                      )}
                    </div>
                    <Badge text={info.label} variant={s.estado} />
                  </div>

                  {/* Accepted date — only shown when the request was accepted */}
                  {fechaFormateada && (
                    <div className="mb-3 flex items-center gap-2 rounded-2xl bg-pino/10 px-4 py-2.5">
                      <CalendarCheck className="size-4 shrink-0 text-pino" aria-hidden="true" />
                      <p className="text-sm font-semibold text-pino">
                        Visita: <span className="font-normal text-mar">{fechaFormateada}</span>
                      </p>
                    </div>
                  )}

                  {/* Rejection message */}
                  {s.estado === "rechazada" && (
                    <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5">
                      <p className="text-sm text-red-800">
                        Esta vez no pudimos coordinar la visita.{" "}
                        <Link to="/candidatos" className="font-bold underline underline-offset-2">
                          Mirá quiénes más están esperando
                        </Link>.
                      </p>
                    </div>
                  )}

                  {/* Pending message */}
                  {s.estado === "revision" && (
                    <div className="mb-3 rounded-2xl bg-duna/15 px-4 py-2.5">
                      <p className="text-sm text-mar">
                        En breve un voluntario se pone en contacto para coordinar la visita.
                      </p>
                    </div>
                  )}

                  <p className="mb-2 text-sm italic text-niebla-oscuro">“{s.motivo}”</p>
                  <p className="text-xs text-niebla-oscuro">
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
