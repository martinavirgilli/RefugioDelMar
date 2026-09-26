/**
 * SolicitudVisitaModal — form that lets a regular user request a visit for a candidate.
 *
 * Pre-fills name and email from the logged-in user's profile.
 * On submit, posts to the solicitudes API and calls onSuccess/onClose.
 */

import { useState } from "react";
import { solicitudesService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";

export default function SolicitudVisitaModal({ candidato, onClose, onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    nombre_apellido: user?.name || "",
    email: user?.email || "",
    telefono: "",
    motivo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre_apellido.trim() || !form.email.trim() || !form.motivo.trim()) {
      setError("Nombre, email y motivo son obligatorios.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await solicitudesService.create({
        candidato: candidato.id,
        nombre_apellido: form.nombre_apellido.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim() || null,
        motivo: form.motivo.trim(),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Error al enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "border border-rim px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest bg-sun text-deep w-full";

  return (
    <div className="fixed inset-0 bg-deep/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-snowmelt rounded-2xl shadow-xl border border-rim w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-deep mb-1">Solicitar visita</h2>
          <p className="text-sm text-glacial mb-5">
            Querés conocer a <strong className="text-deep">{candidato.nombre}</strong>.
            Completá el formulario y el equipo del refugio se pondrá en contacto.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-deep">Nombre y Apellido *</label>
              <input
                name="nombre_apellido"
                value={form.nombre_apellido}
                onChange={handleChange}
                required
                className={inputCls}
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-deep">Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className={inputCls}
                placeholder="tu@email.com"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-deep">Teléfono</label>
              <input
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={handleChange}
                className={inputCls}
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-deep">
                ¿Por qué querés visitar a {candidato.nombre}? *
              </label>
              <textarea
                name="motivo"
                value={form.motivo}
                onChange={handleChange}
                required
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder={`Contanos por qué te gustaría conocer a ${candidato.nombre}...`}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Enviando..." : "Enviar solicitud"}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
