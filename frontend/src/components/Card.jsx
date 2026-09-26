/**
 * Card — tarjeta de un candidato.
 *
 * Variantes:
 *   catalogo   — la del listado: acciones de admin (adoptar / eliminar) o
 *                "Quiero conocerlo/a" para un usuario común.
 *   destacado  — la de la Home: solo la foto, el nombre y un link al detalle.
 *
 * La imagen conserva su alto natural para no recortar caras de animales; por
 * eso el catálogo la acomoda en columnas tipo masonry.
 */

import { Link } from "react-router-dom";
import { Heart, PawPrint, Trash2, Undo2 } from "lucide-react";
import Button from "./Button";
import Badge from "./Badge";
import { useAuth } from "../context/AuthContext";
import { formatEdad, sufijoGenero } from "../lib/format";

export default function Card({ candidato, onToggle, onDelete, onSolicitar, variant = "catalogo" }) {
  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const esDestacado = variant === "destacado";

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-bruma/60 bg-espuma shadow-suave transition-shadow duration-300 hover:shadow-elevada">

      {/* ── Foto ── */}
      <div className="relative w-full bg-bruma/30">
        {candidato.imagen ? (
          <img
            src={candidato.imagen}
            alt={`${candidato.nombre}, ${candidato.especie.toLowerCase()} en adopción`}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div className="flex h-52 items-center justify-center">
            <PawPrint className="size-12 text-niebla/40" aria-hidden="true" />
          </div>
        )}

        <Badge
          text={candidato.especie}
          className="absolute left-3 top-3 bg-espuma/90 capitalize backdrop-blur-sm"
        />

        {candidato.adoptado && (
          <Badge text="Adoptado" variant="adoptado" icon={Heart} className="absolute right-3 top-3 bg-espuma/90 backdrop-blur-sm" />
        )}
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div>
          <h3 className="text-lg font-bold text-mar">{candidato.nombre}</h3>
          <p className="mt-0.5 text-xs text-niebla-oscuro">
            {formatEdad(candidato.edad)}
            {candidato.genero && candidato.genero !== "desconocido" && (
              <span className="capitalize"> · {candidato.genero}</span>
            )}
          </p>
        </div>

        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-niebla-oscuro">
          {candidato.descripcion}
        </p>

        {/* ── Acciones ── */}
        {esDestacado ? (
          <Button as={Link} to={`/candidatos/${candidato.id}`} variant="secondary" size="sm" className="mt-3 w-full">
            Conocé a {candidato.nombre}
          </Button>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button as={Link} to={`/candidatos/${candidato.id}`} variant="secondary" size="sm" className="flex-1">
              Ver detalle
            </Button>

            {admin ? (
              <>
                <Button
                  variant={candidato.adoptado ? "ghost" : "primary"}
                  size="sm"
                  className="flex-1"
                  icon={candidato.adoptado ? Undo2 : Heart}
                  onClick={() => onToggle?.(candidato.id)}
                >
                  {candidato.adoptado ? "Revertir" : "Adoptado"}
                </Button>
                {onDelete && (
                  <Button
                    variant="danger"
                    size="sm"
                    aria-label={`Eliminar a ${candidato.nombre}`}
                    onClick={() => {
                      if (window.confirm(`¿Seguro que querés eliminar a ${candidato.nombre}?`)) {
                        onDelete(candidato.id);
                      }
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                )}
              </>
            ) : (
              !candidato.adoptado && (
                <Button variant="acento" size="sm" className="flex-1" onClick={() => onSolicitar?.(candidato)}>
                  Quiero conocer{sufijoGenero(candidato.genero)}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </article>
  );
}
