/**
 * FichaAdmin — todo lo que el refugio necesita saber de un animal, en su ficha.
 *
 * Responde la pregunta que antes obligaba a recorrer tres pantallas: ¿alguien
 * pidió conocerlo?, ¿cuándo viene?, ¿quién es?
 *
 * Son tres bloques: quién está esperando respuesta, qué visitas hay agendadas
 * y qué pasó antes. Solo se renderiza para admins (lo decide quien lo usa) y,
 * de todos modos, el endpoint valida el permiso del lado del servidor.
 */

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, ClipboardList, Mail, Phone, UserRound } from "lucide-react";
import Badge from "./Badge";
import Button from "./Button";
import { Cargando } from "./Skeleton";
import { candidatosService, solicitudesService } from "../services/api";
import { formatFechaHora } from "../lib/format";

/** Datos de contacto de una persona, iguales en solicitudes y visitas. */
function Contacto({ nombre, email, telefono }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 font-bold text-mar">
        <UserRound className="size-4 shrink-0 text-niebla" aria-hidden="true" />
        {nombre}
      </p>
      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-niebla-oscuro">
        <Mail className="size-3.5 shrink-0" aria-hidden="true" />
        <a href={`mailto:${email}`} className="truncate hover:underline">{email}</a>
      </p>
      {telefono && (
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-niebla-oscuro">
          <Phone className="size-3.5 shrink-0" aria-hidden="true" />
          <a href={`tel:${telefono}`} className="hover:underline">{telefono}</a>
        </p>
      )}
    </div>
  );
}

function Bloque({ icon: Icon, titulo, cantidad, vacio, children }) {
  return (
    <section className="rounded-card border border-bruma/60 bg-espuma p-5 shadow-suave">
      <h3 className="flex items-center gap-2 font-display text-base font-bold text-mar">
        <Icon className="size-4 text-niebla" aria-hidden="true" />
        {titulo}
        {cantidad > 0 && <Badge text={String(cantidad)} variant="revision" />}
      </h3>
      {cantidad === 0 ? (
        <p className="mt-3 text-sm text-niebla-oscuro">{vacio}</p>
      ) : (
        <ul className="mt-4 space-y-3">{children}</ul>
      )}
    </section>
  );
}

export default function FichaAdmin({ candidatoId, onCambio }) {
  const [actividad, setActividad] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aceptando, setAceptando] = useState(null);
  const [fecha, setFecha] = useState("");

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      setActividad(await candidatosService.getActividad(candidatoId));
    } catch (err) {
      setError(err.message || "Error al cargar la actividad");
    } finally {
      setCargando(false);
    }
  }, [candidatoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const aceptar = async (solicitudId) => {
    if (!fecha) {
      setError("Elegí una fecha para la visita.");
      return;
    }
    try {
      await solicitudesService.aceptar(solicitudId, new Date(fecha).toISOString());
      setAceptando(null);
      setFecha("");
      await cargar();
      onCambio?.();
    } catch (err) {
      setError(err.message || "Error al aceptar la solicitud");
    }
  };

  const rechazar = async (solicitudId) => {
    if (!window.confirm("¿Descartar esta solicitud? La persona va a ver que no pudimos coordinarla.")) return;
    try {
      await solicitudesService.rechazar(solicitudId);
      await cargar();
      onCambio?.();
    } catch (err) {
      setError(err.message || "Error al rechazar la solicitud");
    }
  };

  /** Mínimo del selector de fecha: mañana. */
  const minimo = () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return manana.toISOString().slice(0, 16);
  };

  if (cargando) return <Cargando texto="Cargando la ficha interna…" />;

  const solicitudes = actividad?.solicitudes ?? [];
  const visitas = actividad?.visitas ?? [];

  const pendientes = solicitudes.filter((s) => s.estado === "revision");
  const ahora = new Date();
  const agendadas = visitas.filter((v) => new Date(v.fecha_visita) >= ahora && v.estado !== "cancelada");
  const pasadas = visitas.filter((v) => new Date(v.fecha_visita) < ahora || v.estado === "cancelada");

  return (
    <section className="mt-16 border-t border-bruma pt-10" aria-labelledby="ficha-admin">
      <h2 id="ficha-admin" className="text-2xl font-bold text-mar">Ficha interna</h2>
      <p className="mt-1 text-sm text-niebla-oscuro">
        Solo la ve el equipo del refugio.
      </p>

      {error && (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">

        <Bloque
          icon={ClipboardList}
          titulo="Esperando respuesta"
          cantidad={pendientes.length}
          vacio="Nadie pidió conocerlo por ahora."
        >
          {pendientes.map((s) => (
            <li key={s.id} className="rounded-2xl border border-bruma bg-arena/50 p-4">
              <Contacto nombre={s.nombre_apellido} email={s.email} telefono={s.telefono} />
              <p className="mt-3 text-sm italic text-niebla-oscuro">“{s.motivo}”</p>
              <p className="mt-2 text-xs text-niebla-oscuro">
                Pidió el {new Date(s.fecha_creacion).toLocaleDateString("es-AR")}
              </p>

              {aceptando === s.id ? (
                <div className="mt-3 rounded-2xl bg-espuma p-3">
                  <label htmlFor={`fecha-${s.id}`} className="mb-1 block text-xs font-bold text-mar">
                    Fecha y hora de la visita
                  </label>
                  <input
                    id={`fecha-${s.id}`}
                    type="datetime-local"
                    value={fecha}
                    min={minimo()}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full rounded-xl border border-bruma bg-espuma px-3 py-2 text-sm text-mar"
                  />
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => aceptar(s.id)}>
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setAceptando(null); setFecha(""); setError(""); }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => setAceptando(s.id)}>
                    Coordinar visita
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => rechazar(s.id)}>
                    Descartar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </Bloque>

        <Bloque
          icon={CalendarClock}
          titulo="Visitas agendadas"
          cantidad={agendadas.length}
          vacio="No hay visitas próximas."
        >
          {agendadas.map((v) => (
            <li key={v.id} className="rounded-2xl border border-bruma bg-arena/50 p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-pino">
                <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
                {formatFechaHora(v.fecha_visita)}
              </p>
              <div className="mt-3">
                <Contacto nombre={v.visitante_nombre} email={v.visitante_email} telefono={v.visitante_telefono} />
              </div>
              {!v.usuario && (
                <p className="mt-2 text-xs text-niebla-oscuro">Cargada a mano, sin cuenta asociada.</p>
              )}
              {v.notas && <p className="mt-2 text-sm italic text-niebla-oscuro">“{v.notas}”</p>}
            </li>
          ))}
        </Bloque>

        <Bloque
          icon={ClipboardList}
          titulo="Ya pasaron"
          cantidad={pasadas.length}
          vacio="Todavía no hay visitas hechas."
        >
          {pasadas.map((v) => (
            <li key={v.id} className="rounded-2xl border border-bruma bg-arena/50 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-mar">{formatFechaHora(v.fecha_visita)}</p>
                <Badge text={v.estado} variant={v.estado} className="capitalize" />
              </div>
              <p className="mt-1 text-xs text-niebla-oscuro">{v.visitante_nombre}</p>
              {v.comentario_final && (
                <p className="mt-2 rounded-xl bg-espuma p-2.5 text-sm text-mar">{v.comentario_final}</p>
              )}
            </li>
          ))}
        </Bloque>
      </div>
    </section>
  );
}
