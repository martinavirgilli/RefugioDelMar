/**
 * HomePage — la puerta de entrada del refugio.
 *
 * Seis secciones: hero, impacto, candidatos destacados, cómo adoptar,
 * historias y cómo ayudar.
 *
 * Los datos son siempre reales: el catálogo y el resumen ya son públicos, así
 * que no hace falta contenido de ejemplo ni degradar nada sin sesión.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CalendarHeart, Gift, Handshake, Heart, HeartHandshake,
  House, MapPin, PawPrint, Quote, Search, Sparkles,
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
import fotoMalena from "../assets/images/candidato5.jpg";
import fotoTuco from "../assets/images/candidato7.jpg";
import fotoBruno from "../assets/images/candidato3.jpg";

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

const HISTORIAS = [
  {
    nombre: "Malena", foto: fotoMalena, cuando: "adoptada en marzo de 2026",
    alt: "Retrato de Malena, perra mestiza marrón y blanca, mirando a cámara",
    testimonio: "La fuimos a conocer “solo para ver” y volvimos con ella el sábado siguiente. Duerme al lado de la puerta esperando que alguien proponga ir a la playa.",
    familia: "Familia Ferreyra, Ostende",
  },
  {
    nombre: "Tuco", foto: fotoTuco, cuando: "adoptado en enero de 2026",
    alt: "Retrato de Tuco, gato naranja de pelo largo, sentado y atento",
    testimonio: "Vivo en un departamento chico y tenía miedo de que no le alcanzara el espacio. Se adueñó del sillón, de la ventana y de mí en dos días.",
    familia: "Camila R., Pinamar centro",
  },
  {
    nombre: "Bruno", foto: fotoBruno, cuando: "adoptado en noviembre de 2025",
    alt: "Retrato de Bruno, perro mestizo grande de hocico canoso, recibiendo una caricia",
    testimonio: "Tenía nueve años y nadie preguntaba por él. Hace un año que nos acompaña a caminar por el médano todas las mañanas.",
    familia: "Jorge y Susana, Valeria del Mar",
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
  const [cargando, setCargando] = useState(true);
  const [colaboracion, setColaboracion] = useState(null); // "voluntario" | "transito"

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      // allSettled: que falle el resumen no tiene por qué dejar la Home sin animales
      const [r, c] = await Promise.allSettled([
        adopcionesService.getResumen({ redirectOn401: false }),
        candidatosService.getAll(
          { adoptado: "false", orden: "antiguos", page_size: 3 },
          { redirectOn401: false },
        ),
      ]);
      if (cancelado) return;

      if (r.status === "fulfilled") setResumen(r.value);
      if (c.status === "fulfilled") setDestacados(c.value.resultados);
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

      {/* ── 5. Historias de adopción ───────────────────────────────────── */}
      <section className="mt-20" aria-labelledby="historias-titulo">
        <TituloSeccion
          kicker="Finales felices"
          titulo="Cómo les fue a los que ya se fueron"
          bajada="Historias de ejemplo, escritas para mostrar cómo se verá esta sección con testimonios reales."
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {HISTORIAS.map((h) => (
            <figure
              key={h.nombre}
              className="flex flex-col overflow-hidden rounded-card border border-bruma/60 bg-espuma shadow-suave"
            >
              <img
                src={h.foto}
                alt={h.alt}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
              <blockquote className="flex flex-1 flex-col p-6">
                <Quote className="size-6 shrink-0 text-duna" aria-hidden="true" />
                <p className="mt-3 flex-1 text-sm leading-relaxed text-niebla-oscuro">{h.testimonio}</p>
                <figcaption className="mt-5 border-t border-bruma pt-4">
                  <span className="block font-display text-base font-bold text-mar">
                    {h.nombre}, {h.cuando}
                  </span>
                  <span className="mt-0.5 block text-xs text-niebla-oscuro">{h.familia}</span>
                </figcaption>
              </blockquote>
            </figure>
          ))}
        </div>
      </section>

      {/* ── 6. Cómo ayudar + CTA final ─────────────────────────────────── */}
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
