import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function PresentationHero() {
  const login = () => base44.auth.redirectToLogin('/catalogue');

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden py-16 sm:py-20">
      {/* Full-screen background photo */}
      <img
        src="/assets/photos/img/hero-voyageur-livre.webp"
        alt="Un voyageur lit un livre debout devant la verrière d'une gare, un sac en bandoulière à l'épaule"
        className="absolute inset-0 h-full w-full object-cover object-[64%_center] sm:object-center"
        fetchPriority="high"
      />
      {/* Bordeaux gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-bordeaux/40 via-bordeaux/35 to-bordeaux/70" />

      <div className="relative z-10 mx-auto max-w-4xl px-5 text-center sm:px-6">
        <p className="font-ui text-xs font-bold uppercase tracking-[0.32em] text-creme/70">
          Livres · trajets · relais
        </p>
        <h1 className="mt-5 font-heading text-[2.5rem] font-bold leading-[1.08] text-creme sm:mt-6 sm:text-7xl lg:text-8xl">
          Les livres traversent les frontières avec les voyageurs.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl font-ui text-base leading-relaxed text-creme/80 sm:mt-6 sm:text-xl">
          Bordero relie lecteurs, voyageurs et points relais pour commander, transporter et remettre des livres avec un suivi clair à chaque étape.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:mt-10 sm:flex-row">
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
