/** Helpers de presentación compartidos entre páginas y componentes. */

/**
 * Etapa de vida estimada. Reemplaza la edad en años: casi todos llegan de la
 * calle y nadie sabe cuándo nacieron, así que un número daba una precisión
 * que el refugio no tiene.
 */
export const ETAPAS = [
  { valor: "cachorro", etiqueta: "Cachorro", detalle: "Todavía está creciendo" },
  { valor: "joven", etiqueta: "Joven", detalle: "Adulto joven, con mucha energía" },
  { valor: "adulto", etiqueta: "Adulto", detalle: "Ya está hecho, tranquilo" },
];

const ETIQUETAS_ETAPA = Object.fromEntries(ETAPAS.map((e) => [e.valor, e.etiqueta]));

/** "Cachorro" / "Joven" / "Adulto", o un guion si no está cargada. */
export const formatEtapa = (etapa) => ETIQUETAS_ETAPA[etapa] ?? "—";

/** Concuerda el pronombre con el género del animal: conocerlo / conocerla. */
export const sufijoGenero = (genero) => (genero === "hembra" ? "la" : "lo");

/** Fecha larga en formato rioplatense: "12 de marzo de 2026, 15:30". */
export const formatFechaHora = (valor) =>
  new Date(valor).toLocaleDateString("es-AR", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

/**
 * Fecha sola: "12 de marzo de 2026".
 *
 * Las fechas sin hora ("2026-03-12") las interpreta el navegador como UTC y,
 * en Argentina, eso las corría un día para atrás. Por eso se parte a mano.
 */
export const formatFecha = (valor) => {
  if (!valor) return "";
  const [anio, mes, dia] = String(valor).slice(0, 10).split("-").map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-AR", {
    year: "numeric", month: "long", day: "numeric",
  });
};
