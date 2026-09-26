/**
 * AdopcionesHistorial — list of all animals that have been adopted.
 *
 * Fetches the adoption history from the API (candidates where adoptado=true,
 * ordered by most recently updated). Accessible to any authenticated user.
 */

import { useState, useEffect } from "react";
import { PawPrint } from "lucide-react";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import { Cargando } from "../../components/Skeleton";
import { adopcionesService } from "../../services/api";

export default function AdopcionesHistorial() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistorial();
  }, []);

  const loadHistorial = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adopcionesService.getHistorial();
      setHistorial(data);
    } catch (err) {
      setError(err.message || "Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Cargando texto="Cargando el historial…" />;
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
        <Button variant="secondary" onClick={loadHistorial}>Reintentar</Button>
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <EmptyState
        icon={PawPrint}
        title="Todavía no hay adopciones"
        description="Cuando un animal encuentre su casa, va a aparecer acá."
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <div className="w-full max-w-lg rounded-card border border-bruma bg-espuma p-8 shadow-suave">
        <h2 className="mb-6 text-center text-2xl font-bold text-mar">Historial de adopciones</h2>
        <ul className="space-y-3">
          {historial.map((candidato) => (
            <li
              key={candidato.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-bruma/50 bg-arena px-4 py-3"
            >
              <span className="font-bold text-mar">{candidato.nombre}</span>
              <span className="text-sm capitalize text-niebla-oscuro">{candidato.especie}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
