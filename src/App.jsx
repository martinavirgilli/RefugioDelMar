/**
 * App — root component that defines the application's routing tree.
 *
 * Route access levels:
 *   Public          — /login, /register, /
 *   ProtectedRoute  — any authenticated user (/candidatos, /adopciones, ...)
 *   ProtectedAdminRoute — admin only (/nuevo, /visitas, /nueva-visita)
 */

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
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
import NuevaVisitaPage from "./pages/NuevaVisitaPage";
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

            {/* ── Public routes ── */}
            <Route path="/"          element={<HomePage />} />
            <Route path="/login"     element={<LoginPage />} />
            <Route path="/register"  element={<RegisterPage />} />

            {/* ── Routes for any authenticated user ── */}
            <Route path="/candidatos" element={
              <ProtectedRoute><CandidatosPage /></ProtectedRoute>
            } />
            <Route path="/candidatos/:id" element={
              <ProtectedRoute><CandidatoDetailPage /></ProtectedRoute>
            } />

            {/* ── Admin-only routes ── */}
            <Route path="/nuevo" element={
              <ProtectedAdminRoute><NuevoCandidatoPage /></ProtectedAdminRoute>
            } />
            <Route path="/visitas" element={
              <ProtectedAdminRoute><VisitasPage /></ProtectedAdminRoute>
            } />
            <Route path="/nueva-visita" element={
              <ProtectedAdminRoute><NuevaVisitaPage /></ProtectedAdminRoute>
            } />

            {/* ── User's own visit requests ── */}
            <Route path="/mis-solicitudes" element={
              <ProtectedRoute><MisSolicitudesPage /></ProtectedRoute>
            } />

            {/* ── Adoptions section (authenticated users) ── */}
            <Route path="/adopciones" element={
              <ProtectedRoute><AdopcionesLayout /></ProtectedRoute>
            }>
              <Route index element={
                <ProtectedRoute><AdopcionesResumen /></ProtectedRoute>
              } />
              <Route path="historial" element={
                <ProtectedRoute><AdopcionesHistorial /></ProtectedRoute>
              } />
            </Route>

            {/* ── 404 fallback ── */}
            <Route path="*" element={
              <Layout>
                <EmptyState
                  title="404"
                  description="Esta página no existe."
                  action={
                    <Link to="/"><Button>Ir al inicio</Button></Link>
                  }
                />
              </Layout>
            } />

          </Routes>
        </Router>
    </AuthProvider>
  );
}

export default App;
