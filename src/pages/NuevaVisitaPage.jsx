/**
 * NuevaVisitaPage — form to schedule a new visit between a visitor and a candidate.
 *
 * Admin-only page (enforced by ProtectedAdminRoute in App.jsx).
 * Loads the list of available (non-adopted) candidates to populate the selector.
 * The date field enforces a minimum of "tomorrow" to prevent scheduling in the past.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Input from "../components/Input";
import Button from "../components/Button";
import { visitasService, candidatosService } from "../services/api";

export default function NuevaVisitaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [candidatos, setCandidatos] = useState([]);
  const [loadingCandidatos, setLoadingCandidatos] = useState(true);

  const [form, setForm] = useState({
    candidato: "",
    fecha_visita: "",
    visitante_nombre: "",
    visitante_email: "",
    visitante_telefono: "",
    notas: "",
  });

  useEffect(() => {
    loadCandidatos();
  }, []);

  /** Fetch all candidates so the dropdown can show only non-adopted ones. */
  const loadCandidatos = async () => {
    try {
      setLoadingCandidatos(true);
      const data = await candidatosService.getAll();
      setCandidatos(data);
    } catch (err) {
      setError("Error loading candidates");
    } finally {
      setLoadingCandidatos(false);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Convert local datetime string to ISO 8601 format expected by the API
      const fechaISO = new Date(form.fecha_visita).toISOString();

      await visitasService.create({
        ...form,
        candidato: parseInt(form.candidato),
        fecha_visita: fechaISO,
      });
      navigate("/visitas");
    } catch (err) {
      setError(err.message || "Error scheduling visit");
      setLoading(false);
    }
  };

  /** Returns tomorrow's date in the format required by datetime-local inputs. */
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-3xl font-bold mb-6 text-center text-deep">
          Schedule New Visit
        </h1>
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-snowmelt shadow-lg rounded-2xl p-6 space-y-4 border border-rim"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Candidate selector — only shows animals that are still available */}
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-sm font-semibold text-deep">Candidate *</label>
            {loadingCandidatos ? (
              <div className="text-sm text-glacial">Loading candidates...</div>
            ) : (
              <select
                name="candidato"
                value={form.candidato}
                onChange={handleChange}
                required
                className="border border-rim px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest bg-snowmelt text-deep"
              >
                <option value="">Select a candidate</option>
                {candidatos
                  .filter((c) => !c.adoptado)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} — {c.especie}
                    </option>
                  ))}
              </select>
            )}
          </div>

          <Input
            label="Visit Date & Time *"
            type="datetime-local"
            value={form.fecha_visita}
            onChange={handleChange}
            name="fecha_visita"
            required
            min={getMinDate()} // Enforce future-only scheduling in the browser
          />

          <Input label="Visitor Name *"  value={form.visitante_nombre}   onChange={handleChange} name="visitante_nombre"   required />
          <Input label="Visitor Email *" type="email" value={form.visitante_email} onChange={handleChange} name="visitante_email" required />
          <Input label="Visitor Phone"   type="tel"  value={form.visitante_telefono} onChange={handleChange} name="visitante_telefono" />

          <div className="flex flex-col gap-1 mb-3">
            <label className="text-sm font-semibold text-deep">Notes</label>
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              className="border border-rim px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest bg-snowmelt resize-none"
              rows="3"
              placeholder="Additional notes about the visit..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || loadingCandidatos}>
            {loading ? "Scheduling..." : "Schedule Visit"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
