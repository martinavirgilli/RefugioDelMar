/**
 * AdopcionesHistorial — todos los que ya se fueron con una familia.
 *
 * Para quien mira, es la lista de finales felices: quién se fue y cuándo.
 *
 * Para el refugio es además la pantalla donde se corrige una adopción. La fecha
 * antes se deducía de `fecha_actualizacion`, así que cualquier edición de la
 * ficha la corría; ahora es un campo propio y se puede arreglar a mano. Desde
 * cada fila se cargan también las reseñas que manda la familia.
 *
 * Las reseñas se piden recién al abrir una fila: son una consulta por animal y
 * casi nunca se abren todas.
 */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, PawPrint, PencilLine, Quote, Save } from "lucide-react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import Input from "../../components/Input";
import ResenasAdmin from "../../components/ResenasAdmin";
import { Cargando } from "../../components/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { adopcionesService, candidatosService } from "../../services/api";
import { formatEtapa, formatFecha } from "../../lib/format";

/** Una fila del historial, con el panel de edición cuando es admin. */
function Fila({ candidato, admin, onCambio }) {
  const [abierta, setAbierta] = useState(false);
  const [resenas, setResenas] = useState(null);
  const [fecha, setFecha] = useState(candidato.fecha_adopcion?.slice(0, 10) ?? "");
  const [adoptante, setAdoptante] = useState(candidato.adoptante ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cargarResenas = useCallback(async () => {
    try {
      setResenas(await candidatosService.getResenas(candidato.id));
    } catch (err) {
      setError(err.message || "No pudimos cargar las reseñas");
      setResenas([]);
    }
  }, [candidato.id]);

  const abrir = async (estaAbierta) => {
    setAbierta(estaAbierta);
    if (estaAbierta && resenas === null) await cargarResenas();
  };

  const guardar = async () => {
    setError("");
    try {
      setGuardando(true);
      await candidatosService.patch(candidato.id, {
        fecha_adopcion: fecha || null,
        adoptante: adoptante.trim(),
      });
      await onCambio?.();
    } catch (err) {
      setError(err.message || "No pudimos guardar los cambios");
    } finally {
      setGuardando(false);
    }
  };

  const datos = (
    <>
      {candidato.imagen ? (
        <img
          src={candidato.imagen}
          alt=""
          loading="lazy"
          className="size-14 shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-bruma/30">
          <PawPrint className="size-5 text-niebla/50" aria-hidden="true" />
        </span>
      )}

      <div className="min-w-0 flex-1 text-left">
        <p className="flex flex-wrap items-center gap-2 font-bold text-mar">
          {candidato.nombre}
          {candidato.resenas > 0 && (
            <Badge text={`${candidato.resenas} reseña${candidato.resenas > 1 ? "s" : ""}`} icon={Quote} />
          )}
        </p>
        <p className="mt-0.5 text-xs text-niebla-oscuro">
          <span className="capitalize">{candidato.especie}</span>
          {" · "}{formatEtapa(candidato.etapa)}
          {" · se fue el "}{formatFecha(candidato.fecha_adopcion)}
          {admin && candidato.adoptante && <> con {candidato.adoptante}</>}
        </p>
      </div>
    </>
  );

  if (!admin) {
    return (
      <li className="flex items-center gap-4 rounded-card border border-bruma/60 bg-espuma p-4 shadow-suave">
        {datos}
      </li>
    );
  }

  return (
    <li className="overflow-hidden rounded-card border border-bruma/60 bg-espuma shadow-suave">
      <details onToggle={(e) => abrir(e.currentTarget.open)}>
        <summary className="flex cursor-pointer list-none items-center gap-4 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro focus-visible:ring-offset-2 focus-visible:ring-offset-espuma">
          {datos}
          <ChevronDown
            className={`size-5 shrink-0 text-niebla transition-transform ${abierta ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </summary>

        <div className="border-t border-bruma bg-arena/40 p-5">
          {error && (
            <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
            <Input
              label="Fecha de la adopción"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            <Input
              label="Quién adoptó"
              value={adoptante}
              onChange={(e) => setAdoptante(e.target.value)}
              placeholder="Familia Ferreyra, Ostende"
              hint="Dato interno: no se publica."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon={Save} loading={guardando} onClick={guardar}>
              Guardar
            </Button>
            <Button
              as={Link}
              to={`/candidatos/${candidato.id}`}
              variant="secondary"
              size="sm"
              icon={PencilLine}
            >
              Abrir la ficha
            </Button>
          </div>

          <div className="mt-6 border-t border-bruma pt-5">
            {resenas === null ? (
              <p className="text-sm text-niebla-oscuro">Cargando las reseñas…</p>
            ) : (
              <ResenasAdmin
                candidatoId={candidato.id}
                resenas={resenas}
                onCambio={async () => { await cargarResenas(); await onCambio?.(); }}
              />
            )}
          </div>
        </div>
      </details>
    </li>
  );
}

export default function AdopcionesHistorial() {
  const { isAdmin } = useAuth();
  const admin = isAdmin();

  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      setHistorial(await adopcionesService.getHistorial({ redirectOn401: false }));
    } catch (err) {
      setError(err.message || "Error al cargar el historial");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando) return <Cargando texto="Cargando el historial…" />;

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
        <Button variant="secondary" onClick={cargar}>Reintentar</Button>
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <EmptyState
        icon={PawPrint}
        title="Todavía no hay adopciones"
        description="Cuando un animal encuentre su casa, va a aparecer acá."
      />
    );
  }

  return (
    <section aria-labelledby="historial-titulo">
      <div className="mb-6">
        <h2 id="historial-titulo" className="font-display text-xl font-bold text-mar">
          {historial.length} {historial.length === 1 ? "adopción" : "adopciones"}
        </h2>
        <p className="mt-1 text-sm text-niebla-oscuro">
          {admin
            ? "Abrí una fila para corregir la fecha, anotar quién adoptó o cargar la reseña que mandó la familia."
            : "De la más reciente a la más vieja."}
        </p>
      </div>

      <ul className="space-y-3">
        {historial.map((c) => (
          <Fila key={c.id} candidato={c} admin={admin} onCambio={cargar} />
        ))}
      </ul>
    </section>
  );
}
