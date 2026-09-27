/**
 * ColaboracionModal — formulario para postularse como voluntario o como
 * hogar de tránsito.
 *
 * No pide cuenta a propósito: hacer que alguien se registre antes de poder
 * ofrecer ayuda es una buena manera de perder esa ayuda.
 *
 * El mismo formulario sirve para los dos casos; cambia el texto según `tipo`.
 */

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import Button from "./Button";
import Input, { Textarea } from "./Input";
import { useAuth } from "../context/AuthContext";
import { colaboracionesService } from "../services/api";

const TEXTOS = {
  voluntario: {
    titulo: "Sumate como voluntario",
    bajada:
      "Paseos, baños, fotos para las fichas o una mano los sábados a la mañana. Contanos con qué te " +
      "sentís cómodo y te escribimos.",
    mensaje: "¿Por qué querés ser voluntario? ¿Con qué te gustaría ayudar?",
    ejemplo: "Tengo experiencia con perros grandes y puedo ir los sábados…",
  },
  transito: {
    titulo: "Ofrecé tu casa como tránsito",
    bajada:
      "Un lugar temporal mientras un animal se recupera cambia por completo cómo llega a su adopción. " +
      "El refugio pone el alimento y la veterinaria.",
    mensaje: "Contanos cómo es tu casa y por cuánto tiempo podrías recibir a un animal",
    ejemplo: "Vivo en una casa con patio, ya tengo un perro adulto y podría recibir a alguien un mes…",
  },
};

export default function ColaboracionModal({ tipo = "voluntario", onClose }) {
  const { user } = useAuth();
  const textos = TEXTOS[tipo] ?? TEXTOS.voluntario;
  const dialogoRef = useRef(null);

  const [form, setForm] = useState({
    nombre: user?.name || "",
    email: user?.email || "",
    telefono: "",
    disponibilidad: "",
    mensaje: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  // Esc cierra, el foco entra al diálogo y el fondo no scrollea
  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogoRef.current?.querySelector("input, button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onClose]);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.mensaje.trim()) {
      setError("Nombre, email y mensaje son obligatorios.");
      return;
    }

    setEnviando(true);
    setError("");
    try {
      await colaboracionesService.create({
        tipo,
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim() || null,
        disponibilidad: form.disponibilidad.trim(),
        mensaje: form.mensaje.trim(),
      });
      setListo(true);
    } catch (err) {
      setError(err.message || "No pudimos enviar tu postulación.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-mar/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="colaboracion-titulo"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card border border-bruma bg-espuma shadow-elevada"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 id="colaboracion-titulo" className="text-2xl font-bold text-mar">
              {listo ? "¡Gracias!" : textos.titulo}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-full p-2 text-mar transition-colors hover:bg-bruma/40"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          {listo ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="mx-auto size-12 text-pino" aria-hidden="true" />
              <p className="mt-4 leading-relaxed text-niebla-oscuro">
                Recibimos tu postulación. En los próximos días un voluntario se pone en contacto
                con vos para charlar los detalles.
              </p>
              <Button className="mt-6" onClick={onClose}>Cerrar</Button>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm leading-relaxed text-niebla-oscuro">{textos.bajada}</p>

              <form onSubmit={enviar} noValidate>
                {error && (
                  <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                )}

                <Input
                  label="Nombre y apellido"
                  name="nombre"
                  value={form.nombre}
                  onChange={cambiar}
                  required
                  placeholder="Tu nombre completo"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={cambiar}
                  required
                  placeholder="vos@email.com"
                />
                <Input
                  label="Teléfono"
                  name="telefono"
                  type="tel"
                  value={form.telefono}
                  onChange={cambiar}
                  placeholder="+54 2254 40-0000"
                />
                <Input
                  label="Disponibilidad"
                  name="disponibilidad"
                  value={form.disponibilidad}
                  onChange={cambiar}
                  hint="Qué días o en qué horarios podés."
                  placeholder="Sábados a la mañana"
                />
                <Textarea
                  label={textos.mensaje}
                  name="mensaje"
                  value={form.mensaje}
                  onChange={cambiar}
                  required
                  rows={4}
                  placeholder={textos.ejemplo}
                />

                <div className="mt-2 flex gap-3">
                  <Button type="submit" className="flex-1" loading={enviando}>
                    {enviando ? "Enviando…" : "Enviar postulación"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={onClose} disabled={enviando}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
