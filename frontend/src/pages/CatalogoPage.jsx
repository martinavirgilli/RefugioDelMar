/**
 * CatalogoPage — decide qué catálogo mostrar en /candidatos.
 *
 * Son dos pantallas distintas con el mismo dato atrás: la grilla pública, que
 * está hecha para que alguien se enamore de un animal, y el panel del refugio,
 * que está hecho para administrar fichas.
 *
 * La bifurcación vive en este componente y no dentro de la página pública para
 * que, siendo admin, esa página no se monte ni haga sus consultas al aire.
 */

import { useAuth } from "../context/AuthContext";
import CandidatosPage from "./CandidatosPage";
import PanelCandidatos from "../components/PanelCandidatos";

export default function CatalogoPage() {
  const { isAdmin } = useAuth();

  return isAdmin() ? <PanelCandidatos /> : <CandidatosPage />;
}
