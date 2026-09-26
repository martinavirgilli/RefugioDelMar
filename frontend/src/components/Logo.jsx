/**
 * Logo — huella sobre una ola.
 *
 * Es SVG inline y hereda el color del texto (`currentColor`), así el mismo
 * componente sirve sobre arena (header) y sobre mar (footer). La ola usa el
 * color de acento que se le pase en `olaClassName`.
 *
 * Decorativo por defecto (aria-hidden): el nombre del refugio va al lado como
 * texto, así que el lector de pantalla no necesita leer el dibujo dos veces.
 */
export default function Logo({ className = "h-9 w-9", olaClassName = "text-bruma" }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Dedos */}
      <ellipse cx="13.5" cy="18" rx="4.1" ry="5.1" fill="currentColor" transform="rotate(-18 13.5 18)" />
      <ellipse cx="21" cy="13" rx="4.3" ry="5.4" fill="currentColor" />
      <ellipse cx="29.5" cy="13" rx="4.3" ry="5.4" fill="currentColor" />
      <ellipse cx="37" cy="18" rx="4.1" ry="5.1" fill="currentColor" transform="rotate(18 37 18)" />

      {/* Almohadilla */}
      <path
        d="M25.2 21.4c5.6 0 10.2 3.9 10.2 8.7 0 3.6-3 5.4-6.4 5.4-1.6 0-2.7-.5-3.8-.5s-2.2.5-3.8.5c-3.4 0-6.4-1.8-6.4-5.4 0-4.8 4.6-8.7 10.2-8.7Z"
        fill="currentColor"
      />

      {/* Ola */}
      <path
        d="M3 41.5c3.5 0 3.5-3.6 7-3.6s3.5 3.6 7 3.6 3.5-3.6 7-3.6 3.5 3.6 7 3.6 3.5-3.6 7-3.6 3.5 3.6 7 3.6"
        className={olaClassName}
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
