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
import Logo from "../components/Logo";

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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-sm rounded-card border border-bruma bg-espuma p-8 shadow-suave">

          <div className="mb-7 text-center">
            <Logo className="mx-auto h-14 w-14 text-mar" olaClassName="text-niebla" />
            <h1 className="mt-3 text-2xl font-bold text-mar">Qué bueno verte</h1>
            <p className="mt-1 text-sm text-niebla-oscuro">
              Entrá para pedir visitas y seguir tus solicitudes
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="vos@email.com"
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <Button type="submit" loading={loading} className="mt-2 w-full">
              {loading ? "Entrando…" : "Iniciar sesión"}
            </Button>
          </form>

          {/* Link to the registration page for new visitors */}
          <p className="mt-5 text-sm text-niebla-oscuro text-center">
            ¿No tenés cuenta?{" "}
            <Link to="/register" className="font-bold text-atardecer-oscuro underline underline-offset-2">
              Registrate
            </Link>
          </p>

        </div>
      </div>
    </Layout>
  );
}
