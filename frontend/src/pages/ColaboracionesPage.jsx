/**
 * ColaboracionesPage — quién se ofreció a ayudar. Solo admin.
 *
 * Voluntariado y hogares de tránsito llegan por el mismo formulario público y
 * se trabajan igual, así que se listan juntos y se filtran por tipo y estado.
 *
 * No hay botón de borrar a propósito: una postulación que no prosperó se
 * archiva, porque ese contacto puede servir el año que viene.
 */

import { useCallback, useEffect, useState } from "react";
import { HeartHandshake, Inbox, Mail, Phone, Sparkles } from "lucide-react";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { Cargando } from "../components/Skeleton";
import { colaboracionesService } from "../services/api";
import { formatFechaHora } from "../lib/format";

const TIPOS = [
  { valor: "", etiqueta: "Todas" },
  { valor: "voluntario", etiqueta: "Voluntariado" },
  { valor: "transito", etiqueta: "Hogar de tránsito" },
];

const ESTADOS = [
  { valor: "nueva", etiqueta: "Nueva", variante: "revision" },
  { valor: "contactada", etiqueta: "Contactada", variante: "planificada" },
  { valor: "aceptada", etiqueta: "Aceptada", variante: "aceptada" },
  { valor: "archivada", etiqueta: "Archivada", variante: "cancelada" },
];

const ICONO_TIPO = { voluntario: HeartHandshake, transito: Sparkles };

function Tarjeta({ colaboracion, onCambiarEstado, onNota }) {
  const [nota, setNota] = useState(colaboracion.nota_interna || "");
  const [editandoNota, setEditandoNota] = useState(false);
  const Icono = ICONO_TIPO[colaboracion.tipo] ?? HeartHandshake;
  const estado = ESTADOS.find((e) => e.valor === colaboracion.estado);

  return (
    <article className="rounded-card border border-bruma bg-espuma p-5 shadow-suave">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-display text-base font-bold text-mar">
            <Icono className="size-4 shrink-0 text-niebla" aria-hidden="true" />
            {colaboracion.nombre}
          </p>
          <p className="mt-0.5 text-xs text-niebla-oscuro">{colaboracion.tipo_display}</p>
        </div>
        <Badge text={estado?.etiqueta ?? colaboracion.estado} variant={estado?.variante} />
      </div>

      <div className="mt-3 space-y-1">
        <p className="flex items-center gap-1.5 truncate text-xs text-niebla-oscuro">
          <Mail className="size-3.5 shrink-0" aria-hidden="true" />
          <a href={`mailto:${colaboracion.email}`} className="truncate hover:underline">
            {colaboracion.email}
          </a>
        </p>
        {colaboracion.telefono && (
          <p className="flex items-center gap-1.5 text-xs text-niebla-oscuro">
            <Phone className="size-3.5 shrink-0" aria-hidden="true" />
            <a href={`tel:${colaboracion.telefono}`} className="hover:underline">
              {colaboracion.telefono}
            </a>
          </p>
        )}
      </div>

      {colaboracion.disponibilidad && (
        <p className="mt-3 text-xs text-niebla-oscuro">
          <span className="font-bold text-mar">Disponibilidad: </span>
          {colaboracion.disponibilidad}
        </p>
      )}

      <p className="mt-3 rounded-2xl bg-arena/60 p-3 text-sm italic leading-relaxed text-niebla-oscuro">
        “{colaboracion.mensaje}”
      </p>

      <p className="mt-2 text-xs text-niebla-oscuro">
        Se postuló el {formatFechaHora(colaboracion.fecha_creacion)}
      </p>

      {/* Nota interna */}
      {editandoNota ? (
        <div className="mt-3">
          <label htmlFor={`nota-${colaboracion.id}`} className="mb-1 block text-xs font-bold text-mar">
            Nota del equipo
          </label>
          <textarea
            id={`nota-${colaboracion.id}`}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-2xl border border-bruma bg-espuma px-3 py-2 text-sm text-mar focus:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro"
          />
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              onClick={async () => { await onNota(colaboracion.id, nota); setEditandoNota(false); }}
            >
              Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditandoNota(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditandoNota(true)}
          className="mt-3 w-full rounded-2xl border border-dashed border-bruma px-3 py-2 text-left text-xs text-niebla-oscuro transition-colors hover:border-mar-claro hover:text-mar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro"
        >
          {colaboracion.nota_interna || "Agregar una nota del equipo…"}
        </button>
      )}

      {/* Mover de estado */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-bruma pt-3">
        {ESTADOS.filter((e) => e.valor !== colaboracion.estado).map((e) => (
          <Button
            key={e.valor}
            size="sm"
            variant={e.valor === "archivada" ? "ghost" : "secondary"}
            onClick={() => onCambiarEstado(colaboracion.id, e.valor)}
          >
            {e.etiqueta}
          </Button>
        ))}
      </div>
    </article>
  );
}

export default function ColaboracionesPage() {
  const [colaboraciones, setColaboraciones] = useState([]);
  const [tipo, setTipo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      setColaboraciones(await colaboracionesService.getAll({ tipo }));
    } catch (err) {
      setError(err.message || "Error al cargar las postulaciones");
    } finally {
      setCargando(false);
    }
  }, [tipo]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (id, estado) => {
    try {
      await colaboracionesService.update(id, { estado });
      await cargar();
    } catch (err) {
      setError(err.message || "Error al actualizar la postulación");
    }
  };

  const guardarNota = async (id, nota_interna) => {
    try {
      await colaboracionesService.update(id, { nota_interna });
      await cargar();
    } catch (err) {
      setError(err.message || "Error al guardar la nota");
    }
  };

  const nuevas = colaboraciones.filter((c) => c.estado === "nueva");
  const enCurso = colaboraciones.filter((c) => ["contactada", "aceptada"].includes(c.estado));
  const archivadas = colaboraciones.filter((c) => c.estado === "archivada");

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-mar">Quieren ayudar</h1>
        <p className="mt-1 text-sm text-niebla-oscuro">
          Postulaciones de voluntariado y de hogares de tránsito que llegaron por la web.
        </p>
      </header>

      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
        {TIPOS.map((t) => (
          <Button
            key={t.valor || "todas"}
            size="sm"
            variant={tipo === t.valor ? "primary" : "secondary"}
            aria-pressed={tipo === t.valor}
            onClick={() => setTipo(t.valor)}
          >
            {t.etiqueta}
          </Button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {cargando ? (
        <Cargando texto="Cargando las postulaciones…" />
      ) : colaboraciones.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Todavía no se postuló nadie"
          description="Cuando alguien complete el formulario de voluntariado o de hogar de tránsito, va a aparecer acá."
        />
      ) : (
        <>
          {[
            { titulo: "Sin responder", lista: nuevas },
            { titulo: "En curso", lista: enCurso },
            { titulo: "Archivadas", lista: archivadas },
          ]
            .filter((grupo) => grupo.lista.length > 0)
            .map((grupo) => (
              <section key={grupo.titulo} className="mb-12">
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="font-display text-xl font-bold text-mar">{grupo.titulo}</h2>
                  <Badge text={String(grupo.lista.length)} variant="revision" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {grupo.lista.map((c) => (
                    <Tarjeta
                      key={c.id}
                      colaboracion={c}
                      onCambiarEstado={cambiarEstado}
                      onNota={guardarNota}
                    />
                  ))}
                </div>
              </section>
            ))}
        </>
      )}
    </Layout>
  );
}
