/**
 * Input — labeled text input with consistent styling.
 *
 * Wraps a native <input> element with a label and applies the project's
 * design system styles. Passes through all standard input attributes.
 */

export default function Input({ label, value, onChange, type = "text", name, required, placeholder, min }) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      {label && (
        <label className="text-sm font-semibold text-deep">{label}</label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        min={min}
        className="border border-rim px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest transition-colors bg-snowmelt placeholder:text-glacial/60"
      />
    </div>
  );
}
