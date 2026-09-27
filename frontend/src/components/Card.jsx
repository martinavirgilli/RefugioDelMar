/**
 * Card — tarjeta de un candidato, para quien está buscando adoptar.
 *
 * Variantes:
 *   catalogo   — la del listado: "Ver detalle" y "Quiero conocerlo/a".
 *   destacado  — la de la Home: solo la foto, el nombre y un link al detalle.
 *
 * No tiene acciones de administración: el refugio administra sus fichas desde
 * PanelCandidatos, que muestra una lista pensada para eso.
 *
 * La foto va recortada a 4:3 para que todas las tarjetas de una fila midan lo
 * mismo y los botones queden alineados.
 *
 * El catálogo es público, así que la tarjeta la ve gente sin cuenta: en ese
 * caso "Quiero conocerlo" lleva al login y vuelve acá después.
 */

import { Link, useLocation } from "react-router-dom";
import { Heart, PawPrint, Sun } from "lucide-react";
import Button from "./Button";
import Badge from "./Badge";
import { useAuth } from "../context/AuthContext";
import { formatEtapa, sufijoGenero } from "../lib/format";

export default function Card({ candidato, onSolicitar, variant = "catalogo" }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
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
            {formatEtapa(candidato.etapa)}
            {candidato.genero && candidato.genero !== "desconocido" && (
              <span className="capitalize"> · {candidato.genero}</span>
            )}
          </p>
          {candidato.apto_salida && !candidato.adoptado && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-atardecer-oscuro">
              <Sun className="size-3.5 shrink-0" aria-hidden="true" />
              Puede salir por el día
            </p>
          )}
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

            {!candidato.adoptado && (
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
            )}
          </div>
        )}
      </div>
    </article>
  );
}
