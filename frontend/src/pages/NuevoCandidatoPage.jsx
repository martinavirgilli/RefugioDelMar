/**
 * NuevoCandidatoPage — dar de alta un animal en el refugio.
 *
 * Solo admin (lo aplica ProtectedAdminRoute y lo revalida el backend).
 *
 * Pide lo mínimo para publicar la ficha: nombre, especie, sexo, etapa, historia
 * y una foto de portada. Las fotos de la galería y las correcciones van después,
 * desde la ficha, que es donde se ve el resultado — de ahí que al guardar se
 * entre directo a ella en vez de volver al listado.
 *
 * No hay campo de edad: casi todos llegan de la calle y nadie sabe cuándo
 * nacieron. Se carga la etapa de vida que estimó el veterinario.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PawPrint, Sun } from "lucide-react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Input, { Select, Textarea } from "../components/Input";
import { candidatosService } from "../services/api";
import { ETAPAS } from "../lib/format";

export default function NuevoCandidatoPage() {
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    especie: "",
    genero: "desconocido",
    etapa: "joven",
    descripcion: "",
    imagen: "",
    apto_salida: false,
  });

  const cambiar = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);

    try {
      // adoptado: false — un candidato nuevo siempre arranca buscando casa
      const creado = await candidatosService.create({ ...form, adoptado: false });
      navigate(`/candidatos/${creado.id}`);
    } catch (err) {
      setError(err.message || "No pudimos crear la ficha");
      setGuardando(false);
    }
  };

  return (
    <Layout>
      <Button as={Link} to="/candidatos" variant="secondary" size="sm" icon={ArrowLeft} className="mb-6">
        Volver al panel
      </Button>

      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-mar sm:text-4xl">Nueva ficha</h1>
        <p className="mt-2 text-sm leading-relaxed text-niebla-oscuro">
          Con esto ya queda publicada en el catálogo. Las fotos de la galería y cualquier
          corrección se cargan después, desde su ficha.
        </p>
      </header>

      <form
        onSubmit={guardar}
        className="max-w-2xl rounded-card border border-bruma/60 bg-espuma p-6 shadow-suave sm:p-8"
      >
        {error && (
          <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
          <Input
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={cambiar}
            placeholder="Malena"
            required
          />
          <Input
            label="Especie"
            name="especie"
            value={form.especie}
            onChange={cambiar}
            placeholder="Perro"
            hint="Perro, gato, conejo…"
            required
          />
          <Select label="Sexo" name="genero" value={form.genero} onChange={cambiar}>
            <option value="hembra">Hembra</option>
            <option value="macho">Macho</option>
            <option value="desconocido">Sin determinar</option>
          </Select>
          <Select
            label="Etapa de vida"
            name="etapa"
            value={form.etapa}
            onChange={cambiar}
            hint="Estimada: de la calle no se sabe la edad exacta."
          >
            {ETAPAS.map((etapa) => (
              <option key={etapa.valor} value={etapa.valor}>
                {etapa.etiqueta} — {etapa.detalle.toLowerCase()}
              </option>
            ))}
          </Select>
        </div>

        <Textarea
          label="Su historia"
          name="descripcion"
          value={form.descripcion}
          onChange={cambiar}
          rows={6}
          placeholder="Cómo llegó, cómo es con otros animales, qué necesita de su casa nueva…"
          hint="Es lo que más se lee de la ficha. Los renglones en blanco se respetan."
          required
        />

        <Input
          label="Foto de portada (URL)"
          type="url"
          name="imagen"
          value={form.imagen}
          onChange={cambiar}
          placeholder="https://…"
          hint="La primera que se ve. Las demás se suben desde la ficha."
        />

        <label className="mb-6 flex items-start gap-3 rounded-2xl border border-bruma bg-arena/50 p-3">
          <input
            type="checkbox"
            name="apto_salida"
            checked={form.apto_salida}
            onChange={cambiar}
            className="mt-0.5 size-4 shrink-0 accent-mar"
          />
          <span className="text-sm text-mar">
            <span className="flex items-center gap-1.5 font-bold">
              <Sun className="size-4 text-atardecer-oscuro" aria-hidden="true" />
              Puede salir por el día
            </span>
            <span className="mt-0.5 block text-xs text-niebla-oscuro">
              Se suma a los que alguien puede llevarse a pasear unas horas. Si recién llegó,
              mejor dejalo sin marcar y vemos cómo anda.
            </span>
          </span>
        </label>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" icon={PawPrint} loading={guardando}>
            Publicar la ficha
          </Button>
          <Button as={Link} to="/candidatos" variant="ghost" type="button">
            Cancelar
          </Button>
        </div>
      </form>
    </Layout>
  );
}
