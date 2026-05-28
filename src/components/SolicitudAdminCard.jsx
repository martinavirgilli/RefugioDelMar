/**
 * SolicitudAdminCard — displays a single visit request in the admin VisitasPage.
 *
 * Pending requests (estado='revision') show Accept/Reject buttons.
 * Accepting opens an inline date picker; the date is required to confirm.
 */

import { useState } from "react";
import { solicitudesService } from "../services/api";
import Button from "./Button";

const estadoStyles = {
  revision:  { border: "border-l-yellow-400", badge: "bg-yellow-100 text-yellow-800", label: "En revisión" },
  aceptada:  { border: "border-l-forest",     badge: "bg-green-100 text-green-800",   label: "Aceptada"    },
  rechazada: { border: "border-l-red-400",    badge: "bg-red-100 text-red-700",       label: "Rechazada"   },
};

export default function SolicitudAdminCard({ solicitud, onUpdate }) {
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [fechaVisita, setFechaVisita] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const styles = estadoStyles[solicitud.estado] ?? estadoStyles.revision;

  const fechaFormateada = solicitud.fecha_visita
    ? new Date(solicitud.fecha_visita).toLocaleDateString("es-AR", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  const handleAceptar = async () => {
    if (!fechaVisita) {
      setError("Debes fijar una fecha de visita.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fechaISO = new Date(fechaVisita).toISOString();
      await solicitudesService.aceptar(solicitud.id, fechaISO);
      setShowAcceptForm(false);
      onUpdate?.();
    } catch (err) {
      setError(err.message || "Error al aceptar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (!window.confirm(`¿Rechazar la solicitud de ${solicitud.nombre_apellido}?`)) return;
    setLoading(true);
    try {
      await solicitudesService.rechazar(solicitud.id);
      onUpdate?.();
    } catch (err) {
      setError(err.message || "Error al rechazar la solicitud.");
      setLoading(false);
    }
  };

  return (
    <div className={`bg-snowmelt rounded-2xl border border-rim border-l-4 ${styles.border} shadow-sm hover:shadow-md transition-shadow p-5`}>

      {/* Visitor info & status */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-deep text-base">{solicitud.nombre_apellido}</h3>
          <p className="text-xs text-glacial mt-0.5">{solicitud.email}</p>
          {solicitud.telefono && (
            <p className="text-xs text-glacial">📞 {solicitud.telefono}</p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${styles.badge}`}>
          {styles.label}
        </span>
      </div>

      {/* Animal + accepted date */}
      <div className="space-y-1 text-sm mb-3">
        <p className="text-glacial">
          <span className="font-semibold text-deep">Animal: </span>
          {solicitud.candidato_detalle?.nombre || `ID ${solicitud.candidato}`}
          {solicitud.candidato_detalle?.especie && (
            <span className="text-glacial/70 capitalize"> — {solicitud.candidato_detalle.especie}</span>
          )}
        </p>
        {fechaFormateada && (
          <p className="text-glacial">
            <span className="font-semibold text-deep">Fecha fijada: </span>
            {fechaFormateada}
          </p>
        )}
      </div>

      {/* Motivo */}
      <div className="bg-rim/20 rounded-lg p-3 mb-3">
        <p className="text-xs font-semibold text-deep mb-1">Motivo de la visita</p>
        <p className="text-sm text-glacial italic">"{solicitud.motivo}"</p>
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {/* Action buttons — only for pending requests */}
      {solicitud.estado === "revision" && !showAcceptForm && (
        <div className="flex gap-2 mt-3">
          <Button className="text-xs py-1.5 flex-1" onClick={() => setShowAcceptForm(true)} disabled={loading}>
            Aceptar
          </Button>
          <Button variant="danger" className="text-xs py-1.5 flex-1" onClick={handleRechazar} disabled={loading}>
            Rechazar
          </Button>
        </div>
      )}

      {/* Inline date picker shown when accepting */}
      {showAcceptForm && (
        <div className="mt-3 bg-sun/40 rounded-xl p-4 border border-rim">
          <label className="text-xs font-semibold text-deep block mb-1">Fecha de visita *</label>
          <input
            type="datetime-local"
            value={fechaVisita}
            onChange={(e) => setFechaVisita(e.target.value)}
            min={getMinDate()}
            className="w-full border border-rim px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest bg-snowmelt mb-3"
          />
          <div className="flex gap-2">
            <Button className="text-xs py-1.5 flex-1" onClick={handleAceptar} disabled={loading}>
              {loading ? "Aceptando..." : "Confirmar fecha"}
            </Button>
            <Button
              variant="secondary"
              className="text-xs py-1.5"
              onClick={() => { setShowAcceptForm(false); setFechaVisita(""); setError(""); }}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
