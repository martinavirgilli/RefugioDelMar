/**
 * HomePage — la puerta de entrada del refugio.
 *
 * Siete secciones: hero, impacto, candidatos destacados, cómo adoptar, un día
 * afuera, historias de las familias y cómo ayudar.
 *
 * Los datos son siempre reales: el catálogo, el resumen y las reseñas ya son
 * públicos, así que no hace falta contenido de ejemplo ni degradar nada sin
 * sesión. Las historias salen de las reseñas que carga el refugio; si todavía
 * no hay ninguna publicada, la sección no se muestra.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CalendarHeart, Clock, Gift, Handshake, Heart, HeartHandshake,
  House, IdCard, MapPin, PawPrint, Quote, Search, Sparkles, Sun,
} from "lucide-react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Card from "../components/Card";
import ColaboracionModal from "../components/ColaboracionModal";
import Skeleton, { SkeletonCard } from "../components/Skeleton";
import { adopcionesService, candidatosService } from "../services/api";

import portada640 from "../assets/images/portada-640.webp";
import portada1024 from "../assets/images/portada-1024.webp";
import portada1600 from "../assets/images/portada-1600.webp";

// ── Contenido de la página ────────────────────────────────────────────────

/** Dirección del refugio, ficticia como todo el resto de los datos. */
const DIRECCION = "Av. de los Pinos 1450, Pinamar";

/** Link de donación de mentira: no hay una cuenta real detrás. */
const LINK_DONACION = "https://link.mercadopago.com.ar/refugiodelmar-demo";

const PASOS = [
  { icon: Search, titulo: "Conocelos", texto: "Mirá el catálogo y leé la historia de cada animal. Fijate con cuál te pasa algo." },
  { icon: CalendarHeart, titulo: "Pedí una visita", texto: "Contanos por qué querés conocerlo y cómo es tu casa. Es un formulario corto." },
  { icon: Handshake, titulo: "Vení a encontrarlo", texto: "Coordinamos día y hora en el refugio. Sin apuro: la idea es que se conozcan de verdad." },
  { icon: House, titulo: "Llevalo a casa", texto: "Si los dos están cómodos, se va con vos castrado, vacunado y con seguimiento nuestro." },
];

/** Cómo funciona "Un día afuera", en tres pasos. */
const PASOS_SALIDA = [
  {
    icon: MapPin,
    titulo: "Venite al refugio",
    texto: "Sin turno ni trámite previo: cualquier día de 10 a 16, golpeás la puerta y entrás.",
  },
  {
    icon: IdCard,
    titulo: "Dejá tus datos y elegí",
    texto: "Mostrás un documento, dejás un teléfono y firmás una planilla corta. Te contamos quién está para salir y elegís con quién pasar el día.",
  },
  {
    icon: Clock,
    titulo: "Traelo antes de que cierre",
    texto: "Vuelven los dos antes de las 19. Te damos correa, agua y bolsitas; vos traés las ganas.",
  },
];

// ── Bloques reutilizables de esta página ──────────────────────────────────

