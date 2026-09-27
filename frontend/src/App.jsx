/**
 * App — root component that defines the application's routing tree.
 *
 * Route access levels:
 *   Public              — /, /candidatos, /candidatos/:id, /adopciones, /login, /register
 *   ProtectedRoute      — needs an account (/mis-solicitudes)
 *   ProtectedAdminRoute — shelter staff only (/nuevo, /visitas, /colaboraciones)
 *
 * The catalogue is public on purpose: an account is asked for only when
 * someone wants to request a visit.
 */

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Button from "./components/Button";
import EmptyState from "./components/EmptyState";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CandidatosPage from "./pages/CandidatosPage";
import CandidatoDetailPage from "./pages/CandidatoDetailPage";
import NuevoCandidatoPage from "./pages/NuevoCandidatoPage";
import VisitasPage from "./pages/VisitasPage";
import ColaboracionesPage from "./pages/ColaboracionesPage";
import AdopcionesLayout from "./pages/adopciones/AdopcionesLayout";
import AdopcionesResumen from "./pages/adopciones/AdopcionesResumen";
import AdopcionesHistorial from "./pages/adopciones/AdopcionesHistorial";
import MisSolicitudesPage from "./pages/MisSolicitudesPage";

function App() {
  return (
    // AuthProvider must wrap everything so all components can access auth state
    <AuthProvider>
      <Router>
        <Routes>

          {/* ── Public ── */}
          <Route path="/"                element={<HomePage />} />
          <Route path="/candidatos"      element={<CandidatosPage />} />
          <Route path="/candidatos/:id"  element={<CandidatoDetailPage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />

          <Route path="/adopciones" element={<AdopcionesLayout />}>
            <Route index            element={<AdopcionesResumen />} />
            <Route path="historial" element={<AdopcionesHistorial />} />
          </Route>

          {/* ── Needs an account ── */}
          <Route path="/mis-solicitudes" element={
            <ProtectedRoute><MisSolicitudesPage /></ProtectedRoute>
          } />

          {/* ── Shelter staff only ── */}
          <Route path="/nuevo" element={
            <ProtectedAdminRoute><NuevoCandidatoPage /></ProtectedAdminRoute>
          } />
          <Route path="/visitas" element={
            <ProtectedAdminRoute><VisitasPage /></ProtectedAdminRoute>
          } />
          <Route path="/colaboraciones" element={
            <ProtectedAdminRoute><ColaboracionesPage /></ProtectedAdminRoute>
          } />

          {/* ── 404 ── */}
          <Route path="*" element={
            <Layout>
              <EmptyState
                icon={Compass}
                title="Esta página se fue a la playa"
                description="El link que seguiste no lleva a ningún lado. Volvé al inicio y probá desde ahí."
                action={<Button as={Link} to="/">Ir al inicio</Button>}
              />
            </Layout>
          } />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
