/**
 * CandidatoDetailPage — la ficha de un animal.
 *
 * Es pública mientras el animal busca casa: a la izquierda la galería, a la
 * derecha los datos y el CTA, así se puede pedir la visita sin volver al
 * catálogo a buscarlo.
 *
 * Cuando ya fue adoptado, la ficha queda archivada y solo la abre el refugio:
 * el backend responde 404 a cualquier otro. Lo que sigue siendo público de esa
 * adopción son los números de /adopciones y la reseña que mandó la familia.
 *
 * Para el refugio, abajo aparecen dos bloques más: el editor de la ficha y la
 * actividad (quién pidió conocerlo, qué visitas hay).
 */

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Archive, ArrowLeft, CalendarDays, Heart, PawPrint, Share2, Sun } from "lucide-react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import FichaAdmin from "../components/FichaAdmin";
import FichaEditor from "../components/FichaEditor";
import Galeria from "../components/Galeria";
import SolicitudVisitaModal from "../components/SolicitudVisitaModal";
import { Cargando } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { candidatosService } from "../services/api";
import { formatEtapa, formatFecha, sufijoGenero } from "../lib/format";

export default function CandidatoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  const [candidato, setCandidato] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      const datos = await candidatosService.getById(id, { redirectOn401: false });
      setCandidato(datos);
    } catch (err) {
      setError(err.message || "Error al cargar el candidato");
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  /** Copia el link de la ficha; si el navegador no deja, no pasa nada grave. */
  const compartir = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setAviso("Copiamos el link de esta ficha.");
      setTimeout(() => setAviso(""), 4000);
    } catch {
      setAviso("No pudimos copiar el link. Copialo desde la barra del navegador.");
    }
  };

  const pedirVisita = () => {
    if (isAuthenticated()) {
      setModalAbierto(true);
      return;
    }
    // Sin cuenta: al login, y después vuelve exactamente acá
    navigate("/login", { state: { from: { pathname: `/candidatos/${id}` } } });
  };

  if (cargando) {
    return <Layout><Cargando texto="Buscando su ficha…" /></Layout>;
  }

  // El backend responde 404 tanto si la ficha no existe como si está archivada
  // por adopción. Desde afuera es lo mismo: no hay nada que ver acá. Por eso el
  // mensaje explica las dos cosas en vez de repetir el "No encontrado." del API.
  if (error || !candidato) {
    return (
      <Layout>
        <Button as={Link} to="/candidatos" variant="secondary" size="sm" icon={ArrowLeft} className="mb-5">
          Volver al catálogo
        </Button>
        <EmptyState
          icon={PawPrint}
          title="No encontramos esta ficha"
          description="Puede que este animal ya haya encontrado casa: cuando eso pasa, archivamos su ficha. Mirá quiénes siguen esperando."
          action={<Button as={Link} to="/candidatos">Ver el catálogo</Button>}
        />
      </Layout>
    );
  }

  // La portada encabeza la galería; después van las fotos extra
  const fotos = [
    ...(candidato.imagen ? [{ id: "portada", src: candidato.imagen, alt: "" }] : []),
    ...(candidato.fotos ?? []),
  ];

  // `capitalize` solo donde el valor viene en minúscula desde la base; la
  // etapa ya viene con mayúscula desde el helper.
  const datos = [
    { etiqueta: "Etapa", valor: formatEtapa(candidato.etapa), capitalizar: false },
    { etiqueta: "Especie", valor: candidato.especie, capitalizar: true },
    {
      etiqueta: "Sexo",
      valor: candidato.genero === "desconocido" ? "Sin determinar" : candidato.genero,
      capitalizar: true,
    },
  ];

  return (
    <Layout>
      <Button as={Link} to="/candidatos" variant="secondary" size="sm" icon={ArrowLeft} className="mb-6">
        Volver al catálogo
      </Button>

      <article className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <Galeria fotos={fotos} nombre={candidato.nombre} especie={candidato.especie} />

        <div className="flex flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-4xl font-bold text-mar">{candidato.nombre}</h1>
            <Badge
              text={candidato.adoptado ? "Adoptado" : "Busca casa"}
              variant={candidato.adoptado ? "adoptado" : "disponible"}
              icon={candidato.adoptado ? Heart : undefined}
            />
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-bruma py-5">
            {datos.map((d) => (
              <div key={d.etiqueta}>
                <dt className="text-xs font-bold uppercase tracking-wide text-niebla-oscuro">
                  {d.etiqueta}
                </dt>
                <dd className={`mt-1 text-sm text-mar ${d.capitalizar ? "capitalize" : ""}`}>
                  {d.valor}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex-1">
            <h2 className="font-display text-lg font-bold text-mar">Su historia</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-niebla-oscuro">
              {candidato.descripcion}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {candidato.adoptado ? (
              <div className="rounded-2xl bg-pino/10 px-5 py-4">
                <p className="flex items-center gap-2 text-sm font-bold text-pino">
                  <Archive className="size-4 shrink-0" aria-hidden="true" />
                  Ficha archivada
                </p>
                <p className="mt-1 text-sm text-niebla-oscuro">
                  {candidato.nombre} ya encontró su casa
                  {candidato.fecha_adopcion && <> el {formatFecha(candidato.fecha_adopcion)}</>}
                  {candidato.adoptante && <>, con {candidato.adoptante}</>}.
                  Fuera del refugio, esta ficha no se ve.
                </p>
              </div>
            ) : (
              <Button variant="acento" size="lg" icon={CalendarDays} onClick={pedirVisita}>
                Quiero conocer{sufijoGenero(candidato.genero)}
              </Button>
            )}

            <Button variant="secondary" size="lg" icon={Share2} onClick={compartir}>
              Compartir
            </Button>
          </div>

          {!candidato.adoptado && candidato.apto_salida && (
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-atardecer/10 p-3 text-sm leading-relaxed text-mar">
              <Sun className="mt-0.5 size-4 shrink-0 text-atardecer-oscuro" aria-hidden="true" />
              <span>
                <strong>También puede salir por el día.</strong> Podés venir al refugio,
                dejar tus datos y llevar{sufijoGenero(candidato.genero)} a pasear unas horas.{" "}
                <a href="/#un-dia-afuera" className="font-bold text-atardecer-oscuro underline underline-offset-2">
                  Cómo funciona
                </a>.
              </span>
            </p>
          )}

          {!candidato.adoptado && !isAuthenticated() && (
            <p className="mt-3 text-xs text-niebla-oscuro">
              Para coordinar una visita te vamos a pedir una cuenta. Se hace en un minuto.
            </p>
          )}

          <p aria-live="polite" className="mt-3 text-xs font-semibold text-pino">
            {aviso}
          </p>
        </div>
      </article>

      {isAdmin() && (
        <>
          <FichaEditor
            candidato={candidato}
            onCambio={cargar}
            onBorrado={() => navigate("/candidatos")}
          />
          <FichaAdmin candidatoId={candidato.id} onCambio={cargar} />
        </>
      )}

      {modalAbierto && (
        <SolicitudVisitaModal
          candidato={candidato}
          onClose={() => setModalAbierto(false)}
          onSuccess={() => {
            setModalAbierto(false);
            setAviso("Recibimos tu pedido. En breve un voluntario se pondrá en contacto.");
          }}
        />
      )}
    </Layout>
  );
}
