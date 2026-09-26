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
import SolicitudVisitaModal from "../components/SolicitudVisitaModal";
import Button from "../components/Button";
import { SkeletonCard } from "../components/Skeleton";
import { candidatosService } from "../services/api";

export default function CandidatosPage() {
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [search, setSearch] = useState("");
  const [especieFilter, setEspecieFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");

  // Visit-request modal state
  const [selectedCandidato, setSelectedCandidato] = useState(null);

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
      setError(err.message || "Error al cargar los candidatos");
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
      setError(err.message || "Error al actualizar el estado de adopción");
    }
  };

  /** Delete a candidate and reload the list. */
  const handleDelete = async (id) => {
    try {
      await candidatosService.delete(id);
      await loadCandidatos();
    } catch (err) {
      setError(err.message || "Error al eliminar el candidato");
    }
  };

  // Build the unique species list from the loaded candidates for the filter dropdown
  const especies = useMemo(() => {
    const set = new Set(candidatos.map((c) => c.especie).filter(Boolean));
    return [...set].sort();
  }, [candidatos]);

  // Apply filters then sort so non-adopted candidates appear first
  const filtered = useMemo(() => {
    return candidatos
      .filter((c) => {
        const matchSearch = !search || c.nombre.toLowerCase().includes(search.toLowerCase());
        const matchEspecie = !especieFilter || c.especie.toLowerCase() === especieFilter.toLowerCase();
        const matchEstado =
          estadoFilter === "todos" ||
          (estadoFilter === "disponibles" && !c.adoptado) ||
          (estadoFilter === "adoptados" && c.adoptado);
        return matchSearch && matchEspecie && matchEstado;
      })
      .sort((a, b) => {
        if (a.adoptado === b.adoptado) return 0;
        return a.adoptado ? 1 : -1; // non-adopted first
      });
  }, [candidatos, search, especieFilter, estadoFilter]);

  if (loading) {
    return (
      <Layout>
        <h1 className="text-3xl font-bold text-mar">Candidatos</h1>
        <p className="mt-1 text-sm text-niebla-oscuro">Buscando a los que esperan una casa…</p>
        <div
          className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
        >
          {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="mx-auto mt-10 max-w-md">
          <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
          <Button variant="secondary" onClick={loadCandidatos}>Reintentar</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-mar">Candidatos</h1>
          <p className="text-niebla-oscuro text-sm mt-0.5">
            Mostrando {filtered.length} de {candidatos.length} candidatos
          </p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-espuma border border-bruma rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end">

        {/* Name search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-mar">Buscar por nombre</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ej: Max, Luna..."
            className="border border-bruma px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mar focus:border-mar transition-colors bg-espuma placeholder:text-niebla-oscuro"
          />
        </div>

        {/* Species filter */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs font-semibold text-mar">Especie</label>
          <select
            value={especieFilter}
            onChange={(e) => setEspecieFilter(e.target.value)}
            className="border border-bruma px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mar focus:border-mar bg-espuma text-mar"
          >
            <option value="">Todas</option>
            {especies.map((e) => (
              <option key={e} value={e} className="capitalize">{e}</option>
            ))}
          </select>
        </div>

        {/* Adoption status filter */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs font-semibold text-mar">Estado</label>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="border border-bruma px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mar focus:border-mar bg-espuma text-mar"
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
            className="text-xs text-niebla-oscuro hover:text-mar font-semibold self-end pb-2"
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
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
          {filtered.map((c) => (
            <div key={c.id} className="mb-6 break-inside-avoid">
              <Card
                candidato={c}
                onToggle={handleToggleAdopcion}
                onDelete={handleDelete}
                onSolicitar={setSelectedCandidato}
              />
            </div>
          ))}
        </div>
      )}

      {/* Visit-request modal — rendered outside the grid so it overlays everything */}
      {selectedCandidato && (
        <SolicitudVisitaModal
          candidato={selectedCandidato}
          onClose={() => setSelectedCandidato(null)}
          onSuccess={() => setSelectedCandidato(null)}
        />
      )}
    </Layout>
  );
}
