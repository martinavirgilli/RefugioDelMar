/**
 * VisitasPage — el tablero de visitas del refugio. Solo admin.
 *
 * Tres bloques: lo que espera respuesta, lo que está agendado y lo que ya se
 * resolvió. El alta manual vive acá adentro: el botón despliega el formulario
 * en la misma página y la visita nueva entra en la lista sin recargar, en vez
 * de mandar a otra pantalla y volver.
 */

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, Inbox } from "lucide-react";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import NuevaVisitaForm from "../components/NuevaVisitaForm";
import SolicitudAdminCard from "../components/SolicitudAdminCard";
import VisitaCard from "../components/VisitaCard";
import { Cargando } from "../components/Skeleton";
import { solicitudesService, visitasService } from "../services/api";

function Seccion({ titulo, descripcion, cantidad, children }) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-bold text-mar">{titulo}</h2>
        {cantidad > 0 && <Badge text={String(cantidad)} variant="revision" />}
      </div>
      {descripcion && <p className="-mt-2 mb-4 text-sm text-niebla-oscuro">{descripcion}</p>}
      {children}
    </section>
  );
}

export default function VisitasPage() {
  const [visitas, setVisitas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      const [datosVisitas, datosSolicitudes] = await Promise.all([
        visitasService.getAll(),
        solicitudesService.getAll(),
      ]);
      setVisitas(Array.isArray(datosVisitas) ? datosVisitas : []);
      setSolicitudes(Array.isArray(datosSolicitudes) ? datosSolicitudes : []);
    } catch (err) {
      setError(err.message || "Error al cargar los datos");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const borrarVisita = async (id) => {
    try {
      await visitasService.delete(id);
      await cargar();
    } catch (err) {
      setError(err.message || "Error al eliminar la visita");
    }
  };

  const visitaCreada = async (visita) => {
    setFormAbierto(false);
    setAviso(`Visita agendada para ${visita.visitante_nombre}.`);
    setTimeout(() => setAviso(""), 5000);
    await cargar();
  };

  if (cargando) {
    return <Layout><Cargando texto="Cargando las visitas…" /></Layout>;
  }

  const pendientes = solicitudes.filter((s) => s.estado === "revision");
  const resueltas = solicitudes.filter((s) => s.estado !== "revision");

  return (
    <Layout>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-mar">Visitas</h1>
          <p className="mt-1 text-sm text-niebla-oscuro">
            Los pedidos que llegan por la web y las visitas que cargás a mano, en un solo lugar.
          </p>
        </div>
        {!formAbierto && (
          <Button icon={CalendarPlus} onClick={() => setFormAbierto(true)}>
            Crear visita manualmente
          </Button>
        )}
      </header>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <p aria-live="polite" className="sr-only">{aviso}</p>
      {aviso && (
        <div className="mb-6 rounded-2xl bg-pino/10 px-4 py-3 text-sm font-semibold text-pino">
          {aviso}
        </div>
      )}

      {formAbierto && (
        <div className="mb-12">
          <NuevaVisitaForm onCreada={visitaCreada} onCancelar={() => setFormAbierto(false)} />
        </div>
      )}

      <Seccion
        titulo="Esperando respuesta"
        descripcion="Gente que pidió conocer a un animal. Al aceptar, la visita se agenda sola."
        cantidad={pendientes.length}
      >
        {pendientes.length === 0 ? (
          <p className="rounded-card border border-bruma/60 bg-espuma px-5 py-6 text-sm text-niebla-oscuro">
            No hay pedidos sin responder.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pendientes.map((s) => (
              <SolicitudAdminCard key={s.id} solicitud={s} onUpdate={cargar} />
            ))}
          </div>
        )}
      </Seccion>

      <Seccion
        titulo="Visitas agendadas"
        descripcion="Las próximas, ordenadas por fecha."
        cantidad={visitas.length}
      >
        {visitas.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No hay visitas próximas"
            description="Cuando aceptes un pedido o cargues una visita a mano, va a aparecer acá."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visitas.map((v) => (
              <VisitaCard key={v.id} visita={v} onDelete={borrarVisita} onUpdate={cargar} />
            ))}
          </div>
        )}
      </Seccion>

      {resueltas.length > 0 && (
        <Seccion titulo="Pedidos ya resueltos" cantidad={resueltas.length}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resueltas.map((s) => (
              <SolicitudAdminCard key={s.id} solicitud={s} onUpdate={cargar} />
            ))}
          </div>
        </Seccion>
      )}
    </Layout>
  );
}
