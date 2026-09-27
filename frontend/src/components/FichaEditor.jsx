/**
 * FichaEditor — la ficha de un animal, editable, para el equipo del refugio.
 *
 * Antes el admin veía exactamente lo mismo que un visitante y para corregir
 * una descripción tenía que entrar al admin de Django. Acá tiene todo junto:
 * los datos, las fotos, la adopción y las reseñas.
 *
 * Se guarda por bloque y no todo de una: quien corrige una descripción no
 * debería arriesgarse a tocar la adopción sin querer. Cada bloque manda solo
 * sus campos con PATCH.
 *
 * Todo lo que hay acá lo valida igual el backend: es admin-only del lado del
 * servidor, así que esconder el bloque es comodidad, no seguridad.
 */

import { useState } from "react";
import {
  AlertTriangle, Camera, Heart, ImagePlus, PencilLine, Save, Sun, Trash2, Undo2,
} from "lucide-react";
import Badge from "./Badge";
import Button from "./Button";
import Input, { Select, Textarea } from "./Input";
import ResenasAdmin from "./ResenasAdmin";
import { candidatosService } from "../services/api";
import { ETAPAS, formatFecha } from "../lib/format";

/** Título de bloque del panel. */
function Bloque({ icon: Icon, titulo, ayuda, children }) {
  return (
    <section className="rounded-card border border-bruma/60 bg-espuma p-5 shadow-suave">
      <h3 className="flex items-center gap-2 font-display text-base font-bold text-mar">
        <Icon className="size-4 text-niebla" aria-hidden="true" />
        {titulo}
      </h3>
      {ayuda && <p className="mt-1 text-xs text-niebla-oscuro">{ayuda}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Los campos editables, tal como los espera el backend. */
const camposDe = (c) => ({
  nombre: c.nombre ?? "",
  especie: c.especie ?? "",
  genero: c.genero ?? "desconocido",
  etapa: c.etapa ?? "adulto",
  descripcion: c.descripcion ?? "",
  imagen: c.imagen ?? "",
  apto_salida: Boolean(c.apto_salida),
});

export default function FichaEditor({ candidato, onCambio, onBorrado }) {
  const [form, setForm] = useState(camposDe(candidato));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  // Estado de la adopción, editable aparte de los datos del animal
  const [fechaAdopcion, setFechaAdopcion] = useState(candidato.fecha_adopcion ?? "");
  const [adoptante, setAdoptante] = useState(candidato.adoptante ?? "");

  // Alta de fotos
  const [foto, setFoto] = useState({ url: "", archivo: null, alt: "" });
  const [subiendo, setSubiendo] = useState(false);

  const original = camposDe(candidato);
  const hayCambios = Object.keys(original).some((clave) => form[clave] !== original[clave]);

  const cambiar = (campo) => (e) =>
    setForm({
      ...form,
      [campo]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });

  /** Corre una acción mostrando el error y refrescando la ficha al terminar. */
  const ejecutar = async (accion, mensaje) => {
    setError("");
    setAviso("");
    try {
      setGuardando(true);
      await accion();
      setAviso(mensaje);
      await onCambio?.();
    } catch (err) {
      setError(err.message || "No pudimos guardar el cambio");
    } finally {
      setGuardando(false);
    }
  };

  const guardarDatos = (e) => {
    e.preventDefault();
    return ejecutar(
      () => candidatosService.patch(candidato.id, form),
      "Guardamos los datos de la ficha.",
    );
  };

  const guardarAdopcion = () =>
    ejecutar(
      () => candidatosService.patch(candidato.id, {
        fecha_adopcion: fechaAdopcion || null,
        adoptante: adoptante.trim(),
      }),
      "Actualizamos los datos de la adopción.",
    );

  const marcarAdoptado = () =>
    ejecutar(
      () => candidatosService.toggleAdopcion(candidato.id, {
        fecha_adopcion: fechaAdopcion || undefined,
        adoptante: adoptante.trim(),
      }),
      `${candidato.nombre} pasó al archivo de adoptados.`,
    );

  const revertirAdopcion = () => {
    if (!window.confirm(
      `¿Volver a publicar a ${candidato.nombre} en el catálogo? ` +
      "Se borran la fecha de adopción y el adoptante.",
    )) return;
    return ejecutar(
      () => candidatosService.toggleAdopcion(candidato.id),
      `${candidato.nombre} volvió al catálogo.`,
    );
  };

  const agregarFoto = async (e) => {
    e.preventDefault();
    if (!foto.url && !foto.archivo) {
      setError("Pegá una URL o elegí un archivo.");
      return;
    }
    setError("");
    try {
      setSubiendo(true);
      await candidatosService.agregarFoto(candidato.id, foto);
      setFoto({ url: "", archivo: null, alt: "" });
      setAviso("Sumamos la foto a la galería.");
      await onCambio?.();
    } catch (err) {
      setError(err.message || "No pudimos agregar la foto");
    } finally {
      setSubiendo(false);
    }
  };

  const borrarFoto = async (fotoId) => {
    if (!window.confirm("¿Borrar esta foto de la galería?")) return;
    try {
      await candidatosService.borrarFoto(candidato.id, fotoId);
      await onCambio?.();
    } catch (err) {
      setError(err.message || "No pudimos borrar la foto");
    }
  };

  const borrarFicha = async () => {
    if (!window.confirm(
      `¿Eliminar la ficha de ${candidato.nombre}? Se borra para siempre, con sus fotos y ` +
      "reseñas. Si ya fue adoptado, conviene archivarlo en vez de borrarlo.",
    )) return;
    try {
      await candidatosService.delete(candidato.id);
      onBorrado?.();
    } catch (err) {
      setError(err.message || "No pudimos eliminar la ficha");
    }
  };

  const fotos = candidato.fotos ?? [];

  return (
    <section className="mt-12 border-t border-bruma pt-10" aria-labelledby="ficha-editor">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="ficha-editor" className="text-2xl font-bold text-mar">Editar la ficha</h2>
          <p className="mt-1 text-sm text-niebla-oscuro">
            Los cambios se ven en el catálogo al instante.
          </p>
        </div>
        <Badge
          text={candidato.adoptado ? "Archivada" : "Publicada"}
          variant={candidato.adoptado ? "adoptado" : "disponible"}
        />
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <p aria-live="polite" className="mt-3 text-sm font-semibold text-pino">{aviso}</p>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* ── Datos del animal ── */}
        <Bloque
          icon={PencilLine}
          titulo="Datos del animal"
          ayuda="Es lo que lee quien está mirando el catálogo."
        >
          <form onSubmit={guardarDatos}>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Input label="Nombre" value={form.nombre} onChange={cambiar("nombre")} required />
              <Input
                label="Especie"
                value={form.especie}
                onChange={cambiar("especie")}
                hint="Perro, gato, conejo…"
                required
              />
              <Select label="Sexo" value={form.genero} onChange={cambiar("genero")}>
                <option value="hembra">Hembra</option>
                <option value="macho">Macho</option>
                <option value="desconocido">Sin determinar</option>
              </Select>
              <Select
                label="Etapa de vida"
                value={form.etapa}
                onChange={cambiar("etapa")}
                hint="Estimada: de la calle no se sabe la edad exacta."
              >
                {ETAPAS.map((e) => (
                  <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
                ))}
              </Select>
            </div>

            <Input
              label="Foto de portada (URL)"
              type="url"
              value={form.imagen}
              onChange={cambiar("imagen")}
              placeholder="https://…"
              hint="La primera que se ve en el catálogo y en la ficha."
            />

            <Textarea
              label="Su historia"
              value={form.descripcion}
              onChange={cambiar("descripcion")}
              rows={6}
              hint="Cómo llegó, cómo es, qué necesita. Los renglones en blanco se respetan."
              required
            />

            <label className="mb-4 flex items-start gap-3 rounded-2xl border border-bruma bg-arena/50 p-3">
              <input
                type="checkbox"
                checked={form.apto_salida}
                onChange={cambiar("apto_salida")}
                className="mt-0.5 size-4 shrink-0 accent-mar"
              />
              <span className="text-sm text-mar">
                <span className="flex items-center gap-1.5 font-bold">
                  <Sun className="size-4 text-atardecer-oscuro" aria-hidden="true" />
                  Puede salir por el día
                </span>
                <span className="mt-0.5 block text-xs text-niebla-oscuro">
                  Aparece entre los que alguien puede llevarse a pasear por unas horas.
                </span>
              </span>
            </label>

            <Button type="submit" icon={Save} loading={guardando} disabled={!hayCambios}>
              {hayCambios ? "Guardar cambios" : "Sin cambios"}
            </Button>
          </form>
        </Bloque>

        <div className="space-y-5">

          {/* ── Galería ── */}
          <Bloque
            icon={Camera}
            titulo={`Galería (${fotos.length})`}
            ayuda="Las fotos extra que se pasan en el carrusel de la ficha."
          >
            {fotos.length > 0 && (
              <ul className="mb-4 flex flex-wrap gap-3">
                {fotos.map((f) => (
                  <li key={f.id} className="relative">
                    <img
                      src={f.src}
                      alt={f.alt || ""}
                      loading="lazy"
                      className="size-24 rounded-xl border border-bruma object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => borrarFoto(f.id)}
                      aria-label="Borrar esta foto"
                      className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-red-700 text-white shadow-suave transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro focus-visible:ring-offset-2"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={agregarFoto} className="rounded-2xl border border-bruma bg-arena/50 p-4">
              <Input
                label="Pegar una URL"
                type="url"
                value={foto.url}
                onChange={(e) => setFoto({ ...foto, url: e.target.value, archivo: null })}
                placeholder="https://…"
                disabled={Boolean(foto.archivo)}
              />
              <div className="mb-4 flex flex-col gap-1.5">
                <label htmlFor="foto-archivo" className="text-sm font-bold text-mar">
                  …o subir un archivo
                </label>
                <input
                  id="foto-archivo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFoto({ ...foto, archivo: e.target.files?.[0] ?? null, url: "" })}
                  className="text-sm text-niebla-oscuro file:mr-3 file:rounded-full file:border-0 file:bg-bruma/50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-mar"
                />
                <p className="text-xs text-niebla-oscuro">
                  Las URLs sobreviven a un deploy; los archivos subidos, solo en esta computadora.
                </p>
              </div>
              <Input
                label="Qué se ve en la foto"
                value={foto.alt}
                onChange={(e) => setFoto({ ...foto, alt: e.target.value })}
                placeholder="Malena corriendo en la playa"
                hint="Para quien usa lector de pantalla."
              />
              <Button type="submit" size="sm" icon={ImagePlus} loading={subiendo}>
                Sumar a la galería
              </Button>
            </form>
          </Bloque>

          {/* ── Adopción ── */}
          <Bloque
            icon={Heart}
            titulo="Adopción"
            ayuda={
              candidato.adoptado
                ? "Corregí la fecha o el nombre si se cargaron mal."
                : "Al marcarla, la ficha sale del catálogo público y queda archivada acá."
            }
          >
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Input
                label="Fecha de la adopción"
                type="date"
                value={fechaAdopcion}
                onChange={(e) => setFechaAdopcion(e.target.value)}
                hint={candidato.adoptado ? undefined : "Si la dejás vacía, se guarda hoy."}
              />
              <Input
                label="Quién adoptó"
                value={adoptante}
                onChange={(e) => setAdoptante(e.target.value)}
                placeholder="Familia Ferreyra, Ostende"
                hint="Dato interno: no se publica."
              />
            </div>

            {candidato.adoptado ? (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" icon={Save} loading={guardando} onClick={guardarAdopcion}>
                  Guardar la adopción
                </Button>
                <Button size="sm" variant="ghost" icon={Undo2} onClick={revertirAdopcion}>
                  Volver a publicar
                </Button>
              </div>
            ) : (
              <Button size="sm" icon={Heart} loading={guardando} onClick={marcarAdoptado}>
                Marcar como adoptado
              </Button>
            )}

            {candidato.adoptado && candidato.fecha_adopcion && (
              <p className="mt-3 text-xs text-niebla-oscuro">
                Se fue el {formatFecha(candidato.fecha_adopcion)}
                {candidato.adoptante && <> con {candidato.adoptante}</>}.
              </p>
            )}
          </Bloque>
        </div>
      </div>

      {/* ── Reseñas: recién tienen sentido cuando ya se fue con alguien ── */}
      {candidato.adoptado && (
        <div className="mt-5 rounded-card border border-bruma/60 bg-espuma p-5 shadow-suave">
          <ResenasAdmin
            candidatoId={candidato.id}
            resenas={candidato.resenas ?? []}
            onCambio={onCambio}
          />
        </div>
      )}

      {/* ── Borrar ── */}
      <div className="mt-5 rounded-card border border-red-200 bg-red-50/60 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-red-900">
          <AlertTriangle className="size-4" aria-hidden="true" />
          Eliminar la ficha
        </h3>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-red-900/80">
          Se borra todo: fotos, reseñas y el historial de visitas de este animal. Si ya fue
          adoptado, marcá la adopción en vez de borrar: la ficha se archiva y queda consultable.
        </p>
        <Button variant="danger" size="sm" icon={Trash2} className="mt-4" onClick={borrarFicha}>
          Eliminar a {candidato.nombre}
        </Button>
      </div>
    </section>
  );
}
