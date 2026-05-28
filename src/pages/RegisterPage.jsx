/**
 * RegisterPage — self-service account creation form.
 *
 * Anyone can create an account here. New users receive regular (non-admin)
 * permissions, giving them read access to candidates and adoptions but no
 * ability to manage shelter data.
 *
 * On success the user is immediately logged in and redirected to home.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Input from "../components/Input";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side check before hitting the API
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const result = await register(email, password, name);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Error al crear la cuenta");
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
            <h1 className="text-2xl font-extrabold text-deep mt-3">Crear cuenta</h1>
            <p className="text-glacial text-sm mt-1">Registrate para explorar el refugio</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-1">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-2">
                {error}
              </div>
            )}

            <Input
              label="Nombre"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />

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
              placeholder="Mínimo 6 caracteres"
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repetí tu contraseña"
            />

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? "Creando cuenta..." : "Registrarse"}
            </Button>
          </form>

          {/* Link back to login for returning users */}
          <p className="mt-5 text-sm text-glacial text-center">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="text-forest font-semibold hover:underline">
              Iniciá sesión
            </Link>
          </p>

        </div>
      </div>
    </Layout>
  );
}
