/**
 * AdopcionesResumen — dashboard-style summary of adoption statistics.
 *
 * Fetches aggregated counts from the API (total, adopted, available)
 * and displays them as stat cards. Accessible to any authenticated user.
 */

import { useState, useEffect } from "react";
import { adopcionesService } from "../../services/api";

/** Individual stat card used in the summary grid. */
function StatCard({ icon, label, value, accent = false }) {
  return (
    <div className="bg-snowmelt rounded-2xl border border-rim shadow-sm p-6 text-center flex flex-col items-center gap-2">
      <span className="text-4xl">{icon}</span>
      <span className={`text-4xl font-extrabold ${accent ? "text-forest" : "text-deep"}`}>
        {value ?? "—"}
      </span>
      <span className="text-sm text-glacial font-medium">{label}</span>
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
      setError(err.message || "Error loading summary");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-glacial">
        <span className="text-4xl animate-pulse">🐾</span>
        <span className="text-sm font-medium">Loading summary...</span>
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
          onClick={loadResumen}
          className="px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest-dark text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h2 className="text-xl font-extrabold text-deep mb-6 text-center">Adoption Summary</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl mx-auto">
        <StatCard icon="🐾" label="Total candidates" value={resumen?.total ?? 0} />
        <StatCard icon="❤️" label="Adopted"          value={resumen?.adoptados ?? 0} accent />
        <StatCard icon="🏠" label="Available"        value={resumen?.disponibles ?? 0} />
      </div>
    </div>
  );
}
