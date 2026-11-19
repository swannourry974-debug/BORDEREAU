import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const missionSteps = [
  ['Déclarer un trajet', 'Vous indiquez votre ville de départ, votre destination et la date de voyage.'],
  ['Accepter une mission', 'Vous choisissez les livres compatibles avec votre trajet, dans la limite prévue par l’application.'],
  ['Valider le transport', 'Vous scannez, conservez les justificatifs et déposez les livres au relais partenaire.'],
];

export default function LandingVoyageur() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleConnect = () => {
    if (isAuthenticated) {
      navigate('/accueil-voyageur');
      return;
    }
    base44.auth.redirectToLogin(window.location.origin + '/?role=voyageur');
  };

  return (
    <main className="min-h-screen bordero-shell px-5 py-6 text-encre sm:px-8 lg:px-10">
      <section className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap items-center justify-between gap-4 py-4">
          <Link to="/" className="font-ui text-xs font-extrabold uppercase tracking-[0.32em] text-bordeaux">Bordero</Link>
          <div className="flex gap-3 font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-bordeaux/70">
            <Link to="/landing-lecteur">Lecteur</Link>
            <Link to="/landing-relais">Relais</Link>
          </div>
        </nav>

        <div className="grid gap-8 py-8 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
          <div className="rounded-[28px] border border-bordeaux/25 bg-secondary p-6 text-creme shadow-2xl">
            <p className="font-ui text-[11px] font-bold uppercase tracking-[0.28em] text-or">Carnet de mission</p>
            <div className="mt-6 grid gap-4">
              {[
                ['1er livre', '5,00 €'],
                ['2e livre', '6,50 €'],
                ['À partir du 3e', '8,00 €'],
              ].map(([rang, montant]) => (
                <div key={rang} className="flex items-center justify-between rounded-2xl border border-creme/15 bg-creme/10 p-5">
                  <span className="font-body text-xl italic text-creme/80">{rang}</span>
                  <span className="font-heading text-3xl text-or">{montant}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-center font-body text-lg italic text-creme/65">Jusqu’à 10 livres par trajet · Virement dès 20 €</p>
          </div>

          <div className="bordero-card-premium p-7 sm:p-10">
            <span className="bordero-badge">✈ Espace voyageur</span>
            <h1 className="bordero-heading-display mt-6 text-5xl sm:text-6xl">Rentabilisez vos trajets avec des livres en mission.</h1>
            <p className="mt-6 font-body text-2xl leading-9 text-encre/72">
              Bordero vous propose des missions sur vos routes réelles. Vous transportez des livres, respectez les conditions de validation et recevez une rémunération selon le barème existant.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={handleConnect} className="bordero-action-primary px-6 py-3 text-xs">Devenir voyageur</button>
              <a href="#missions" className="bordero-action-secondary px-6 py-3 text-xs">Voir le parcours</a>
            </div>
          </div>
        </div>

        <section id="missions" className="grid gap-4 pb-10 md:grid-cols-3">
          {missionSteps.map(([title, text], index) => (
            <article key={title} className="bordero-surface p-6">
              <div className="font-ui text-3xl font-extrabold text-bordeaux/35">0{index + 1}</div>
              <h2 className="mt-4 font-ui text-sm font-extrabold uppercase tracking-[0.2em] text-bordeaux">{title}</h2>
              <p className="mt-3 font-body text-xl leading-8 text-encre/70">{text}</p>
            </article>
          ))}
        </section>

        <section className="bordero-card-premium mb-10 p-7 sm:p-8">
          <p className="bordero-heading-section">Conditions de transport</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {['Trajet déclaré', 'Livre scanné', 'Dépôt relais validé'].map((condition) => (
              <div key={condition} className="rounded-2xl border border-bordeaux/15 bg-creme/40 p-5">
                <h3 className="font-heading text-2xl text-bordeaux">{condition}</h3>
                <p className="mt-2 font-body text-lg leading-7 text-encre/70">Chaque mission reste attachée à une preuve ou une validation pour protéger le lecteur, le voyageur et le relais.</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}