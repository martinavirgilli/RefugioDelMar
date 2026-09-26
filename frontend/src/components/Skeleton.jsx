/**
 * Skeleton — bloque gris que ocupa el lugar del contenido mientras carga.
 *
 * Evita que la página "salte" cuando llegan los datos y se siente más rápido
 * que un spinner centrado. El pulso lo desactiva prefers-reduced-motion
 * (regla global en index.css).
 *
 * El contenedor que lo usa debería llevar aria-busy="true" para que un lector
 * de pantalla sepa que eso todavía no es el contenido real.
 */
export default function Skeleton({ className = "h-4 w-full" }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-bruma/50 ${className}`}
      aria-hidden="true"
    />
  );
}

/** Versión con forma de tarjeta de candidato, para las grillas del catálogo. */
export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-card border border-bruma/60 bg-espuma shadow-suave" aria-hidden="true">
      <div className="h-52 animate-pulse bg-bruma/40" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="mt-2 h-10 w-full" />
      </div>
    </div>
  );
}
