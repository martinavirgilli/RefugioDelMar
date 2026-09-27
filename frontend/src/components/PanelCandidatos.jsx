/**
 * PanelCandidatos — el catálogo visto por el equipo del refugio.
 *
 * Hasta acá el admin veía la misma grilla de tarjetas que un visitante, que
 * está pensada para enamorarse de un animal, no para administrar trece fichas.
 * Esta vista es una lista densa: en cada fila entra todo lo que el refugio
 * necesita saber de un vistazo (quién tiene gente esperando respuesta, cuántas
 * fotos tiene la ficha, quién puede salir por el día) y las acciones a mano.
 *
 * Las fichas archivadas viven acá y solo acá: al adoptarse, la ficha sale del
 * catálogo público. Se llega a ellas con el filtro de estado.
 *
 * Editar los datos de un animal vive en su ficha (FichaEditor), no en esta
 * lista: son muchos campos para una fila, y desde la ficha se ve el resultado.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Archive, Camera, ClipboardList, Heart, PawPrint, PencilLine, Plus, Quote,
  Search, Sun, Trash2, Undo2, X,
} from "lucide-react";
import Layout from "./Layout";
import Badge from "./Badge";
import Button from "./Button";
import EmptyState from "./EmptyState";
import Skeleton from "./Skeleton";
import { adopcionesService, candidatosService, solicitudesService } from "../services/api";
import { ETAPAS, formatEtapa, formatFecha } from "../lib/format";

const ESTADOS = [
  { valor: "publicados", etiqueta: "En el catálogo", adoptado: "false" },
  { valor: "archivados", etiqueta: "Archivados (adoptados)", adoptado: "true" },
  { valor: "todos", etiqueta: "Todos", adoptado: "" },
];

const GENEROS = [
  { valor: "hembra", etiqueta: "Hembra" },
  { valor: "macho", etiqueta: "Macho" },
  { valor: "desconocido", etiqueta: "Sin determinar" },
];

const ORDENES = [
  { valor: "recientes", etiqueta: "Los últimos en llegar" },
  { valor: "antiguos", etiqueta: "Más tiempo esperando" },
  { valor: "nombre", etiqueta: "Por nombre" },
];

const POR_PAGINA = 20;

/** Un número del encabezado. */
function Contador({ icon: Icon, valor, etiqueta, cargando, destacado = false }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-bruma/60 bg-espuma px-4 py-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-full ${destacado ? "bg-duna/25" : "bg-bruma/50"}`}>
        <Icon className="size-4 text-mar" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        {cargando ? (
          <Skeleton className="h-6 w-10" />
        ) : (
          <p className="font-display text-xl font-bold leading-none text-mar">{valor}</p>
        )}
        <p className="mt-1 text-xs text-niebla-oscuro">{etiqueta}</p>
      </div>
    </div>
  );
}

export default function PanelCandidatos() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Los filtros viven en la URL, igual que en el catálogo público: así una
  // búsqueda se puede dejar abierta en una pestaña y volver a ella.
  const search = searchParams.get("search") ?? "";
  const especie = searchParams.get("especie") ?? "";
  const genero = searchParams.get("genero") ?? "";
  const etapa = searchParams.get("etapa") ?? "";
  const estado = searchParams.get("estado") ?? "publicados";
  const salida = searchParams.get("salida") ?? "";
  const orden = searchParams.get("orden") ?? "recientes";

  const [busqueda, setBusqueda] = useState(search);
  const [candidatos, setCandidatos] = useState([]);
  const [total, setTotal] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");
  const [especies, setEspecies] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [pendientes, setPendientes] = useState(null);

  const adoptado = ESTADOS.find((e) => e.valor === estado)?.adoptado ?? "false";
  const hayFiltros = Boolean(search || especie || genero || etapa || salida) ||
    estado !== "publicados" || orden !== "recientes";

  const filtros = { search, especie, genero, etapa, orden, adoptado, apto_salida: salida };

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

  // Encabezado y desplegable de especies: una sola vez
  useEffect(() => {
    let cancelado = false;

    const cargarEncabezado = async () => {
      const [e, r, s] = await Promise.allSettled([
        candidatosService.getEspecies(),
        adopcionesService.getResumen(),
        solicitudesService.getAll({ estado: "revision" }),
      ]);
      if (cancelado) return;
      if (e.status === "fulfilled") setEspecies(e.value);
      if (r.status === "fulfilled") setResumen(r.value);
      if (s.status === "fulfilled") {
        setPendientes(s.value.filter((sol) => sol.estado === "revision").length);
      }
    };

    cargarEncabezado();
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        setCargando(true);
        setError("");
        const datos = await candidatosService.getAll({
          search, especie, genero, etapa, orden, adoptado, apto_salida: salida,
          page: 1, page_size: POR_PAGINA,
        });
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
  }, [search, especie, genero, etapa, orden, adoptado, salida]);

  const verMas = async () => {
    try {
      setCargandoMas(true);
      const datos = await candidatosService.getAll({
        ...filtros, page: pagina + 1, page_size: POR_PAGINA,
      });
      setCandidatos((previos) => [...previos, ...datos.resultados]);
      setHayMas(datos.hayMas);
      setPagina(pagina + 1);
    } catch (err) {
      setError(err.message || "Error al cargar más candidatos");
    } finally {
      setCargandoMas(false);
    }
  };

  /** Recarga lo que está a la vista, sin perder las páginas ya pedidas. */
  const recargar = async () => {
    const [datos, nuevoResumen] = await Promise.all([
      candidatosService.getAll({ ...filtros, page_size: POR_PAGINA * pagina }),
      adopcionesService.getResumen().catch(() => null),
    ]);
    setCandidatos(datos.resultados);
    setTotal(datos.total);
    setHayMas(datos.hayMas);
    if (nuevoResumen) setResumen(nuevoResumen);
  };

  const alternarAdopcion = async (candidato) => {
    const mensaje = candidato.adoptado
      ? `¿Devolver a ${candidato.nombre} al catálogo? Se borran la fecha de adopción y el adoptante.`
      : `¿Marcar a ${candidato.nombre} como adoptado? Su ficha se archiva y sale del catálogo público.`;
    if (!window.confirm(mensaje)) return;

    try {
      await candidatosService.toggleAdopcion(candidato.id);
      await recargar();
    } catch (err) {
      setError(err.message || "Error al actualizar el estado de adopción");
    }
  };

  const borrar = async (candidato) => {
    if (!window.confirm(
      `¿Eliminar la ficha de ${candidato.nombre}? Se borra para siempre. ` +
      "Si ya fue adoptado, archivalo en vez de borrarlo.",
    )) return;
    try {
      await candidatosService.delete(candidato.id);
      await recargar();
    } catch (err) {
      setError(err.message || "Error al eliminar el candidato");
    }
  };

  const claseCampo =
    "w-full rounded-2xl border border-bruma bg-espuma px-4 py-2.5 text-sm text-mar " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-arena";

  return (
    <Layout>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-mar sm:text-4xl">Candidatos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-niebla-oscuro">
            La vista del refugio: fichas publicadas, archivadas y quién está esperando respuesta.
            Para editar una ficha, entrá a ella.
          </p>
        </div>
        <Button as={Link} to="/nuevo" icon={Plus}>Nuevo candidato</Button>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Contador
          icon={PawPrint}
          valor={resumen?.disponibles ?? 0}
          etiqueta="en el catálogo"
          cargando={!resumen}
        />
        <Contador
          icon={Archive}
          valor={resumen?.adoptados ?? 0}
          etiqueta="fichas archivadas"
          cargando={!resumen}
        />
        <Contador
          icon={ClipboardList}
          valor={pendientes ?? 0}
          etiqueta="esperando respuesta"
          cargando={pendientes === null}
          destacado={Boolean(pendientes)}
        />
        <div className="flex items-center rounded-2xl border border-bruma/60 bg-espuma px-4 py-3">
          <Button as={Link} to="/visitas" variant="secondary" size="sm" className="w-full">
            Ir a visitas
          </Button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <search className="mb-6 rounded-card border border-bruma/60 bg-espuma p-4 shadow-suave sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
            <label htmlFor="estado" className="mb-1.5 block text-xs font-bold text-mar">Estado</label>
            <select
              id="estado"
              value={estado}
              onChange={(e) => setFiltro("estado", e.target.value)}
              className={claseCampo}
            >
              {ESTADOS.map((e) => (
                <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="especie" className="mb-1.5 block text-xs font-bold text-mar">Tipo</label>
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
            <label htmlFor="etapa" className="mb-1.5 block text-xs font-bold text-mar">Etapa</label>
            <select
              id="etapa"
              value={etapa}
              onChange={(e) => setFiltro("etapa", e.target.value)}
              className={claseCampo}
            >
              <option value="">Todas</option>
              {ETAPAS.map((e) => (
                <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="genero" className="mb-1.5 block text-xs font-bold text-mar">Sexo</label>
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
            <label htmlFor="orden" className="mb-1.5 block text-xs font-bold text-mar">Ordenar</label>
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
          <label className="flex items-center gap-2 text-xs font-semibold text-mar">
            <input
              type="checkbox"
              checked={salida === "true"}
              onChange={(e) => setFiltro("salida", e.target.checked ? "true" : "")}
              className="size-4 accent-mar"
            />
            <Sun className="size-3.5 text-atardecer-oscuro" aria-hidden="true" />
            Solo los que pueden salir por el día
          </label>

          <div className="flex items-center gap-3">
            <p className="text-xs text-niebla-oscuro">
              {cargando ? "Buscando…" : `${total} ${total === 1 ? "ficha" : "fichas"}`}
            </p>
            {hayFiltros && (
              <Button variant="ghost" size="sm" icon={X} onClick={limpiarFiltros}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </search>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* ── Lista ── */}
      {cargando ? (
        <ul className="space-y-3" aria-busy="true">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="rounded-card border border-bruma/60 bg-espuma p-4">
              <Skeleton className="h-16 w-full" />
            </li>
          ))}
        </ul>
      ) : candidatos.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="No hay fichas con estos filtros"
          description="Probá con otros, o cargá un candidato nuevo."
          action={
            hayFiltros
              ? <Button onClick={limpiarFiltros}>Ver todas</Button>
              : <Button as={Link} to="/nuevo" icon={Plus}>Nuevo candidato</Button>
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {candidatos.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-4 rounded-card border border-bruma/60 bg-espuma p-4 shadow-suave transition-shadow hover:shadow-elevada"
              >
                {c.imagen ? (
                  <img
                    src={c.imagen}
                    alt=""
                    loading="lazy"
                    className="size-16 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-bruma/30">
                    <PawPrint className="size-6 text-niebla/50" aria-hidden="true" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/candidatos/${c.id}`}
                      className="rounded text-base font-bold text-mar hover:text-mar-claro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mar-claro focus-visible:ring-offset-2 focus-visible:ring-offset-espuma"
                    >
                      {c.nombre}
                    </Link>
                    {c.adoptado && <Badge text="Archivada" variant="adoptado" icon={Archive} />}
                    {c.solicitudes_pendientes > 0 && (
                      <Badge
                        text={`${c.solicitudes_pendientes} esperando`}
                        variant="revision"
                        icon={ClipboardList}
                      />
                    )}
                    {c.apto_salida && !c.adoptado && (
                      <Badge text="Sale por el día" icon={Sun} />
                    )}
                  </div>

                  <p className="mt-1 text-xs text-niebla-oscuro">
                    <span className="capitalize">{c.especie}</span>
                    {" · "}{formatEtapa(c.etapa)}
                    {c.genero !== "desconocido" && <span className="capitalize"> · {c.genero}</span>}
                    {" · "}
                    <span className="inline-flex items-center gap-1">
                      <Camera className="size-3" aria-hidden="true" />
                      {c.fotos?.length ?? 0}
                    </span>
                    {c.adoptado && (
                      <>
                        {" · "}
                        <span className="inline-flex items-center gap-1">
                          <Quote className="size-3" aria-hidden="true" />
                          {c.resenas?.length ?? 0}
                        </span>
                      </>
                    )}
                  </p>

                  {c.adoptado && c.fecha_adopcion && (
                    <p className="mt-1 text-xs text-niebla-oscuro">
                      Se fue el {formatFecha(c.fecha_adopcion)}
                      {c.adoptante && <> con {c.adoptante}</>}.
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button as={Link} to={`/candidatos/${c.id}`} variant="secondary" size="sm" icon={PencilLine}>
                    Ver y editar
                  </Button>
                  <Button
                    variant={c.adoptado ? "ghost" : "primary"}
                    size="sm"
                    icon={c.adoptado ? Undo2 : Heart}
                    onClick={() => alternarAdopcion(c)}
                  >
                    {c.adoptado ? "Republicar" : "Adoptado"}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    aria-label={`Eliminar la ficha de ${c.nombre}`}
                    onClick={() => borrar(c)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {hayMas && (
            <div className="mt-8 text-center">
              <Button variant="secondary" loading={cargandoMas} onClick={verMas}>
                {cargandoMas ? "Cargando…" : "Ver más fichas"}
              </Button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
