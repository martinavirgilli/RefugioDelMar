/**
 * Button — botón reutilizable del sistema de diseño.
 *
 * Variantes:
 *   primary   — relleno mar. La acción principal de la pantalla.
 *   acento    — relleno atardecer. Solo para el CTA emocional ("Quiero conocerlo").
 *               Usar como máximo uno por pantalla: si todo grita, nada grita.
 *   claro     — relleno blanco. Para el segundo CTA sobre una foto o sobre mar.
 *   secondary — espuma con borde bruma. Acciones secundarias.
 *   ghost     — sin fondo. Acciones terciarias y barras de filtros.
 *   danger    — destructivas (eliminar, rechazar).
 *
 * Props especiales:
 *   as      — el elemento a renderizar ("button" por defecto). Pasarle Link de
 *             react-router evita anidar <a><button>, que es HTML inválido.
 *   loading — muestra un spinner, deshabilita el botón y avisa por aria-busy.
 *   icon    — ícono de lucide-react a la izquierda del texto.
 */

import { Loader2 } from "lucide-react";

const variants = {
  primary:   "bg-mar text-white hover:bg-mar-oscuro shadow-suave",
  claro:     "bg-white text-mar hover:bg-espuma shadow-suave",
  acento:    "bg-atardecer text-white hover:bg-atardecer-oscuro shadow-suave",
  secondary: "bg-espuma text-mar border border-bruma hover:bg-bruma/40 shadow-suave",
  ghost:     "bg-transparent text-mar hover:bg-bruma/30",
  danger:    "bg-red-700 text-white hover:bg-red-800 shadow-suave",
};

const sizes = {
  sm: "px-3.5 py-1.5 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-7 py-3.5 text-base gap-2.5",
};

export default function Button({
  children,
  as: Component = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  type,
  ...props
}) {
  const isDisabled = disabled || loading;

  const base =
    "inline-flex items-center justify-center rounded-full font-semibold " +
    "transition-[background-color,box-shadow,transform] duration-200 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-arena active:translate-y-px";

  const state = isDisabled
    ? "opacity-55 cursor-not-allowed pointer-events-none"
    : "cursor-pointer";

  return (
    <Component
      // Un <a> no lleva type ni disabled; un <button> sí necesita type explícito
      type={Component === "button" ? (type ?? "button") : type}
      disabled={Component === "button" ? isDisabled : undefined}
      aria-disabled={Component === "button" ? undefined : isDisabled || undefined}
      aria-busy={loading || undefined}
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size]} ${state} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />
      )}
      {children}
    </Component>
  );
}
