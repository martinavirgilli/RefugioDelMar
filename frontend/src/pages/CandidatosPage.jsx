/**
 * CandidatosPage — el catálogo del refugio.
 *
 * Es público: cualquiera puede mirar y abrir una ficha. La cuenta se pide
 * recién al solicitar una visita.
 *
 * Los filtros se resuelven en el servidor y viven en la URL, así un catálogo
 * filtrado se puede compartir o volver a él con el botón Atrás. La lista
 * arranca corta y crece con "Ver más" en vez de traer todo de una.
 *
 * Acá solo se ven los que buscan casa. Cuando un animal se adopta, su ficha se
 * archiva: sale del catálogo y queda en el panel del refugio. La regla la aplica
 * el backend, no esta página.
 *
 * Quien mira siempre es alguien de afuera: el equipo del refugio va al panel
 * (ver CatalogoPage, que reparte según quién entra).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Sun, X } from "lucide-react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import SolicitudVisitaModal from "../components/SolicitudVisitaModal";
import { SkeletonCard } from "../components/Skeleton";
import { candidatosService } from "../services/api";

const ORDENES = [
  { valor: "recientes", etiqueta: "Los últimos en llegar" },
  { valor: "antiguos", etiqueta: "Más tiempo esperando" },
  { valor: "nombre", etiqueta: "Por nombre" },
];

const GENEROS = [
  { valor: "hembra", etiqueta: "Hembra" },
  { valor: "macho", etiqueta: "Macho" },
  { valor: "desconocido", etiqueta: "Sin determinar" },
];

const POR_PAGINA = 12;

export default function CandidatosPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Los filtros viven en la URL: es la única fuente de verdad
  const search = searchParams.get("search") ?? "";
  const especie = searchParams.get("especie") ?? "";
  const genero = searchParams.get("genero") ?? "";
  const orden = searchParams.get("orden") ?? "recientes";
  const salida = searchParams.get("salida") ?? "";

  // El input de búsqueda se escribe local y recién después se lleva a la URL,
  // para no disparar una consulta por cada tecla.
  const [busqueda, setBusqueda] = useState(search);

  const [candidatos, setCandidatos] = useState([]);
  const [total, setTotal] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");

  const [especies, setEspecies] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);

  const hayFiltros = Boolean(search || especie || genero || salida) || orden !== "recientes";

  /** Cambia un filtro y reinicia la paginación. */
  const setFiltro = useCallback((clave, valor) => {
    setSearchParams((previos) => {
      const siguientes = new URLSearchParams(previos);
      if (valor) siguientes.set(clave, valor);
      else siguientes.delete(clave);
      return siguientes;
    }, { replace: true });
  }, [setSearchParams]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setSearchParams({}, { replace: true });
  };

  // Debounce de la búsqueda: 350 ms después de dejar de escribir
  const primeraVez = useRef(true);
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    const id = setTimeout(() => setFiltro("search", busqueda.trim()), 350);
    return () => clearTimeout(id);
  }, [busqueda, setFiltro]);

  // Especies para el desplegable: se piden una sola vez
  useEffect(() => {
    let cancelado = false;
    candidatosService
      .getEspecies({ redirectOn401: false })
      .then((datos) => { if (!cancelado) setEspecies(datos); })
      .catch(() => { /* el filtro de especie simplemente no aparece */ });
    return () => { cancelado = true; };
  }, []);

  // Primera página cada vez que cambia un filtro
  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        setCargando(true);
        setError("");
        const datos = await candidatosService.getAll(
          { search, especie, genero, orden, apto_salida: salida, page: 1, page_size: POR_PAGINA },
          { redirectOn401: false },
        );
        if (cancelado) return;
        setCandidatos(datos.resultados);
        setTotal(datos.total);
        setHayMas(datos.hayMas);
        setPagina(1);
      } catch (err) {
        if (!cancelado) setError(err.message || "Error al cargar los candidatos");
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargar();
    return () => { cancelado = true; };
  }, [search, especie, genero, orden, salida]);

  const verMas = async () => {
    try {
      setCargandoMas(true);
      const siguiente = pagina + 1;
      const datos = await candidatosService.getAll(
        { search, especie, genero, orden, apto_salida: salida, page: siguiente, page_size: POR_PAGINA },
        { redirectOn401: false },
      );
      setCandidatos((previos) => [...previos, ...datos.resultados]);
      setHayMas(datos.hayMas);
      setPagina(siguiente);
    } catch (err) {
      setError(err.message || "Error al cargar más candidatos");
    } finally {
      setCargandoMas(false);
    }
  };

  const claseCampo =
    "w-full rounded-2xl border border-bruma bg-espuma px-4 py-2.5 text-sm text-mar " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-arena";

  return (
    <Layout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-mar sm:text-4xl">Buscan una casa</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-niebla-oscuro">
          ¡Mirá sus fichas para conocerlos! Para hacerle una visita y conocerlo en persona, te vamos a pedir una cuenta.
        </p>
      </header>

      {/* ── Filtros ── */}
      <search className="mb-8 rounded-card border border-bruma/60 bg-espuma p-4 shadow-suave sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="buscar" className="mb-1.5 block text-xs font-bold text-mar">
              Buscar por nombre
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-niebla"
                aria-hidden="true"
              />
              <input
                id="buscar"
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Malena, Tuco…"
                className={`${claseCampo} pl-10`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="especie" className="mb-1.5 block text-xs font-bold text-mar">
              Tipo de animal
            </label>
            <select
              id="especie"
              value={especie}
              onChange={(e) => setFiltro("especie", e.target.value)}
              className={`${claseCampo} capitalize`}
            >
              <option value="">Todos</option>
              {especies.map((e) => (
                <option key={e} value={e} className="capitalize">{e}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="genero" className="mb-1.5 block text-xs font-bold text-mar">
              Sexo
            </label>
            <select
              id="genero"
              value={genero}
              onChange={(e) => setFiltro("genero", e.target.value)}
              className={claseCampo}
            >
              <option value="">Todos</option>
              {GENEROS.map((g) => (
                <option key={g.valor} value={g.valor}>{g.etiqueta}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="orden" className="mb-1.5 block text-xs font-bold text-mar">
              Ordenar por
            </label>
            <select
              id="orden"
              value={orden}
              onChange={(e) => setFiltro("orden", e.target.value)}
              className={claseCampo}
            >
              {ORDENES.map((o) => (
                <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-bruma pt-4">
          <p className="flex items-center gap-2 text-xs text-niebla-oscuro">
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            {cargando
              ? "Buscando…"
              : `${total} ${total === 1 ? "animal espera" : "animales esperan"} una casa`}
          </p>
          {hayFiltros && (
            <Button variant="ghost" size="sm" icon={X} onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          )}
        </div>
      </search>

      {/* Se llega acá desde la Home, con el filtro ya puesto en la URL */}
      {salida === "true" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card bg-atardecer/10 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-mar">
            <Sun className="size-4 shrink-0 text-atardecer-oscuro" aria-hidden="true" />
            Estos pueden salir a pasear por el día con vos.
          </p>
          <Button variant="ghost" size="sm" icon={X} onClick={() => setFiltro("salida", "")}>
            Ver todos
          </Button>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* ── Grilla ── */}
      {cargando ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : candidatos.length === 0 ? (
        <EmptyState
          title="No encontramos ninguno así"
          description="Probá con otros filtros. Los animales del refugio cambian seguido, así que quizás mañana haya alguien que encaje."
          action={hayFiltros ? <Button onClick={limpiarFiltros}>Ver todos</Button> : null}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {candidatos.map((c) => (
              <Card key={c.id} candidato={c} onSolicitar={setSeleccionado} />
            ))}
          </div>

          {hayMas && (
            <div className="mt-10 text-center">
              <Button variant="secondary" size="lg" loading={cargandoMas} onClick={verMas}>
                {cargandoMas ? "Cargando…" : "Ver más candidatos"}
              </Button>
            </div>
          )}
        </>
      )}

      {seleccionado && (
        <SolicitudVisitaModal
          candidato={seleccionado}
          onClose={() => setSeleccionado(null)}
          onSuccess={() => setSeleccionado(null)}
        />
      )}
    </Layout>
  );
}
