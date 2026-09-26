/**
 * NuevoCandidatoPage — form to register a new shelter candidate.
 *
 * Admin-only page (enforced by ProtectedAdminRoute in App.jsx).
 * On success, navigates back to the candidates list.
 */

import Layout from "../components/Layout";
import Input from "../components/Input";
import Button from "../components/Button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { candidatosService } from "../services/api";

export default function NuevoCandidatoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    especie: "",
    genero: "desconocido",
    edad: "",
    descripcion: "",
    imagen: "",
  });

  /** Generic change handler — updates the matching field in the form state. */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await candidatosService.create({
        ...form,
        edad: parseInt(form.edad) || 0, // Parse age to integer; default to 0 if empty
        adoptado: false,                 // New candidates always start as available
      });
      navigate("/candidatos");
    } catch (err) {
      setError(err.message || "Error creating candidate");
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-3xl font-bold mb-6 text-center text-deep">
          Registrar nuevo candidato
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

          <Input label="Nombre"       value={form.nombre}      onChange={handleChange} name="nombre"      required />
          <Input label="Especie"      value={form.especie}     onChange={handleChange} name="especie"     required />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-deep">Género</label>
            <select
              name="genero"
              value={form.genero}
              onChange={handleChange}
              className="border border-rim px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest bg-snowmelt text-deep"
            >
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
              <option value="desconocido">Desconocido</option>
            </select>
          </div>

          <Input label="Edad"         type="number" value={form.edad} onChange={handleChange} name="edad" required />
          <Input label="Descripción"  value={form.descripcion} onChange={handleChange} name="descripcion" required />
          <Input label="Imagen (URL)" value={form.imagen}      onChange={handleChange} name="imagen" />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Agregar candidato"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