/** Título de sección: kicker chico + título grande + bajada opcional. */
function TituloSeccion({ kicker, titulo, bajada, centrado = true }) {
  return (
    <div className={`mb-10 max-w-2xl ${centrado ? "mx-auto text-center" : ""}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-niebla-oscuro">{kicker}</p>
      <h2 className="mt-2 text-3xl font-bold text-mar sm:text-4xl">{titulo}</h2>
      {bajada && <p className="mt-3 text-base leading-relaxed text-niebla-oscuro">{bajada}</p>}
    </div>
  );
}

/** Un número grande del contador de impacto. */
function Numero({ valor, etiqueta, cargando }) {
  return (
    <div className="text-center">
      {cargando ? (
        <Skeleton className="mx-auto h-11 w-24" />
      ) : (
        <p className="font-display text-4xl font-bold text-mar sm:text-5xl">{valor}</p>
      )}
      <p className="mt-2 text-sm font-semibold text-niebla-oscuro">{etiqueta}</p>
    </div>
  );
}

export default function HomePage() {
  const [resumen, setResumen] = useState(null);
  const [destacados, setDestacados] = useState([]);
  const [historias, setHistorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [colaboracion, setColaboracion] = useState(null); // "voluntario" | "transito"

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      // allSettled: que falle el resumen no tiene por qué dejar la Home sin animales
      const [r, c, h] = await Promise.allSettled([
        adopcionesService.getResumen({ redirectOn401: false }),
        candidatosService.getAll(
          { adoptado: "false", orden: "antiguos", page_size: 3 },
          { redirectOn401: false },
        ),
        candidatosService.getResenasPublicas(3, { redirectOn401: false }),
      ]);
      if (cancelado) return;

      if (r.status === "fulfilled") setResumen(r.value);
      if (c.status === "fulfilled") setDestacados(c.value.resultados);
      if (h.status === "fulfilled") setHistorias(h.value);
      setCargando(false);
    };

    cargar();
    return () => { cancelado = true; };
  }, []);

  const datos = resumen ?? { adoptados: 0, disponibles: 0, total: 0 };

  return (
    <Layout>

      {/* ── 1. Hero ────────────────────────────────────────────────────── */}
      {/* En pantallas chicas el texto no entra arriba de la foto: el titular se
          cortaba. Hasta lg va debajo, sobre arena; desde lg, superpuesto. */}
      <section className="animate-surgir">
        <div className="relative">
          <img
            src={portada1024}
            srcSet={`${portada640} 640w, ${portada1024} 1024w, ${portada1600} 1600w`}
            sizes="(min-width: 1152px) 1152px, 100vw"
            width={1600}
            height={533}
            fetchPriority="high"
            decoding="async"
            alt="Patio del Refugio del Mar en un día de sol, con perros sueltos sobre el pasto y un cartel de madera que dice “Un hogar para cada patita”"
            className="aspect-[4/3] w-full rounded-blob object-cover object-center shadow-elevada sm:aspect-[16/9] lg:aspect-[5/2]"
          />
          {/* Degradado: solo hace falta cuando el texto va arriba de la foto */}
          <div
            className="absolute inset-0 hidden rounded-blob bg-gradient-to-t from-mar/95 via-mar/60 to-mar/10 lg:block"
            aria-hidden="true"
          />

          <div className="mt-7 flex flex-col gap-4 lg:absolute lg:inset-0 lg:mt-0 lg:justify-end lg:p-14">
            <h1 className="max-w-2xl text-3xl font-bold leading-tight text-mar sm:text-4xl lg:text-white lg:drop-shadow-sm">
              Acá cada animal espera lo mismo: que alguien lo elija.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-niebla-oscuro sm:text-base lg:text-bruma">
              Somos un refugio en Pinamar. Rescatamos animales de la costa, los curamos
              y buscamos la casa que les toca. Quizás sea la tuya.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button as={Link} to="/candidatos" variant="acento" size="lg" icon={PawPrint}>
                Conocé a los candidatos
              </Button>
              <Button
                as="a"
                href="#como-adoptar"
                variant="secondary"
                size="lg"
                className="lg:border-transparent lg:bg-white lg:hover:bg-espuma"
              >
                Cómo adoptar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Impacto ─────────────────────────────────────────────────── */}
      <section className="mt-16" aria-labelledby="impacto-titulo" aria-busy={cargando}>
        <div className="rounded-card border border-bruma/60 bg-espuma px-6 py-10 shadow-suave">
          <h2 id="impacto-titulo" className="text-center text-2xl font-bold text-mar">
            Lo que venimos haciendo
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <Numero valor={datos.adoptados} etiqueta="animales adoptados" cargando={cargando} />
            <Numero valor={datos.disponibles} etiqueta="esperando una casa" cargando={cargando} />
            <Numero valor={datos.total} etiqueta="pasaron por el refugio" cargando={cargando} />
          </div>

        </div>
      </section>

      {/* ── 3. Candidatos destacados ───────────────────────────────────── */}
      <section className="mt-20" aria-labelledby="destacados-titulo" aria-busy={cargando}>
        <TituloSeccion
          kicker="Buscan casa"
          titulo="Los que más tiempo llevan esperando"
          bajada="Cada uno llegó de una manera distinta. Todos están castrados, vacunados y listos para irse."
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cargando
            ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
            : destacados.map((c) => <Card key={c.id} candidato={c} variant="destacado" />)}
        </div>

        {!cargando && destacados.length === 0 && (
          <p className="rounded-card border border-bruma/60 bg-espuma px-6 py-10 text-center text-sm text-niebla-oscuro">
            Ahora mismo no hay animales esperando casa. Volvé pronto.
          </p>
        )}

        <div className="mt-10 text-center">
          <Button as={Link} to="/candidatos" variant="secondary" icon={ArrowRight}>
            Ver todos los candidatos
          </Button>
        </div>
      </section>

      {/* ── 4. Cómo funciona adoptar ───────────────────────────────────── */}
      <section id="como-adoptar" className="mt-20 scroll-mt-24" aria-labelledby="adoptar-titulo">
        <TituloSeccion
          kicker="Paso a paso"
          titulo="Cómo funciona adoptar"
          bajada="No hay letra chica ni costo: solo queremos estar seguros de que es una buena idea para los dos."
        />

        <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso, i) => (
            <li
              key={paso.titulo}
              className="relative rounded-card border border-bruma/60 bg-espuma p-6 shadow-suave"
            >
              <span
                className="absolute right-5 top-5 font-display text-4xl font-bold text-duna/35"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="grid size-12 place-items-center rounded-full bg-bruma/50">
                <paso.icon className="size-6 text-mar" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-mar">{paso.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-niebla-oscuro">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 5. Un día afuera ───────────────────────────────────────────── */}
      {/* La iniciativa nueva. Va antes de las historias porque es lo más
          distinto que tiene el refugio para ofrecer y no requiere decidir nada:
          es la puerta de entrada más barata que existe para alguien que duda. */}
      <section id="un-dia-afuera" className="mt-20 scroll-mt-24" aria-labelledby="salida-titulo">
        <div className="overflow-hidden rounded-blob border border-duna/30 bg-gradient-to-br from-arena via-espuma to-bruma/40 shadow-suave">
          <div className="grid grid-cols-1 gap-10 p-6 sm:p-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12">

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-atardecer/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-atardecer-oscuro">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Arrancamos con esto
              </span>

              <h2 id="salida-titulo" className="mt-4 text-3xl font-bold text-mar sm:text-4xl">
                Llevate a uno por el día
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-niebla-oscuro">
                No hace falta adoptar para cambiarle el día a un animal del refugio. Venís, elegís
                a uno y se van juntos: a la playa, al parque, a tomar algo o a tirarse en tu patio.
                Lo traés antes de que cierre y listo.
              </p>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-niebla-oscuro">
                Para ellos, un día afuera es salir del ruido de las jaulas y volver a confiar en
                alguien. Para nosotros, alguien que los vio andar sueltos cuenta mejor cómo son que
                cualquier ficha. Y más de una adopción empezó justo así.
              </p>

              <ol className="mt-8 space-y-4">
                {PASOS_SALIDA.map((paso, i) => (
                  <li key={paso.titulo} className="flex gap-4">
                    <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-espuma shadow-suave">
                      <paso.icon className="size-5 text-mar" aria-hidden="true" />
                      <span
                        className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-mar text-[10px] font-bold text-white"
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-mar">{paso.titulo}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-niebla-oscuro">{paso.texto}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button as={Link} to="/candidatos?salida=true" variant="acento" size="lg" icon={Sun}>
                  Ver quiénes pueden salir
                </Button>
                <Button
                  as="a"
                  href="mailto:hola@refugiodelmar.org?subject=Quiero%20sacar%20a%20pasear%20a%20uno"
                  variant="secondary"
                  size="lg"
                >
                  Tengo una duda
                </Button>
              </div>
            </div>

            {/* La letra chica, ahí donde alguien la busca antes de venir.
                self-start: sin eso la grilla la estira hasta el alto de la
                columna de al lado y queda un hueco abajo. */}
            <aside className="self-start rounded-card border border-bruma/60 bg-espuma p-6 shadow-suave">
              <h3 className="font-display text-lg font-bold text-mar">Lo que conviene saber</h3>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-duna" aria-hidden="true" />
                  <div>
                    <dt className="font-bold text-mar">Horario</dt>
                    <dd className="mt-0.5 leading-relaxed text-niebla-oscuro">
                      Salen de 10 a 16 y vuelven antes de las 19. Todos los días.
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <IdCard className="mt-0.5 size-4 shrink-0 text-duna" aria-hidden="true" />
                  <div>
                    <dt className="font-bold text-mar">Qué llevar</dt>
                    <dd className="mt-0.5 leading-relaxed text-niebla-oscuro">
                      Un documento y un teléfono donde encontrarte. Nada más: es gratis.
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-duna" aria-hidden="true" />
                  <div>
                    <dt className="font-bold text-mar">Dónde</dt>
                    <dd className="mt-0.5 leading-relaxed text-niebla-oscuro">{DIRECCION}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <PawPrint className="mt-0.5 size-4 shrink-0 text-duna" aria-hidden="true" />
                  <div>
                    <dt className="font-bold text-mar">Quiénes salen</dt>
                    <dd className="mt-0.5 leading-relaxed text-niebla-oscuro">
                      Los que ya están cómodos con gente y con la correa. En su ficha lo dice; los
                      que recién llegaron todavía no.
                    </dd>
                  </div>
                </div>
              </dl>

              <p className="mt-6 rounded-2xl bg-arena/70 p-3 text-xs leading-relaxed text-niebla-oscuro">
                Si en el día te das cuenta de que no querés devolverlo, avisanos: la adopción se
                arranca ahí mismo.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* ── 6. Historias de las familias ─────────────────────────────── */}
      {/* Salen de las reseñas que carga el refugio. Sin ninguna publicada, la
          sección no se muestra: mejor eso que testimonios de mentira. */}
      {historias.length > 0 && (
        <section className="mt-20" aria-labelledby="historias-titulo">
          <TituloSeccion
            kicker="Finales felices"
            titulo="Cómo les fue a los que ya se fueron"
            bajada="Lo que nos cuentan las familias cuando pasa el tiempo. Nos mandan fotos y las publicamos acá."
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {historias.map((h) => {
              const foto = h.src || h.candidato_imagen;
              return (
                <figure
                  key={h.id}
                  className="flex flex-col overflow-hidden rounded-card border border-bruma/60 bg-espuma shadow-suave"
                >
                  {foto && (
                    <img
                      src={foto}
                      alt={`${h.candidato_nombre} en su casa nueva`}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] w-full object-cover"
                    />
                  )}
                  <blockquote className="flex flex-1 flex-col p-6">
                    <Quote className="size-6 shrink-0 text-duna" aria-hidden="true" />
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-niebla-oscuro">
                      {h.texto}
                    </p>
                    <figcaption className="mt-5 border-t border-bruma pt-4">
                      <span className="block font-display text-base font-bold text-mar">
                        {h.candidato_nombre}
                      </span>
                      <span className="mt-0.5 block text-xs text-niebla-oscuro">{h.autor}</span>
                    </figcaption>
                  </blockquote>
                </figure>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button as={Link} to="/adopciones" variant="ghost" icon={ArrowRight}>
              Ver todas las adopciones
            </Button>
          </div>
        </section>
      )}

      {/* ── 7. Cómo ayudar + CTA final ─────────────────────────────────── */}
      <section className="mt-20" aria-labelledby="ayudar-titulo">
        <TituloSeccion
          kicker="No solo adoptando"
          titulo="Otras formas de dar una mano"
          bajada="Adoptar no es la única manera de cambiarle el día a un animal del refugio."
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">

          <div className="flex flex-col rounded-card border border-bruma/60 bg-espuma p-6 shadow-suave">
            <span className="grid size-12 place-items-center rounded-full bg-bruma/50">
              <HeartHandshake className="size-6 text-mar" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-mar">Hacete voluntario</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-niebla-oscuro">
              Paseos, baños, fotos para las fichas o una mano los sábados a la mañana.
              Toda ayuda suma.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-5 self-start"
              onClick={() => setColaboracion("voluntario")}
            >
              Quiero anotarme
            </Button>
          </div>

          <div className="flex flex-col rounded-card border border-bruma/60 bg-espuma p-6 shadow-suave">
            <span className="grid size-12 place-items-center rounded-full bg-bruma/50">
              <Gift className="size-6 text-mar" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-mar">Doná lo que puedas</h3>
            <p className="mt-2 text-sm leading-relaxed text-niebla-oscuro">
              Un aporte para el veterinario, o alimento, mantas y antiparasitarios que podés
              acercar vos mismo.
            </p>
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-arena/70 p-3 text-xs leading-relaxed text-niebla-oscuro">
              <MapPin className="mt-0.5 size-4 shrink-0 text-duna" aria-hidden="true" />
              <span>
                Dejá lo que quieras donar en <strong className="text-mar">{DIRECCION}</strong>,
                de lunes a viernes de 10 a 17 h.
              </span>
            </p>
            <Button
              as="a"
              href={LINK_DONACION}
              target="_blank"
              rel="noopener noreferrer"
              variant="acento"
              size="sm"
              className="mt-4 self-start"
            >
              Donar por Mercado Pago
            </Button>
            <p className="mt-2 text-xs text-niebla-oscuro">
              Link de demostración: no cobra nada de verdad.
            </p>
          </div>

          <div className="flex flex-col rounded-card border border-bruma/60 bg-espuma p-6 shadow-suave">
            <span className="grid size-12 place-items-center rounded-full bg-bruma/50">
              <Sparkles className="size-6 text-mar" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-mar">Sé hogar de tránsito</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-niebla-oscuro">
              Un lugar temporal mientras un animal se recupera cambia por completo cómo llega a
              su adopción. El alimento y la veterinaria los ponemos nosotros.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-5 self-start"
              onClick={() => setColaboracion("transito")}
            >
              Ofrecer mi casa
            </Button>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-blob bg-mar px-6 py-14 text-center text-white shadow-elevada">
          <Heart className="mx-auto size-9 text-bruma" aria-hidden="true" />
          <h2 id="ayudar-titulo" className="mt-4 text-3xl font-bold sm:text-4xl">
            Hay uno esperándote
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-bruma sm:text-base">
            Entrá al catálogo, mirá sus caras y pedí conocer al que te mueva algo.
            No hace falta decidir nada hoy.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button as={Link} to="/candidatos" variant="acento" size="lg" icon={PawPrint}>
              Ver los candidatos
            </Button>
            <Button
              as="a"
              href="mailto:hola@refugiodelmar.org?subject=Quiero%20ser%20voluntario"
              variant="claro"
              size="lg"
            >
              Quiero ser voluntario
            </Button>
          </div>
        </div>
      </section>

      {colaboracion && (
        <ColaboracionModal tipo={colaboracion} onClose={() => setColaboracion(null)} />
      )}
    </Layout>
  );
}
