/**
 * AdopcionesHistorial — list of all animals that have been adopted.
 *
 * Fetches the adoption history from the API (candidates where adoptado=true,
 * ordered by most recently updated). Accessible to any authenticated user.
 */

import { useState, useEffect } from "react";
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
      setError(err.message || "Error loading history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-niebla-oscuro">
        <span className="text-4xl animate-pulse">🐾</span>
        <span className="text-sm font-medium">Cargando historial...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
        <button
          onClick={loadHistorial}
          className="px-4 py-2 bg-niebla text-white rounded-lg hover:bg-niebla-oscuro text-sm font-semibold transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <p className="text-niebla-oscuro text-lg">
          🐾 Aún no hay adopciones registradas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <div className="bg-espuma shadow-lg rounded-2xl p-8 w-full max-w-lg border border-bruma">
        <h2 className="text-2xl font-bold mb-6 text-center text-niebla-oscuro">
          Historial de adopciones
        </h2>
        <ul className="space-y-3 text-lg text-mar">
          {historial.map((candidato) => (
            <li
              key={candidato.id}
              className="bg-arena rounded-lg px-4 py-2 shadow-sm flex justify-between items-center border border-bruma/50"
            >
              <span className="font-medium">{candidato.nombre}</span>
              <span className="text-sm text-niebla-oscuro italic">
                {candidato.especie}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
