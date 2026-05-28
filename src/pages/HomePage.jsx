/**
 * HomePage — public landing page of the shelter.
 *
 * Visible to everyone (authenticated or not).
 * The call-to-action button changes based on authentication status:
 *   - Authenticated: links directly to /candidatos
 *   - Unauthenticated: prompts the user to log in first
 */

import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import portada from "../assets/images/portada.jpg";
import { useAuth } from "../context/AuthContext";

/** A card displaying one of the shelter's mission pillars. */
function MissionCard({ icon, title, description }) {
  return (
    <div className="bg-snowmelt rounded-2xl p-6 text-center shadow-sm border border-rim flex flex-col items-center gap-3">
      <span className="text-4xl">{icon}</span>
      <h3 className="font-bold text-deep text-lg">{title}</h3>
      <p className="text-glacial text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      {/* ── Hero image with gradient overlay ── */}
      <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden mb-12 shadow-lg">
        <img
          src={portada}
          alt="Refugio del Mar"
          className="w-full h-full object-cover object-center"
        />
        {/* Dark gradient so the white text is legible over the photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-deep/80 via-deep/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-md leading-tight">
            Welcome to Refugio del Mar
          </h1>
          <p className="text-rim mt-2 text-sm sm:text-base max-w-md drop-shadow">
            Where every animal waits for a home
          </p>
        </div>
      </div>

      {/* ── Mission section ── */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-deep text-center mb-6">What we do</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <MissionCard
            icon="🤝"
            title="Rescue"
            description="We take in animals in vulnerable situations and provide them a safe space to recover."
          />
          <MissionCard
            icon="❤️"
            title="Care"
            description="Our team handles the health, nutrition, and well-being of every animal at the shelter."
          />
          <MissionCard
            icon="🏠"
            title="Adopt"
            description="We connect each animal with a family that has been waiting for them. Every adoption is a love story."
          />
        </div>
      </section>

      {/* ── Call-to-action ── */}
      <section className="bg-snowmelt rounded-2xl border border-rim shadow-sm p-8 text-center">
        <h2 className="text-xl font-bold text-deep mb-2">Want to meet our candidates?</h2>
        <p className="text-glacial text-sm mb-6">Discover the animals looking for a loving home.</p>
        {isAuthenticated() ? (
          <Link
            to="/candidatos"
            className="inline-flex items-center gap-2 bg-forest hover:bg-forest-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-sm"
          >
            🐾 View candidates
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-forest hover:bg-forest-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-sm"
          >
            Log in to view candidates
          </Link>
        )}
      </section>
    </Layout>
  );
}
