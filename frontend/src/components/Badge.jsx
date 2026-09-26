/**
 * Badge — etiqueta chica de estado.
 *
 * `variant` elige el color; si no se pasa, se deduce del texto para que los
 * estados del dominio (disponible, adoptado, planificada, realizada…) queden
 * coherentes sin repetir la clase en cada página.
 */

const variants = {
  default:     "bg-bruma/50 text-mar",
  disponible:  "bg-pino/15 text-pino",
  adoptado:    "bg-atardecer/15 text-atardecer-oscuro",
  planificada: "bg-bruma/50 text-mar",
  realizada:   "bg-pino/15 text-pino",
  cancelada:   "bg-arena text-niebla-oscuro",
  revision:    "bg-duna/20 text-mar",
  aceptada:    "bg-pino/15 text-pino",
  rechazada:   "bg-red-50 text-red-800",
};

export default function Badge({ text, variant = "default", icon: Icon, className = "" }) {
  const key = variant !== "default" ? variant : (text?.toLowerCase() ?? "default");
  const cls = variants[key] ?? variants.default;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cls} ${className}`}
    >
      {Icon && <Icon className="size-3.5" aria-hidden="true" />}
      {text}
    </span>
  );
}
