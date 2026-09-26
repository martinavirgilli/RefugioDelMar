/**
 * CandidatoDetailPage — full detail view for a single candidate.
 *
 * Reads the candidate ID from the URL parameter and fetches the record
 * from the API. Falls back to a default image if the URL is broken.
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Badge from "../components/Badge";
import { Cargando } from "../components/Skeleton";
import { candidatosService } from "../services/api";
import { formatEdad } from "../lib/format";

export default function CandidatoDetailPage() {
  const { id } = useParams();
  const [candidato, setCandidato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Re-fetch whenever the ID in the URL changes
  useEffect(() => {
    let cancelled = false;

    const loadCandidato = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await candidatosService.getById(id);
        if (!cancelled) setCandidato(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Error al cargar el candidato");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCandidato();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <Cargando />
      </Layout>
    );
  }

  if (error || !candidato) {
    return (
      <Layout>
        <Button as={Link} to="/candidatos" variant="secondary" size="sm" icon={ArrowLeft} className="mb-5">
          Volver a candidatos
        </Button>
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error || "No encontramos a este candidato."}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Button as={Link} to="/candidatos" variant="secondary" size="sm" icon={ArrowLeft} className="mb-6">
        Volver a candidatos
      </Button>
      <div className="flex justify-center">
        <article className="w-full max-w-xl overflow-hidden rounded-card border border-bruma bg-espuma shadow-suave">
          {candidato.imagen && (
            <img
              src={candidato.imagen}
              alt={`${candidato.nombre}, ${candidato.especie.toLowerCase()} en adopción`}
              decoding="async"
              className="block max-h-[28rem] w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          )}

          <div className="p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl font-bold text-mar">{candidato.nombre}</h1>
              <Badge
                text={candidato.adoptado ? "Adoptado" : "Disponible"}
                variant={candidato.adoptado ? "adoptado" : "disponible"}
              />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-bruma py-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-niebla-oscuro">Edad</dt>
                <dd className="mt-0.5 text-sm text-mar">{formatEdad(candidato.edad)}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-niebla-oscuro">Especie</dt>
                <dd className="mt-0.5 text-sm capitalize text-mar">{candidato.especie}</dd>
              </div>
              {candidato.genero && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-niebla-oscuro">Género</dt>
                  <dd className="mt-0.5 text-sm capitalize text-mar">{candidato.genero}</dd>
                </div>
              )}
            </dl>

            <p className="mt-5 leading-relaxed text-niebla-oscuro">{candidato.descripcion}</p>
          </div>
        </article>
      </div>
    </Layout>
  );
}
