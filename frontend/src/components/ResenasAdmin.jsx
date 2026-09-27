/**
 * ResenasAdmin — las reseñas de un animal ya adoptado, del lado del refugio.
 *
 * Una reseña es lo que cuenta la familia después de la adopción. Las carga el
 * refugio con lo que la familia le manda (un mensaje, una foto): no hay forma
 * de verificar por internet que quien escribe es realmente quien adoptó, así
 * que no existe un formulario público.
 *
 * `publicada` permite guardar una reseña a medio escribir sin mostrarla: el
 * borrador queda acá y la Home solo ve las publicadas.
 *
 * Se usa en la ficha del candidato y en el historial de adopciones, así que
 * recibe la lista y avisa los cambios hacia arriba en vez de manejar la carga.
 */

import { useState } from "react";
import { Eye, EyeOff, Plus, Quote, Trash2, X } from "lucide-react";
import Button from "./Button";
import Input, { Textarea } from "./Input";
import { candidatosService } from "../services/api";
import { formatFecha } from "../lib/format";

const FORM_VACIO = { autor: "", texto: "", url: "", archivo: null };

export default function ResenasAdmin({ candidatoId, resenas = [], onCambio }) {
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const cerrar = () => {
    setAbierto(false);
    setForm(FORM_VACIO);
    setError("");
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.autor.trim() || !form.texto.trim()) {
      setError("Completá quién la cuenta y el texto de la reseña.");
      return;
    }

    try {
      setGuardando(true);
      await candidatosService.agregarResena(candidatoId, form);
      cerrar();
      await onCambio?.();
    } catch (err) {
      setError(err.message || "No pudimos guardar la reseña");
    } finally {
      setGuardando(false);
    }
  };

  const alternarPublicada = async (resena) => {
    try {
      await candidatosService.editarResena(candidatoId, resena.id, {
        publicada: !resena.publicada,
      });
      await onCambio?.();
    } catch (err) {
      setError(err.message || "No pudimos actualizar la reseña");
    }
  };

  const borrar = async (resena) => {
    if (!window.confirm(`¿Borrar la reseña de ${resena.autor}? No se puede deshacer.`)) return;
    try {
      await candidatosService.borrarResena(candidatoId, resena.id);
      await onCambio?.();
    } catch (err) {
      setError(err.message || "No pudimos borrar la reseña");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-sm font-bold text-mar">
          <Quote className="size-4 text-niebla" aria-hidden="true" />
          Reseñas de la familia
          <span className="font-normal text-niebla-oscuro">({resenas.length})</span>
        </h4>
        {!abierto && (
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => setAbierto(true)}>
            Sumar una reseña
          </Button>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {abierto && (
        <form onSubmit={guardar} className="mt-4 rounded-2xl border border-bruma bg-arena/50 p-4">
          <Input
            label="Quién la cuenta"
            value={form.autor}
            onChange={cambiar("autor")}
            placeholder="Familia Ferreyra, Ostende"
            hint="Como quiera aparecer publicada."
            required
          />
          <Textarea
            label="Cómo les va"
            value={form.texto}
            onChange={cambiar("texto")}
            placeholder="Lo fuimos a conocer “solo para ver” y volvimos con él el sábado siguiente…"
            rows={4}
            required
          />
          <Input
            label="Foto (URL)"
            type="url"
            value={form.url}
            onChange={cambiar("url")}
            placeholder="https://…"
            hint="Opcional. También podés subir un archivo acá abajo."
            disabled={Boolean(form.archivo)}
          />
          <div className="mb-4 flex flex-col gap-1.5">
            <label htmlFor="resena-archivo" className="text-sm font-bold text-mar">
              …o subir la foto que mandaron
            </label>
            <input
              id="resena-archivo"
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, archivo: e.target.files?.[0] ?? null, url: "" })}
              className="text-sm text-niebla-oscuro file:mr-3 file:rounded-full file:border-0 file:bg-bruma/50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-mar"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" loading={guardando}>
              Guardar reseña
            </Button>
            <Button type="button" size="sm" variant="ghost" icon={X} onClick={cerrar}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {resenas.length === 0 ? (
        <p className="mt-3 text-sm text-niebla-oscuro">
          Todavía no cargamos ninguna. Cuando la familia mande novedades, van acá.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {resenas.map((r) => (
            <li
              key={r.id}
              className={`rounded-2xl border p-4 ${
                r.publicada ? "border-bruma bg-espuma" : "border-dashed border-duna bg-arena/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-mar">{r.autor}</p>
                  <p className="mt-0.5 text-xs text-niebla-oscuro">
                    {r.candidato_nombre && <>Sobre {r.candidato_nombre} · </>}
                    {formatFecha(r.fecha_creacion)}
                    {!r.publicada && " · sin publicar"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={r.publicada ? EyeOff : Eye}
                    onClick={() => alternarPublicada(r)}
                  >
                    {r.publicada ? "Ocultar" : "Publicar"}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    aria-label={`Borrar la reseña de ${r.autor}`}
                    onClick={() => borrar(r)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-niebla-oscuro">{r.texto}</p>

              {r.src && (
                <img
                  src={r.src}
                  alt=""
                  loading="lazy"
                  className="mt-3 h-24 w-32 rounded-xl object-cover"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
