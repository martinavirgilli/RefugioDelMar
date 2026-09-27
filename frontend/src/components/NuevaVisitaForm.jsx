/**
 * NuevaVisitaForm — cargar una visita a mano, desde la misma página de Visitas.
 *
 * El caso real que resuelve: alguien llama por teléfono o golpea la puerta del
 * refugio. Esa persona puede tener cuenta o no, y la visita tiene que poder
 * agendarse igual. Por eso:
 *
 *   - se escribe el nombre o el email y el campo sugiere cuentas existentes;
 *   - si hay una, la visita queda vinculada a esa persona;
 *   - si no hay ninguna, se puede crear la cuenta acá mismo y seguir;
 *   - y si no hace falta cuenta, la visita se guarda igual con los datos sueltos.
 *
 * La contraseña de una cuenta nueva se muestra una sola vez: el servidor la
 * genera, la devuelve en esa respuesta y no la guarda en texto plano.
 */

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Copy, UserPlus, UserRound, X } from "lucide-react";
import Button from "./Button";
import Input, { Textarea } from "./Input";
import { authService, candidatosService, visitasService } from "../services/api";

const FORM_VACIO = {
  candidato: "",
  fecha_visita: "",
  visitante_nombre: "",
  visitante_email: "",
  visitante_telefono: "",
  notas: "",
};

/** Mínimo del selector de fecha: mañana. Una visita en el pasado no existe. */
const minimoFecha = () => {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  return manana.toISOString().slice(0, 16);
};

