/**
 * VisitaCard — displays a single scheduled visit on the VisitasPage.
 *
 * Left-border color and status badge color change based on the visit state:
 *   planificada (scheduled) → forest green
 *   realizada   (completed) → green
 *   cancelada   (cancelled) → rim grey
 *
 * Admins can add a final comment to a visit, which marks it as 'realizada'.
 * Once a comment exists the action buttons are hidden.
 */

import Button from "./Button";
import { useState } from "react";
import { visitasService } from "../services/api";

// Left-border accent color per visit status
const borderByEstado = {
  planificada: "border-l-forest",
  realizada:   "border-l-green-400",
  cancelada:   "border-l-rim",
};

// Status badge colors
const labelByEstado = {
  planificada: "bg-sun text-deep",
  realizada:   "bg-green-100 text-green-800",
  cancelada:   "bg-snowmelt text-glacial",
};

export default function VisitaCard({ visita, onDelete, onUpdate }) {
  const [showComentarioForm, setShowComentarioForm] = useState(false);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Submit the final comment, then refresh the visits list via onUpdate. */
  const handleAgregarComentario = async () => {
    if (!comentario.trim()) {
      setError("El comentario no puede estar vacío");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await visitasService.agregarComentario(visita.id, comentario);
      setShowComentarioForm(false);
      setComentario("");
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message || "Error al agregar el comentario");
    } finally {
      setLoading(false);
    }
  };

  // Format the visit date for the Argentine locale
  const fechaFormateada = new Date(visita.fecha_visita).toLocaleDateString("es-AR", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const borderCls = borderByEstado[visita.estado] ?? "border-l-rim";
  const estadoCls = labelByEstado[visita.estado] ?? labelByEstado.planificada;

  return (
    <div className={`bg-snowmelt rounded-2xl border border-rim border-l-4 ${borderCls} shadow-sm hover:shadow-md transition-shadow p-5`}>

      {/* ── Visitor info & status badge ── */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-deep text-base">{visita.visitante_nombre}</h3>
          <p className="text-xs text-glacial mt-0.5">{visita.visitante_email}</p>
          {visita.visitante_telefono && (
            <p className="text-xs text-glacial">📞 {visita.visitante_telefono}</p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${estadoCls}`}>
          {visita.estado}
        </span>
      </div>

      {/* ── Visit details ── */}
      <div className="space-y-1 text-sm mb-3">
        <p className="text-glacial">
          <span className="font-semibold text-deep">Animal: </span>
          {/* Show the nested candidate name if available, otherwise fall back to ID */}
          {visita.candidato_detalle?.nombre || `ID ${visita.candidato}`}
        </p>
        <p className="text-glacial">
          <span className="font-semibold text-deep">Fecha: </span>
          {fechaFormateada}
        </p>
        {visita.notas && (
          <p className="text-glacial italic text-xs mt-1">"{visita.notas}"</p>
        )}
      </div>

      {/* Final comment box — shown once an admin has completed the visit */}
      {visita.comentario_final && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-green-800 mb-1">Comentario final</p>
          <p className="text-sm text-green-700">{visita.comentario_final}</p>
        </div>
      )}

      {/* ── Action buttons (hidden once a comment exists) ── */}
      {!visita.comentario_final && !showComentarioForm && (
        <div className="flex gap-2 mt-3">
          <Button variant="secondary" className="text-xs py-1.5" onClick={() => setShowComentarioForm(true)}>
            Agregar comentario
          </Button>
          <Button
            variant="danger"
            className="text-xs py-1.5"
            onClick={() => {
              if (window.confirm(`¿Eliminar la visita de ${visita.visitante_nombre}?`)) {
                onDelete && onDelete(visita.id);
              }
            }}
          >
            Eliminar
          </Button>
        </div>
      )}

      {/* ── Inline comment form ── */}
      {showComentarioForm && (
        <div className="mt-3 bg-sun/40 rounded-xl p-4 border border-rim">
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Escribí las notas finales sobre esta visita..."
            className="w-full p-3 border border-rim rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest resize-none bg-snowmelt"
            rows={3}
          />
          <div className="flex gap-2 mt-2">
            <Button className="text-xs py-1.5" onClick={handleAgregarComentario} disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              variant="secondary"
              className="text-xs py-1.5"
              onClick={() => { setShowComentarioForm(false); setComentario(""); setError(""); }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
