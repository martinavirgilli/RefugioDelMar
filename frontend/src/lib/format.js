/** Helpers de presentación compartidos entre páginas y componentes. */

/** "Menos de 1 año" / "1 año" / "4 años" */
export const formatEdad = (edad) =>
  edad === 0 ? "Menos de 1 año" : `${edad} ${edad === 1 ? "año" : "años"}`;

/** Concuerda el pronombre con el género del animal: conocerlo / conocerla. */
export const sufijoGenero = (genero) => (genero === "hembra" ? "la" : "lo");

/** Fecha larga en formato rioplatense: "12 de marzo de 2026, 15:30". */
export const formatFechaHora = (valor) =>
  new Date(valor).toLocaleDateString("es-AR", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
