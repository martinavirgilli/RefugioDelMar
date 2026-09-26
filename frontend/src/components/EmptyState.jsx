/**
 * EmptyState — lo que se ve cuando una lista no tiene nada que mostrar.
 *
 * El ícono es decorativo; el mensaje tiene que alcanzar por sí solo, y cuando
 * se puede ofrecer una salida (volver, limpiar filtros) va en `action`.
 */

import { PawPrint } from "lucide-react";

export default function EmptyState({ title, description, action, icon: Icon = PawPrint }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <span className="mb-5 grid size-20 place-items-center rounded-full bg-bruma/40">
        <Icon className="size-9 text-niebla" aria-hidden="true" />
      </span>
      <h2 className="text-2xl font-bold text-mar">{title}</h2>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-niebla-oscuro">{description}</p>
      )}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
