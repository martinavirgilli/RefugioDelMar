/**
 * CandidatosPage — main grid view of all shelter candidates.
 *
 * Fetches the full candidate list from the API on mount.
 * Filtering (search by name, species, adoption status) is done client-side
 * so the grid updates instantly without additional API calls.
 */

import { useState, useEffect, useMemo } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import { candidatosService } from "../services/api";

export default function CandidatosPage() {
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [search, setSearch] = useState("");
  const [especieFilter, setEspecieFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");

  useEffect(() => {
    loadCandidatos();
  }, []);

  /** Fetch all candidates from the API and update local state. */
  const loadCandidatos = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await candidatosService.getAll();
      setCandidatos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error loading candidates");
    } finally {
      setLoading(false);
    }
  };

  /** Toggle adopted/available and reload the list to reflect the change. */
  const handleToggleAdopcion = async (id) => {
    try {
      await candidatosService.toggleAdopcion(id);
      await loadCandidatos();
    } catch (err) {
      setError(err.message || "Error updating adoption status");
    }
  };

  /** Delete a candidate and reload the list. */
  const handleDelete = async (id) => {
    try {
      await candidatosService.delete(id);
      await loadCandidatos();
    } catch (err) {
      setError(err.message || "Error deleting candidate");
    }
  };

  // Build the unique species list from the loaded candidates for the filter dropdown
  const especies = useMemo(() => {
    const set = new Set(candidatos.map((c) => c.especie).filter(Boolean));
    return [...set].sort();
  }, [candidatos]);

  // Apply all active filters to produce the visible subset
  const filtered = useMemo(() => {
    return candidatos.filter((c) => {
      const matchSearch = !search || c.nombre.toLowerCase().includes(search.toLowerCase());
      const matchEspecie = !especieFilter || c.especie.toLowerCase() === especieFilter.toLowerCase();
      const matchEstado =
        estadoFilter === "todos" ||
        (estadoFilter === "disponibles" && !c.adoptado) ||
        (estadoFilter === "adoptados" && c.adoptado);
      return matchSearch && matchEspecie && matchEstado;
    });
  }, [candidatos, search, especieFilter, estadoFilter]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3 text-glacial">
            <span className="text-4xl animate-pulse">🐾</span>
            <span className="text-sm font-medium">Cargando candidatos...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-10">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
          <button
            onClick={loadCandidatos}
            className="px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest-dark text-sm font-semibold"
          >
            Reintentar
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-deep">Candidatos</h1>
          <p className="text-glacial text-sm mt-0.5">
            Mostrando {filtered.length} de {candidatos.length} candidatos
          </p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-snowmelt border border-rim rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end">

        {/* Name search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-deep">Buscar por nombre</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ej: Max, Luna..."
            className="border border-rim px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest transition-colors bg-snowmelt placeholder:text-glacial/60"
          />
        </div>

        {/* Species filter */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs font-semibold text-deep">Especie</label>
          <select
            value={especieFilter}
            onChange={(e) => setEspecieFilter(e.target.value)}
            className="border border-rim px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest bg-snowmelt text-deep"
          >
            <option value="">Todas</option>
            {especies.map((e) => (
              <option key={e} value={e} className="capitalize">{e}</option>
            ))}
          </select>
        </div>

        {/* Adoption status filter */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs font-semibold text-deep">Estado</label>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="border border-rim px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest bg-snowmelt text-deep"
          >
            <option value="todos">Todos</option>
            <option value="disponibles">Disponibles</option>
            <option value="adoptados">Adoptados</option>
          </select>
        </div>

        {/* Clear filters button — only shown when any filter is active */}
        {(search || especieFilter || estadoFilter !== "todos") && (
          <button
            onClick={() => { setSearch(""); setEspecieFilter(""); setEstadoFilter("todos"); }}
            className="text-xs text-glacial hover:text-deep font-semibold self-end pb-2"
          >
            Limpiar filtros ×
          </button>
        )}
      </div>

      {/* ── Candidates grid ── */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Ningún candidato coincide con los filtros seleccionados."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <Card
              key={c.id}
              candidato={c}
              onToggle={handleToggleAdopcion}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
