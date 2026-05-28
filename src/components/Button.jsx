/**
 * Button — reusable button component with three visual variants.
 *
 * Variants:
 *   primary   — forest green fill (default, main actions)
 *   secondary — snowmelt with rim border (secondary/cancel actions)
 *   danger    — red fill (destructive actions like delete)
 */

const variants = {
  primary:   "bg-forest hover:bg-forest-dark text-white shadow-sm",
  secondary: "bg-snowmelt hover:bg-rim/40 text-deep border border-rim shadow-sm",
  danger:    "bg-red-600 hover:bg-red-700 text-white shadow-sm",
};

export default function Button({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
  variant = "primary",
}) {
  const base = "inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-light";
  const variantClass = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variantClass} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