export default function NuevaVisitaForm({ onCreada, onCancelar }) {
  const [form, setForm] = useState(FORM_VACIO);
  const [candidatos, setCandidatos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Autocompletado de cuentas
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [vinculado, setVinculado] = useState(null);   // usuario asociado a la visita
  const [creando, setCreando] = useState(false);
  const [credenciales, setCredenciales] = useState(null); // { email, password_temporal }
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    candidatosService
      .getAll({ adoptado: "false", page_size: 48, orden: "nombre" })
      .then((datos) => setCandidatos(datos.resultados))
      .catch((err) => setError(err.message || "Error al cargar los candidatos"));
  }, []);

  // Busca cuentas mientras se escribe el nombre, con un respiro de 300 ms
  const termino = form.visitante_nombre.trim();
  const yaVinculado = Boolean(vinculado);
  const saltearBusqueda = useRef(false);

  useEffect(() => {
    if (yaVinculado || termino.length < 2) {
      setSugerencias([]);
      return;
    }
    if (saltearBusqueda.current) {
      saltearBusqueda.current = false;
      return;
    }

    let cancelado = false;
    const id = setTimeout(async () => {
      try {
        setBuscando(true);
        const encontrados = await authService.buscarUsuarios(termino);
        if (!cancelado) setSugerencias(encontrados);
      } catch {
        if (!cancelado) setSugerencias([]);
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, 300);

    return () => { cancelado = true; clearTimeout(id); };
  }, [termino, yaVinculado]);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const vincular = (usuario) => {
    saltearBusqueda.current = true;
    setVinculado(usuario);
    setSugerencias([]);
    setForm((previo) => ({
      ...previo,
      visitante_nombre: usuario.nombre,
      visitante_email: usuario.email,
    }));
  };

  const desvincular = () => {
    setVinculado(null);
    setCredenciales(null);
  };

  const crearCuenta = async () => {
    if (!form.visitante_email.trim()) {
      setError("Para crear la cuenta hace falta el email de la persona.");
      return;
    }
    try {
      setCreando(true);
      setError("");
      const usuario = await authService.crearUsuario(
        form.visitante_email.trim(),
        form.visitante_nombre.trim(),
      );
      vincular(usuario);
      setCredenciales({ email: usuario.email, password: usuario.password_temporal });
    } catch (err) {
      setError(err.message || "No pudimos crear la cuenta.");
    } finally {
      setCreando(false);
    }
  };

  const copiarCredenciales = async () => {
    try {
      await navigator.clipboard.writeText(
        `Refugio del Mar — email: ${credenciales.email} · contraseña: ${credenciales.password}`,
      );
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      /* si el navegador no deja copiar, la contraseña igual está en pantalla */
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.candidato || !form.fecha_visita) {
      setError("Elegí el animal y la fecha de la visita.");
      return;
    }

    try {
      setGuardando(true);
      const visita = await visitasService.create({
        ...form,
        candidato: Number(form.candidato),
        usuario: vinculado?.id ?? null,
        fecha_visita: new Date(form.fecha_visita).toISOString(),
        visitante_telefono: form.visitante_telefono.trim() || null,
      });
      onCreada?.(visita);
    } catch (err) {
      setError(err.message || "No pudimos agendar la visita.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form
      onSubmit={guardar}
      noValidate
      className="rounded-card border border-bruma bg-espuma p-6 shadow-suave"
      aria-label="Nueva visita"
    >
      <h3 className="mb-5 font-display text-lg font-bold text-mar">Nueva visita</h3>

      {error && (
        <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
        <div className="mb-4 flex flex-col gap-1.5">
          <label htmlFor="visita-candidato" className="text-sm font-bold text-mar">
            Animal <span aria-hidden="true" className="text-atardecer-oscuro">*</span>
          </label>
          <select
            id="visita-candidato"
            name="candidato"
            value={form.candidato}
            onChange={cambiar}
            required
            className="w-full rounded-2xl border border-bruma bg-espuma px-4 py-2.5 text-sm text-mar focus:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro focus-visible:ring-offset-2 focus-visible:ring-offset-espuma"
          >
            <option value="">Elegir…</option>
            {candidatos.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre} — {c.especie}</option>
            ))}
          </select>
        </div>

        <Input
          label="Fecha y hora"
          type="datetime-local"
          name="fecha_visita"
          value={form.fecha_visita}
          onChange={cambiar}
          min={minimoFecha()}
          required
        />
      </div>

      {/* ── Quién viene ── */}
      <fieldset className="mt-2 rounded-2xl border border-bruma bg-arena/40 p-4">
        <legend className="px-2 text-sm font-bold text-mar">Quién viene</legend>

        {vinculado ? (
          <div className="flex items-start justify-between gap-3 rounded-2xl bg-espuma p-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-bold text-mar">
                <UserRound className="size-4 shrink-0 text-pino" aria-hidden="true" />
                {vinculado.nombre || vinculado.email}
              </p>
              <p className="mt-0.5 truncate text-xs text-niebla-oscuro">
                Cuenta vinculada · {vinculado.email}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" icon={X} onClick={desvincular}>
              Desvincular
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Input
              label="Nombre y apellido"
              name="visitante_nombre"
              value={form.visitante_nombre}
              onChange={cambiar}
              required
              autoComplete="off"
              placeholder="Escribí para buscar una cuenta existente"
              hint={buscando ? "Buscando cuentas…" : undefined}
            />

            {sugerencias.length > 0 && (
              <ul className="absolute z-10 -mt-2 w-full overflow-hidden rounded-2xl border border-bruma bg-espuma shadow-elevada">
                {sugerencias.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => vincular(u)}
                      className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-bruma/30 focus-visible:bg-bruma/30 focus-visible:outline-none"
                    >
                      <span className="text-sm font-semibold text-mar">{u.nombre || u.email}</span>
                      <span className="text-xs text-niebla-oscuro">{u.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          name="visitante_email"
          value={form.visitante_email}
          onChange={cambiar}
          required
          disabled={yaVinculado}
        />
        <Input
          label="Teléfono"
          type="tel"
          name="visitante_telefono"
          value={form.visitante_telefono}
          onChange={cambiar}
        />

        {!vinculado && termino.length >= 2 && !buscando && sugerencias.length === 0 && (
          <div className="rounded-2xl bg-espuma p-3">
            <p className="text-xs text-niebla-oscuro">
              No hay ninguna cuenta con ese nombre o email. Podés agendar la visita igual, o crearle
              una cuenta para que después siga el trámite desde la web.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={UserPlus}
              className="mt-3"
              loading={creando}
              onClick={crearCuenta}
            >
              Crear cuenta
            </Button>
          </div>
        )}

        {credenciales && (
          <div className="mt-3 rounded-2xl border border-duna bg-duna/15 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-mar">
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              Anotá esta contraseña ahora
            </p>
            <p className="mt-1 text-xs text-niebla-oscuro">
              Se muestra una sola vez. Pasásela a la persona para que pueda entrar y cambiarla.
            </p>
            <p className="mt-3 rounded-xl bg-espuma px-3 py-2 font-mono text-sm text-mar">
              {credenciales.email} · {credenciales.password}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={copiado ? Check : Copy}
              className="mt-3"
              onClick={copiarCredenciales}
            >
              {copiado ? "Copiado" : "Copiar"}
            </Button>
          </div>
        )}
      </fieldset>

      <div className="mt-4">
        <Textarea
          label="Notas"
          name="notas"
          value={form.notas}
          onChange={cambiar}
          rows={3}
          placeholder="Algo que convenga recordar antes de la visita…"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={guardando}>
          {guardando ? "Agendando…" : "Agendar visita"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
