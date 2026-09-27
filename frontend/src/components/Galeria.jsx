/**
 * Galeria — carrusel de fotos de un candidato.
 *
 * Accesibilidad, que es la parte difícil de un carrusel:
 *   - es una lista real, no un div con imágenes sueltas;
 *   - las flechas y los puntos son <button> con nombre accesible;
 *   - se mueve con las flechas del teclado cuando el carrusel tiene el foco;
 *   - el contador se anuncia con aria-live="polite", sin robar el foco;
 *   - las fotos que no están a la vista quedan ocultas para el lector.
 *
 * Con una sola foto no dibuja controles: sería ruido.
 */

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, PawPrint } from "lucide-react";

export default function Galeria({ fotos = [], nombre, especie = "animal" }) {
  const [actual, setActual] = useState(0);
  const contenedorRef = useRef(null);

  const total = fotos.length;
  const hayVarias = total > 1;

  const ir = (indice) => setActual((indice + total) % total);

  const onKeyDown = (e) => {
    if (!hayVarias) return;
    if (e.key === "ArrowRight") { e.preventDefault(); ir(actual + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); ir(actual - 1); }
  };

  if (total === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-card bg-bruma/30">
        <PawPrint className="size-16 text-niebla/40" aria-hidden="true" />
        <span className="sr-only">Todavía no hay fotos de {nombre}.</span>
      </div>
    );
  }

  return (
    <div
      ref={contenedorRef}
      role="group"
      aria-roledescription="carrusel"
      aria-label={`Fotos de ${nombre}`}
      tabIndex={hayVarias ? 0 : -1}
      onKeyDown={onKeyDown}
      // self-start: la ficha es una grilla de dos columnas y sin esto el
      // carrusel se estira hasta el alto de la columna de al lado, dejando una
      // franja de fondo abajo de la foto (y los puntos despegados de ella).
      className="relative self-start overflow-hidden rounded-card bg-bruma/30 shadow-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro focus-visible:ring-offset-2 focus-visible:ring-offset-arena"
    >
      <ul className="m-0 list-none p-0">
        {fotos.map((foto, i) => (
          <li key={foto.id ?? i} hidden={i !== actual} aria-hidden={i !== actual}>
            <img
              src={foto.src}
              alt={foto.alt?.trim() || `${nombre}, ${especie.toLowerCase()} en adopción (foto ${i + 1} de ${total})`}
              // La primera es la que se ve al entrar: no conviene diferirla
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              className="block aspect-[4/3] w-full object-cover"
            />
          </li>
        ))}
      </ul>

      {hayVarias && (
        <>
          <button
            type="button"
            onClick={() => ir(actual - 1)}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-espuma/90 text-mar shadow-suave backdrop-blur-sm transition-colors hover:bg-espuma focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => ir(actual + 1)}
            aria-label="Foto siguiente"
            className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-espuma/90 text-mar shadow-suave backdrop-blur-sm transition-colors hover:bg-espuma focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-mar/60 to-transparent p-4">
            {fotos.map((foto, i) => (
              <button
                key={foto.id ?? i}
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ver foto ${i + 1} de ${total}`}
                aria-current={i === actual}
                className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  i === actual ? "w-6 bg-white" : "w-2.5 bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

          <p aria-live="polite" className="sr-only">
            Foto {actual + 1} de {total}
          </p>
        </>
      )}
    </div>
  );
}
