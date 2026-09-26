/**
 * Campos de formulario del sistema de diseño: Input, Textarea y Select.
 *
 * Los tres comparten estilo y accesibilidad:
 *   - el <label> se asocia al control con un id generado por useId(),
 *   - el error se anuncia con aria-invalid + aria-describedby,
 *   - el asterisco de "requerido" es decorativo: quien manda es el atributo
 *     required, que es lo que lee el lector de pantalla.
 */

import { useId } from "react";

const controlBase =
  "w-full rounded-2xl border bg-espuma px-4 py-2.5 text-sm text-mar " +
  "placeholder:text-niebla-oscuro/70 transition-colors duration-200 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-arena disabled:opacity-55 disabled:cursor-not-allowed";

const borderFor = (error) => (error ? "border-red-700" : "border-bruma focus:border-mar-claro");

/** Envoltorio común: label arriba, control en el medio, ayuda o error abajo. */
function Field({ id, label, required, error, hint, children }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="mb-4 flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-mar">
          {label}
          {required && <span aria-hidden="true" className="text-atardecer-oscuro"> *</span>}
        </label>
      )}
      {children(describedBy)}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-semibold text-red-800">
          {error}
        </p>
      ) : (
        hint && <p id={`${id}-hint`} className="text-xs text-niebla-oscuro">{hint}</p>
      )}
    </div>
  );
}

export default function Input({ label, error, hint, required, className = "", ...props }) {
  const id = useId();

  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      {(describedBy) => (
        <input
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${controlBase} ${borderFor(error)} ${className}`}
          {...props}
        />
      )}
    </Field>
  );
}

export function Textarea({ label, error, hint, required, rows = 4, className = "", ...props }) {
  const id = useId();

  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      {(describedBy) => (
        <textarea
          id={id}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${controlBase} ${borderFor(error)} resize-none ${className}`}
          {...props}
        />
      )}
    </Field>
  );
}

export function Select({ label, error, hint, required, children, className = "", ...props }) {
  const id = useId();

  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      {(describedBy) => (
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${controlBase} ${borderFor(error)} ${className}`}
          {...props}
        >
          {children}
        </select>
      )}
    </Field>
  );
}
