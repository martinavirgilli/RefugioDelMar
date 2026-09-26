/**
 * AdopcionesResumen — dashboard-style summary of adoption statistics.
 *
 * Fetches aggregated counts from the API (total, adopted, available)
 * and displays them as stat cards. Accessible to any authenticated user.
 */

import { useState, useEffect } from "react";
import { Heart, House, PawPrint } from "lucide-react";
import Button from "../../components/Button";
import { Cargando } from "../../components/Skeleton";
import { adopcionesService } from "../../services/api";

/** Individual stat card used in the summary grid. */
function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-bruma bg-espuma p-6 text-center shadow-suave">
      <span className="grid size-12 place-items-center rounded-full bg-bruma/50">
        <Icon className="size-6 text-mar" aria-hidden="true" />
      </span>
      <span className="font-display text-4xl font-bold text-mar">{value ?? "—"}</span>
      <span className="text-sm font-semibold text-niebla-oscuro">{label}</span>
    </div>
  );
}

export default function AdopcionesResumen() {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResumen();
  }, []);

  const loadResumen = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adopcionesService.getResumen();
      setResumen(data);
    } catch (err) {
      setError(err.message || "Error al cargar el resumen");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Cargando texto="Cargando el resumen…" />;
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
        <Button variant="secondary" onClick={loadResumen}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h2 className="mb-6 text-center text-xl font-bold text-mar">Resumen de adopciones</h2>
      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard icon={PawPrint} label="Total candidatos" value={resumen?.total ?? 0} />
        <StatCard icon={Heart} label="Adoptados" value={resumen?.adoptados ?? 0} />
        <StatCard icon={House} label="Disponibles" value={resumen?.disponibles ?? 0} />
      </div>
    </div>
  );
}
