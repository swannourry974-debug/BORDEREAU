import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function PresentationHero() {
  const login = () => base44.auth.redirectToLogin('/catalogue');

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Full-screen background photo */}
      <img
        src="/assets/photos/img/m138226685-2400.webp"
        alt="Un voyageur avec un livre dans un aéroport"
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      {/* Bordeaux gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-bordeaux/70 via-bordeaux/50 to-bordeaux/80" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <p className="font-ui text-xs font-bold uppercase tracking-[0.32em] text-creme/70">
          Livres · trajets · relais
        </p>
        <h1 className="mt-6 font-heading text-6xl font-bold leading-[1.05] text-creme sm:text-7xl lg:text-8xl">
          Les livres traversent les frontières avec les voyageurs.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl font-ui text-lg leading-relaxed text-creme/80 sm:text-xl">
          Bordero relie lecteurs, voyageurs et points relais pour commander, transporter et remettre des livres avec un suivi clair à chaque étape.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={login}
            className="min-h-[48px] border border-creme/40 bg-creme px-8 py-3 font-ui text-sm font-bold uppercase tracking-[0.16em] text-bordeaux transition-all duration-300 hover:bg-creme/90"
          >
            Se connecter
          </button>
          <Link
            to="/landing-lecteur"
            className="min-h-[48px] border border-creme/40 px-8 py-3 font-ui text-sm font-bold uppercase tracking-[0.16em] text-creme transition-all duration-300 hover:bg-creme/10"
          >
            Choisir mon parcours
          </Link>
        </div>
      </div>
    </section>
  );
}
