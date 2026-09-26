/**
 * HomePage — la puerta de entrada del refugio.
 *
 * Seis secciones: hero, impacto, candidatos destacados, cómo adoptar,
 * historias y cómo ayudar.
 *
 * Sobre los datos: el catálogo y el resumen todavía exigen sesión (se abren al
 * público en la Fase 2). Mientras tanto, si hay sesión la Home muestra los
 * números y los animales reales; si no, muestra contenido de ejemplo y lo dice,
 * para no hacer pasar datos inventados por reales.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CalendarHeart, Gift, Handshake, Heart, HeartHandshake,
  Home, PawPrint, Quote, Search, Sparkles,
} from "lucide-react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Card from "../components/Card";
import Skeleton, { SkeletonCard } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { adopcionesService, candidatosService } from "../services/api";

import portada640 from "../assets/images/portada-640.webp";
import portada1024 from "../assets/images/portada-1024.webp";
import portada1600 from "../assets/images/portada-1600.webp";
import fotoMalena from "../assets/images/candidato5.jpg";
import fotoTuco from "../assets/images/candidato7.jpg";
import fotoBruno from "../assets/images/candidato3.jpg";
import fotoLola from "../assets/images/candidato4.jpg";
import fotoRocco from "../assets/images/candidato1.jpg";
import fotoNina from "../assets/images/candidato2.jpg";

// ── Contenido ficticio de ejemplo ─────────────────────────────────────────

const RESUMEN_EJEMPLO = { adoptados: 128, disponibles: 14, total: 142 };

const DESTACADOS_EJEMPLO = [
  {
    id: "ejemplo-lola", nombre: "Lola", especie: "perro", genero: "hembra", edad: 2,
    imagen: fotoLola, adoptado: false,
    descripcion: "Llegó flaquita y desconfiada, y hoy saluda a todo el mundo parada en la reja. Le encanta correr en la arena.",
  },
  {
    id: "ejemplo-rocco", nombre: "Rocco", especie: "perro", genero: "macho", edad: 6,
    imagen: fotoRocco, adoptado: false,
    descripcion: "Grandote y tranquilo. Camina al lado tuyo sin tirar de la correa y se duerme apenas encuentra una sombra.",
  },
  {
    id: "ejemplo-nina", nombre: "Nina", especie: "perro", genero: "hembra", edad: 3,
    imagen: fotoNina, adoptado: false,
    descripcion: "Curiosa y sociable. Se lleva bien con otros perros y con chicos; busca una casa con patio para seguir explorando.",
  },
];

const PASOS = [
  { icon: Search, titulo: "Conocelos", texto: "Mirá el catálogo y leé la historia de cada animal. Fijate con cuál te pasa algo." },
  { icon: CalendarHeart, titulo: "Pedí una visita", texto: "Contanos por qué querés conocerlo y cómo es tu casa. Es un formulario corto." },
  { icon: Handshake, titulo: "Vení a encontrarlo", texto: "Coordinamos día y hora en el refugio. Sin apuro: la idea es que se conozcan de verdad." },
  { icon: Home, titulo: "Llevalo a casa", texto: "Si los dos están cómodos, se va con vos castrado, vacunado y con seguimiento nuestro." },
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
  const { isAuthenticated } = useAuth();
  const conSesion = isAuthenticated();

  const [resumen, setResumen] = useState(null);
  const [destacados, setDestacados] = useState([]);
  const [cargando, setCargando] = useState(conSesion);

  // Los datos reales solo existen con sesión. Sin sesión ni siquiera pedimos:
  // ahorramos un 401 y mostramos el contenido de ejemplo directamente.
  useEffect(() => {
    if (!conSesion) return;
    let cancelado = false;

    const cargar = async () => {
      const [r, c] = await Promise.allSettled([
        adopcionesService.getResumen({ redirectOn401: false }),
        candidatosService.getAll({ redirectOn401: false }),
      ]);
      if (cancelado) return;

      if (r.status === "fulfilled") setResumen(r.value);
      if (c.status === "fulfilled" && Array.isArray(c.value)) {
        setDestacados(c.value.filter((x) => !x.adoptado).slice(0, 3));
      }
      setCargando(false);
    };

    cargar();
    return () => { cancelado = true; };
  }, [conSesion]);

  // Si la API falló o no hay sesión, el ejemplo salva la página sin mentir.
  const datos = resumen ?? RESUMEN_EJEMPLO;
  const tarjetas = destacados.length > 0 ? destacados : DESTACADOS_EJEMPLO;
  const sonEjemplo = resumen === null;
  const tarjetasEjemplo = destacados.length === 0;

  return (
    <Layout>

      {/* ── 1. Hero ────────────────────────────────────────────────────── */}
      <section className="animate-surgir">
        <div className="relative overflow-hidden rounded-blob shadow-elevada">
          <img
            src={portada1024}
            srcSet={`${portada640} 640w, ${portada1024} 1024w, ${portada1600} 1600w`}
            sizes="(min-width: 1152px) 1152px, 100vw"
            width={1600}
            height={533}
            fetchPriority="high"
            decoding="async"
            alt="Patio del Refugio del Mar en un día de sol, con perros sueltos sobre el pasto y un cartel de madera que dice “Un hogar para cada patita”"
            className="aspect-[4/3] w-full object-cover object-center sm:aspect-[16/9] lg:aspect-[5/2]"
          />
          {/* Degradado para que el texto blanco se lea sobre cualquier zona de la foto */}
          <div className="absolute inset-0 bg-gradient-to-t from-mar/90 via-mar/45 to-mar/5" aria-hidden="true" />

          <div className="absolute inset-0 flex flex-col justify-end gap-4 p-6 sm:p-10 lg:p-14">
            <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
              Acá cada animal espera lo mismo: que alguien lo elija.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-bruma sm:text-base">
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
                size="lg"
                className="bg-white/95 text-mar hover:bg-white"
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

          {sonEjemplo && !cargando && (
            <p className="mt-8 text-center text-xs text-niebla-oscuro">
              Números de ejemplo.{" "}
              <Link to="/login" className="font-bold text-atardecer-oscuro underline underline-offset-2">
                Iniciá sesión
              </Link>{" "}
              para ver los datos reales del refugio.
            </p>
          )}
        </div>
      </section>

      {/* ── 3. Candidatos destacados ───────────────────────────────────── */}
      <section className="mt-20" aria-labelledby="destacados-titulo" aria-busy={cargando}>
        <TituloSeccion
          kicker="Buscan casa"
          titulo="Conocé a algunos de ellos"
          bajada="Cada uno llegó de una manera distinta. Todos están castrados, vacunados y listos para irse."
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cargando
            ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
            : tarjetas.map((c) =>
                tarjetasEjemplo ? (
                  // Las de ejemplo no linkean a un detalle que no existe
                  <article
                    key={c.id}
                    className="flex flex-col overflow-hidden rounded-card border border-bruma/60 bg-espuma shadow-suave"
                  >
                    <img
                      src={c.imagen}
                      alt={`${c.nombre}, ${c.especie} en adopción`}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <h3 className="text-lg font-bold text-mar">{c.nombre}</h3>
                      <p className="text-xs text-niebla-oscuro">
                        {c.edad} años · <span className="capitalize">{c.genero}</span>
                      </p>
                      <p className="flex-1 text-sm leading-relaxed text-niebla-oscuro">{c.descripcion}</p>
                    </div>
                  </article>
                ) : (
                  <Card key={c.id} candidato={c} variant="destacado" />
                )
              )}
        </div>

        <div className="mt-10 text-center">
          {tarjetasEjemplo && !cargando && (
            <p className="mb-4 text-xs text-niebla-oscuro">
              Animales de ejemplo. El catálogo completo pide iniciar sesión.
            </p>
          )}
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
          {[
            { icon: HeartHandshake, titulo: "Hacete voluntario", texto: "Paseos, baños, fotos para las fichas o una mano los sábados a la mañana. Toda ayuda suma." },
            { icon: Gift, titulo: "Doná lo que puedas", texto: "Alimento, mantas, antiparasitarios o un aporte mensual para los gastos del veterinario." },
            { icon: Sparkles, titulo: "Sé hogar de tránsito", texto: "Un lugar temporal mientras un animal se recupera hace toda la diferencia en cómo llega a su adopción." },
          ].map((item) => (
            <div key={item.titulo} className="rounded-card border border-bruma/60 bg-espuma p-6 shadow-suave">
              <span className="grid size-12 place-items-center rounded-full bg-bruma/50">
                <item.icon className="size-6 text-mar" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-mar">{item.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-niebla-oscuro">{item.texto}</p>
            </div>
          ))}
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
              size="lg"
              className="bg-white/95 text-mar hover:bg-white"
            >
              Quiero ser voluntario
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
