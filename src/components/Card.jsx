/**
 * Card — displays a single candidate in the grid on CandidatosPage.
 *
 * Props:
 *   candidato — the candidate object from the API
 *   onToggle  — callback to toggle the adopted/available status
 *   onDelete  — callback to delete the candidate (only rendered when provided,
 *               so it's hidden from regular users via the parent page)
 */

import { Link } from "react-router-dom";
import Button from "./Button";
import { useAuth } from "../context/AuthContext";

export default function Card({ candidato, onToggle, onDelete, onSolicitar }) {
  const { isAdmin } = useAuth();
  const admin = isAdmin();
  return (
    <div className="bg-snowmelt rounded-2xl border border-rim/50 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">

      {/* ── Image section — natural height so tall/wide images are never cropped ── */}
      <div className="relative w-full bg-rim/30">
        {candidato.imagen ? (
          <img
            src={candidato.imagen}
            alt={candidato.nombre}
            className="w-full h-auto block"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          // Placeholder shown when no image URL is available
          <div className="h-48 flex items-center justify-center">
            <span className="text-5xl opacity-20">🐾</span>
          </div>
        )}

        {/* Species badge overlaid on the image */}
        <span className="absolute top-2 left-2 bg-snowmelt/90 text-deep text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-sm capitalize">
          {candidato.especie}
        </span>

        {/* "Adopted" ribbon — only shown when the animal has been adopted */}
        {candidato.adoptado && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            Adoptado
          </div>
        )}
      </div>

      {/* ── Card body ── */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div>
          <h2 className="text-base font-bold text-deep">{candidato.nombre}</h2>
          <p className="text-xs text-glacial mt-0.5">
            {candidato.edad === 0 ? "Menos de 1 año" : `${candidato.edad} ${candidato.edad === 1 ? "año" : "años"}`}
            {candidato.genero && candidato.genero !== "desconocido" && (
              <span className="ml-1 capitalize">· {candidato.genero}</span>
            )}
          </p>
        </div>

        {/* Description is clamped to 3 lines to keep cards uniform in height */}
        <p className="text-sm text-glacial leading-relaxed line-clamp-3 flex-1">
          {candidato.descripcion}
        </p>

        {/* ── Action buttons ── */}
        <div className="flex gap-2 flex-wrap pt-2">
          <Link to={`/candidatos/${candidato.id}`} className="flex-1">
            <Button variant="secondary" className="w-full text-xs py-1.5">
              Ver detalles
            </Button>
          </Link>

          {admin ? (
            // Admin: adopt/revert toggle + delete
            <>
              <Button
                variant={candidato.adoptado ? "secondary" : "primary"}
                className="flex-1 text-xs py-1.5"
                onClick={() => onToggle && onToggle(candidato.id)}
              >
                {candidato.adoptado ? "Revertir" : "Adoptar"}
              </Button>
              {onDelete && (
                <Button
                  variant="danger"
                  className="text-xs py-1.5 px-3"
                  onClick={() => {
                    if (window.confirm(`¿Seguro que querés eliminar a ${candidato.nombre}?`)) {
                      onDelete(candidato.id);
                    }
                  }}
                >
                  Eliminar
                </Button>
              )}
            </>
          ) : (
            // Regular user: request a visit (only for non-adopted animals)
            !candidato.adoptado && (
              <Button
                variant="primary"
                className="flex-1 text-xs py-1.5"
                onClick={() => onSolicitar && onSolicitar(candidato)}
              >
                Solicitar visita
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
