/**
 * VisitasPage — displays all upcoming (future) scheduled visits.
 *
 * Admin-only page (enforced by ProtectedAdminRoute in App.jsx).
 * The API endpoint already filters out past visits, so the list
 * always shows only upcoming ones.
 */

import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import VisitaCard from "../components/VisitaCard";
import EmptyState from "../components/EmptyState";
import { visitasService } from "../services/api";

export default function VisitasPage() {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadVisitas();
  }, []);

  /** Fetch upcoming visits from the API. */
  const loadVisitas = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await visitasService.getAll();
      setVisitas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error loading visits");
    } finally {
      setLoading(false);
    }
  };

  /** Delete a visit by ID and reload the list. */
  const handleDelete = async (id) => {
    try {
      await visitasService.delete(id);
      await loadVisitas();
    } catch (err) {
      setError(err.message || "Error deleting visit");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3 text-glacial">
            <span className="text-4xl animate-pulse">🐾</span>
            <span className="text-sm font-medium">Loading visits...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
        <button
          onClick={loadVisitas}
          className="px-4 py-2 bg-glacial text-white rounded-lg hover:bg-glacial-dark text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </Layout>
    );
  }

  if (visitas.length === 0) {
    return (
      <Layout>
        <EmptyState
          title="No scheduled visits"
          description="No upcoming visits have been registered yet."
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6 text-deep">Scheduled Visits</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visitas.map((visita) => (
          <VisitaCard
            key={visita.id}
            visita={visita}
            onDelete={handleDelete}
            onUpdate={loadVisitas} // Passed so VisitaCard can trigger a reload after adding a comment
          />
        ))}
      </div>
    </Layout>
  );
}
