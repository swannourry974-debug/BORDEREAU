import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const steps = [
  ['01', 'Explorez le catalogue', 'Recherchez un titre, un auteur ou un ISBN, puis ajoutez le livre à votre parcours.'],
  ['02', 'Choisissez la route', 'Sélectionnez la destination, le mode Express ou Collecte et le relais de retrait.'],
  ['03', 'Suivez le passage', 'Votre étagère indique les étapes de paiement, transport, arrivée au relais et remise.'],
];

export default function LandingLecteur() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleConnect = () => {
    if (isAuthenticated) {
      navigate('/catalogue');
      return;
    }
    base44.auth.redirectToLogin(window.location.origin + '/?role=lecteur');
  };

  return (
    <main className="min-h-screen bordero-shell px-5 py-6 text-encre sm:px-8 lg:px-10">
      <section className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap items-center justify-between gap-4 py-4">
          <Link to="/" className="font-ui text-xs font-extrabold uppercase tracking-[0.32em] text-bordeaux">Bordero</Link>
          <div className="flex gap-3 font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-bordeaux/70">
            <Link to="/landing-voyageur">Voyageur</Link>
            <Link to="/landing-relais">Relais</Link>
          </div>
        </nav>

        <div className="grid gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="bordero-card-premium p-7 sm:p-10">
            <span className="bordero-badge">📖 Espace lecteur</span>
            <h1 className="bordero-heading-display mt-6 text-5xl sm:text-6xl">Commandez vos livres comme on trace une route.</h1>
            <p className="mt-6 font-body text-2xl leading-9 text-encre/72">
              Bordero vous aide à trouver des livres, choisir un mode d’acheminement et suivre leur arrivée jusqu’au point relais.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={handleConnect} className="bordero-action-primary px-6 py-3 text-xs">Accéder au catalogue</button>
              <a href="#fonctionnement" className="bordero-action-secondary px-6 py-3 text-xs">Voir les étapes</a>
            </div>
          </div>

          <div className="rounded-[28px] border border-bordeaux/25 bg-secondary p-6 text-creme shadow-2xl">
            <p className="font-ui text-[11px] font-bold uppercase tracking-[0.28em] text-or">Modes disponibles</p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-creme/15 bg-creme/10 p-5">
                <h2 className="font-heading text-3xl text-creme">Express</h2>
                <p className="mt-2 font-body text-lg leading-7 text-creme/75">Un voyageur transporte le livre sur un trajet compatible, avec suivi dans l’application.</p>
              </div>
              <div className="rounded-2xl border border-creme/15 bg-creme/10 p-5">
                <h2 className="font-heading text-3xl text-creme">Collecte</h2>
                <p className="mt-2 font-body text-lg leading-7 text-creme/75">Les commandes sont regroupées vers un relais pour une solution adaptée aux lots de livres.</p>
              </div>
            </div>
          </div>
        </div>

        <section id="fonctionnement" className="grid gap-4 pb-10 md:grid-cols-3">
          {steps.map(([step, title, text]) => (
            <article key={step} className="bordero-surface p-6">
              <div className="font-ui text-3xl font-extrabold text-bordeaux/35">{step}</div>
              <h2 className="mt-4 font-ui text-sm font-extrabold uppercase tracking-[0.2em] text-bordeaux">{title}</h2>
              <p className="mt-3 font-body text-xl leading-8 text-encre/70">{text}</p>
            </article>
          ))}
        </section>

        <section className="bordero-card-premium mb-10 grid gap-6 p-7 sm:p-8 lg:grid-cols-3">
          {['Catalogue centralisé', 'Suivi des livres', 'Retrait en relais'].map((benefit) => (
            <div key={benefit} className="border-l border-sepia/50 pl-5">
              <h3 className="font-heading text-2xl text-bordeaux">{benefit}</h3>
              <p className="mt-2 font-body text-lg leading-7 text-encre/70">Un repère simple pour comprendre où se trouve votre livre et quelle est la prochaine action.</p>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}