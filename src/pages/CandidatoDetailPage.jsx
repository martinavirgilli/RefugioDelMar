/**
 * CandidatoDetailPage — full detail view for a single candidate.
 *
 * Reads the candidate ID from the URL parameter and fetches the record
 * from the API. Falls back to a default image if the URL is broken.
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { candidatosService } from "../services/api";

export default function CandidatoDetailPage() {
  const { id } = useParams();
  const [candidato, setCandidato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCandidato();
  }, [id]); // Re-fetch whenever the ID in the URL changes

  const loadCandidato = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await candidatosService.getById(id);
      setCandidato(data);
    } catch (err) {
      setError(err.message || "Error loading candidate");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3 text-glacial">
            <span className="text-4xl animate-pulse">🐾</span>
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !candidato) {
    return (
      <Layout>
        <Link
          to="/candidatos"
          className="inline-block px-4 py-2 bg-glacial text-white rounded-lg shadow hover:bg-glacial-dark mb-4 text-sm font-semibold"
        >
          ← Back to candidates
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error || "Candidate not found."}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link
        to="/candidatos"
        className="inline-block px-4 py-2 bg-glacial text-white rounded-lg shadow hover:bg-glacial-dark mb-6 text-sm font-semibold transition-colors"
      >
        ← Back to candidates
      </Link>
      <div className="flex justify-center">
        <div className="max-w-md w-full bg-snowmelt shadow-lg p-6 rounded-2xl text-center border border-rim">
          <h1 className="text-2xl font-bold text-deep mb-4">{candidato.nombre}</h1>
          <img
            src={candidato.imagen}
            alt={candidato.nombre}
            className="rounded-xl h-60 w-full object-cover mx-auto mb-4 shadow-sm"
            onError={(e) => {
              // Fall back to a local placeholder if the remote image fails to load
              e.target.src = "/images/default.jpg";
            }}
          />
          <p className="text-glacial mb-3 leading-relaxed">{candidato.descripcion}</p>
          <p className="text-deep font-medium">Age: <span className="text-glacial font-normal">{candidato.edad} years</span></p>
          <p className="text-deep font-medium">Species: <span className="text-glacial font-normal capitalize">{candidato.especie}</span></p>
        </div>
      </div>
    </Layout>
  );
}
