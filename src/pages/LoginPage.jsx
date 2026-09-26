/**
 * LoginPage — email + password login form.
 *
 * After a successful login the user is redirected to the page they were
 * trying to reach (stored in location.state.from by ProtectedRoute),
 * or to the home page if they navigated here directly.
 */

import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Input from "../components/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target after successful login
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm bg-snowmelt rounded-2xl shadow-lg border border-rim p-8">

          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-5xl">🐾</span>
            <h1 className="text-2xl font-extrabold text-deep mt-3">Bienvenido</h1>
            <p className="text-glacial text-sm mt-1">Iniciá sesión para gestionar el refugio</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>

          {/* Link to the registration page for new visitors */}
          <p className="mt-5 text-sm text-glacial text-center">
            ¿No tenés cuenta?{" "}
            <Link to="/register" className="text-forest font-semibold hover:underline">
              Registrate
            </Link>
          </p>

        </div>
      </div>
    </Layout>
  );
}
