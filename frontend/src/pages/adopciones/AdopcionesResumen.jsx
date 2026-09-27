/**
 * AdopcionesResumen — el impacto del refugio, contado con ganas.
 *
 * Reemplaza los tres cuadritos de la v1. La idea es que alguien que entra acá
 * termine con ganas de adoptar, no informado: por eso arranca con el número
 * grande, después muestra el detalle por especie y el ritmo de los últimos
 * meses, y cierra con las caras de los que se fueron y un CTA.
 *
 * El gráfico es SVG a mano en vez de una librería: son doce barras, y sumar
 * Recharts para esto costaría más de lo que resuelve.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Cat, Dog, Heart, PawPrint, Quote, Rabbit } from "lucide-react";
import Button from "../../components/Button";
import { Cargando } from "../../components/Skeleton";
import { adopcionesService, candidatosService } from "../../services/api";
import { formatEtapa } from "../../lib/format";

const ICONO_ESPECIE = { perro: Dog, gato: Cat, conejo: Rabbit };

/** Barras de adopciones por mes. Doce barras no justifican una librería. */
function GraficoMeses({ meses }) {
  const maximo = Math.max(1, ...meses.map((m) => m.cantidad));
  const total = meses.reduce((suma, m) => suma + m.cantidad, 0);

  return (
    <figure className="rounded-card border border-bruma/60 bg-espuma p-6 shadow-suave">
      <figcaption className="font-display text-lg font-bold text-mar">
        Cómo viene el año
      </figcaption>
      <p className="mt-1 text-sm text-niebla-oscuro">
        {total === 0
          ? "Todavía no registramos adopciones en los últimos doce meses."
          : `${total} ${total === 1 ? "adopción" : "adopciones"} en los últimos doce meses.`}
      </p>

      <div className="mt-6 flex h-40 items-end justify-between gap-1.5" role="img"
           aria-label={`Adopciones por mes: ${meses.map((m) => `${m.etiqueta}, ${m.cantidad}`).join("; ")}`}>
        {meses.map((mes) => (
          <div key={mes.etiqueta} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs font-bold text-mar">{mes.cantidad || ""}</span>
            <div
              className={`w-full rounded-t-lg transition-all ${mes.cantidad ? "bg-mar/80" : "bg-bruma/50"}`}
              style={{ height: `${Math.max(3, (mes.cantidad / maximo) * 88)}%` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-between gap-1.5" aria-hidden="true">
        {meses.map((mes) => (
          <span key={mes.etiqueta} className="flex-1 text-center text-[10px] text-niebla-oscuro">
            {mes.etiqueta.split(" ")[0]}
          </span>
        ))}
      </div>
    </figure>
  );
}

export default function AdopcionesResumen() {
  const [resumen, setResumen] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        setCargando(true);
        setError("");
        const [datosResumen, datosHistorial, datosResenas] = await Promise.all([
          adopcionesService.getResumen({ redirectOn401: false }),
          adopcionesService.getHistorial({ redirectOn401: false }),
          // Si fallan las reseñas la página sigue teniendo sentido: es el único
          // pedido de los tres que puede quedar vacío sin romper nada.
          candidatosService.getResenasPublicas(6, { redirectOn401: false }).catch(() => []),
        ]);
        if (cancelado) return;
        setResumen(datosResumen);
        setHistorial(datosHistorial);
        setResenas(datosResenas);
      } catch (err) {
        if (!cancelado) setError(err.message || "Error al cargar el resumen");
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargar();
    return () => { cancelado = true; };
  }, []);

  if (cargando) return <Cargando texto="Contando finales felices…" />;

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  const { adoptados, disponibles, total, por_especie: porEspecie = [], por_mes: porMes = [] } = resumen;
  const porcentaje = total > 0 ? Math.round((adoptados / total) * 100) : 0;
  const ultimos = historial.slice(0, 6);

  return (
    <div className="space-y-8">

      {/* ── El número que importa ── */}
      <section className="overflow-hidden rounded-blob bg-mar px-6 py-12 text-center text-white shadow-elevada">
        <Heart className="mx-auto size-8 text-bruma" aria-hidden="true" />
        <p className="mt-4 font-display text-6xl font-bold leading-none sm:text-7xl">{adoptados}</p>
        <p className="mt-3 text-lg text-bruma">
          {adoptados === 1 ? "animal encontró su casa" : "animales encontraron su casa"}
        </p>

        {/* Cuánto del refugio ya se fue a casa */}
        <div className="mx-auto mt-8 max-w-md">
          <div
            className="h-3 overflow-hidden rounded-full bg-white/20"
            role="img"
            aria-label={`${porcentaje} por ciento de los animales que pasaron por el refugio ya fueron adoptados`}
          >
            <div className="h-full rounded-full bg-bruma transition-all" style={{ width: `${porcentaje}%` }} />
          </div>
          <p className="mt-3 text-sm text-bruma">
            {porcentaje}% de los {total} animales que pasaron por acá.{" "}
            {disponibles > 0 && (
              <span className="font-bold text-white">
                Faltan {disponibles}.
              </span>
            )}
          </p>
        </div>
      </section>

      {/* ── Por especie y por mes ── */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-bruma/60 bg-espuma p-6 shadow-suave">
          <h2 className="font-display text-lg font-bold text-mar">Quiénes se fueron</h2>
          {porEspecie.length === 0 ? (
            <p className="mt-3 text-sm text-niebla-oscuro">Todavía no hay adopciones registradas.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {porEspecie.map(({ especie, adoptados: cantidad }) => {
                const Icono = ICONO_ESPECIE[especie] ?? PawPrint;
                const proporcion = adoptados > 0 ? (cantidad / adoptados) * 100 : 0;
                return (
                  <li key={especie}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-semibold capitalize text-mar">
                        <Icono className="size-4 text-niebla" aria-hidden="true" />
                        {especie}
                      </span>
                      <span className="text-sm font-bold text-mar">{cantidad}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-bruma/40">
                      <div className="h-full rounded-full bg-pino" style={{ width: `${proporcion}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <GraficoMeses meses={porMes} />
      </div>

      {/* ── Las caras ── */}
      {ultimos.length > 0 && (
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-mar">Los últimos en irse</h2>
              <p className="mt-1 text-sm text-niebla-oscuro">
                Cada uno de estos entró al refugio sin nada y salió con una familia.
              </p>
            </div>
            <Button as={Link} to="/adopciones/historial" variant="ghost" size="sm" icon={ArrowRight}>
              Ver el historial
            </Button>
          </div>

          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {ultimos.map((c) => (
              <li key={c.id} className="overflow-hidden rounded-card border border-bruma/60 bg-espuma shadow-suave">
                {c.imagen ? (
                  <img
                    src={c.imagen}
                    alt={`${c.nombre}, ${c.especie.toLowerCase()} adoptado`}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="grid aspect-square place-items-center bg-bruma/30">
                    <PawPrint className="size-8 text-niebla/40" aria-hidden="true" />
                  </div>
                )}
                <div className="p-3">
                  <p className="truncate text-sm font-bold text-mar">{c.nombre}</p>
                  <p className="mt-0.5 text-xs text-niebla-oscuro">{formatEtapa(c.etapa)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Lo que cuentan las familias ── */}
      {resenas.length > 0 && (
        <section aria-labelledby="resenas-titulo">
          <div className="mb-5">
            <h2 id="resenas-titulo" className="font-display text-lg font-bold text-mar">
              Lo que cuentan las familias
            </h2>
            <p className="mt-1 text-sm text-niebla-oscuro">
              Les escribimos unos meses después para saber cómo van las cosas.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {resenas.map((r) => (
              <li key={r.id}>
                <figure className="flex h-full gap-4 rounded-card border border-bruma/60 bg-espuma p-5 shadow-suave">
                  {(r.src || r.candidato_imagen) && (
                    <img
                      src={r.src || r.candidato_imagen}
                      alt={`${r.candidato_nombre} en su casa nueva`}
                      loading="lazy"
                      decoding="async"
                      className="size-24 shrink-0 rounded-2xl object-cover"
                    />
                  )}
                  <blockquote className="flex min-w-0 flex-col">
                    <Quote className="size-5 shrink-0 text-duna" aria-hidden="true" />
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-niebla-oscuro">
                      {r.texto}
                    </p>
                    <figcaption className="mt-3 text-xs">
                      <span className="font-bold text-mar">{r.candidato_nombre}</span>
                      <span className="text-niebla-oscuro"> · {r.autor}</span>
                    </figcaption>
                  </blockquote>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Y ahora vos ── */}
      <section className="rounded-card border border-bruma/60 bg-espuma p-8 text-center shadow-suave">
        <h2 className="font-display text-2xl font-bold text-mar">
          {disponibles > 0
            ? `Quedan ${disponibles} esperando`
            : "Hoy no queda nadie esperando"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-niebla-oscuro">
          {disponibles > 0
            ? "El próximo número de arriba puede ser el tuyo. No hace falta decidir nada hoy: alcanza con venir a conocerlos."
            : "Todos los animales del refugio están en una casa. Volvé pronto: siempre aparece alguien nuevo."}
        </p>
        <Button as={Link} to="/candidatos" variant="acento" size="lg" icon={PawPrint} className="mt-6">
          Conocé a los candidatos
        </Button>
      </section>
    </div>
  );
}
