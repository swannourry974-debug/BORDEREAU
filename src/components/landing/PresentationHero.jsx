import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const logoUrl = '/assets/logo-bordero.png';

export default function PresentationHero() {
  const login = () => base44.auth.redirectToLogin('/catalogue');

  return (
    <section className="relative overflow-hidden px-5 pb-12 pt-8 sm:px-8 sm:pt-14">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_20%,rgba(199,161,90,0.24),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(110,30,46,0.14),transparent_32%)]" />
      <div className="bordero-card-premium relative mx-auto max-w-6xl overflow-hidden p-6 sm:p-10 lg:p-12">
        <div className="absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'linear-gradient(rgba(110,30,46,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(110,30,46,.18) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-7 flex items-center gap-3">
              <img src={logoUrl} alt="Bordero" className="h-11 w-11 object-contain" />
              <div>
                <p className="font-ui text-xs font-extrabold uppercase tracking-[0.32em] text-bordeaux">Bordero</p>
                <p className="font-body text-base italic text-encre/60">Atlas des livres voyageurs</p>
              </div>
            </div>
            <p className="bordero-heading-section">Livres · trajets · relais</p>
            <h1 className="bordero-heading-display mt-5 max-w-3xl text-5xl sm:text-6xl lg:text-7xl">
              Les livres traversent les frontières avec les voyageurs.
            </h1>
            <p className="mt-6 max-w-2xl font-body text-2xl leading-9 text-encre/75">
              Bordero relie lecteurs, voyageurs et points relais pour commander, transporter et remettre des livres avec un suivi clair à chaque étape.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button onClick={login} className="bordero-action-primary px-6 py-3 text-xs">
                Se connecter
              </button>
              <Link to="/landing-lecteur" className="bordero-action-secondary px-6 py-3 text-xs">
                Choisir mon parcours
              </Link>
            </div>
          </div>

          <div className="relative min-h-[360px] rounded-[28px] border border-sepia/50 bg-secondary p-5 text-creme shadow-2xl">
            <div className="absolute left-8 right-8 top-1/2 h-px -rotate-6 bg-sepia/50" />
            <div className="absolute left-10 top-12 h-4 w-4 rounded-full border-2 border-sepia bg-creme" />
            <div className="absolute right-14 top-24 h-4 w-4 rounded-full border-2 border-sepia bg-creme" />
            <div className="absolute bottom-20 left-1/2 h-4 w-4 rounded-full border-2 border-sepia bg-creme" />
            <div className="relative h-full rounded-2xl border border-sepia/40 bg-[radial-gradient(circle_at_30%_20%,rgba(215,187,120,0.18),transparent_28%),rgba(15,34,55,0.34)] p-6">
              <p className="font-ui text-[11px] font-bold uppercase tracking-[0.28em] text-or">Carte de passage</p>
              <div className="mt-7 grid gap-4">
                {['Lecteur commande', 'Voyageur transporte', 'Relais remet'].map((step, index) => (
                  <div key={step} className="rounded-2xl border border-creme/15 bg-creme/10 p-4 backdrop-blur-sm">
                    <span className="font-ui text-[10px] uppercase tracking-[0.24em] text-or">Étape 0{index + 1}</span>
                    <p className="mt-2 font-heading text-2xl text-creme">{step}</p>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-5 right-5 rotate-[-10deg] rounded-full border-2 border-or/70 px-4 py-2 font-ui text-[10px] font-bold uppercase tracking-[0.22em] text-or/90">
                Carnet validé
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}