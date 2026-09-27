/**
 * Card — tarjeta de un candidato.
 *
 * Variantes:
 *   catalogo   — la del listado: acciones de admin (adoptar / eliminar) o
 *                "Quiero conocerlo/a" para quien está mirando.
 *   destacado  — la de la Home: solo la foto, el nombre y un link al detalle.
 *
 * La foto va recortada a 4:3 para que todas las tarjetas de una fila midan lo
 * mismo y los botones queden alineados.
 *
 * El catálogo es público, así que la tarjeta la ve gente sin cuenta: en ese
 * caso "Quiero conocerlo" lleva al login y vuelve acá después.
 */

import { Link, useLocation } from "react-router-dom";
import { Heart, PawPrint, Trash2, Undo2 } from "lucide-react";
import Button from "./Button";
import Badge from "./Badge";
import { useAuth } from "../context/AuthContext";
import { formatEdad, sufijoGenero } from "../lib/format";

export default function Card({ candidato, onToggle, onDelete, onSolicitar, variant = "catalogo" }) {
  const { isAdmin, isAuthenticated } = useAuth();
  const location = useLocation();
  const admin = isAdmin();
  const esDestacado = variant === "destacado";

  /** El texto concuerda con el género del animal: conocerlo / conocerla. */
  const textoCta = `Quiero conocer${sufijoGenero(candidato.genero)}`;

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
            className="block aspect-[4/3] w-full object-cover"
            onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center">
            <PawPrint className="size-12 text-niebla/40" aria-hidden="true" />
          </div>
        )}

        <Badge
          text={candidato.especie}
          className="absolute left-3 top-3 bg-espuma/90 capitalize backdrop-blur-sm"
        />

        {candidato.adoptado && (
          <Badge
            text="Adoptado"
            variant="adoptado"
            icon={Heart}
            className="absolute right-3 top-3 bg-espuma/90 backdrop-blur-sm"
          />
        )}
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div>
          <h3 className="text-lg font-bold text-mar">
            <Link
              to={`/candidatos/${candidato.id}`}
              className="rounded transition-colors hover:text-mar-claro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro focus-visible:ring-offset-2 focus-visible:ring-offset-espuma"
            >
              {candidato.nombre}
            </Link>
          </h3>
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
                isAuthenticated() ? (
                  <Button variant="acento" size="sm" className="flex-1" onClick={() => onSolicitar?.(candidato)}>
                    {textoCta}
                  </Button>
                ) : (
                  <Button
                    as={Link}
                    to="/login"
                    state={{ from: location, candidato: candidato.id }}
                    variant="acento"
                    size="sm"
                    className="flex-1"
                  >
                    {textoCta}
                  </Button>
                )
              )
            )}
          </div>
        )}
      </div>
    </article>
  );
}
