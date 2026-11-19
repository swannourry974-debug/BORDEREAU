import React from 'react';
import { Link } from 'react-router-dom';
import PresentationHero from '@/components/landing/PresentationHero';
import PresentationCards from '@/components/landing/PresentationCards';

const routeSteps = [
  ['01', 'Le lecteur choisit', 'Il commande un livre et sélectionne une destination, un mode de livraison et un relais.'],
  ['02', 'Le trajet se prépare', 'Un voyageur prend une mission compatible avec son vol et suit les conditions de transport.'],
  ['03', 'Le relais sécurise', 'Le point relais réceptionne le livre, notifie le lecteur et valide la remise finale.'],
];

export default function LandingPresentation() {
  return (
    <main className="min-h-screen bordero-shell text-encre">
      <PresentationHero />
      <PresentationCards />
      <section className="mx-auto max-w-6xl px-5 pb-14 sm:px-8">
        <div className="bordero-card-premium p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="bordero-heading-section">Comment circule un livre</p>
              <h2 className="mt-4 font-heading text-4xl text-bordeaux sm:text-5xl">Un itinéraire lisible, du catalogue au retrait.</h2>
              <p className="mt-4 font-body text-xl leading-8 text-encre/70">
                Bordero transforme chaque commande en route suivie : achat, transport, arrivée au relais et remise au lecteur restent visibles.
              </p>
            </div>
            <div className="grid gap-4">
              {routeSteps.map(([step, title, text]) => (
                <div key={step} className="bordero-surface flex gap-4 p-5">
                  <div className="font-ui text-2xl font-extrabold text-bordeaux/45">{step}</div>
                  <div>
                    <h3 className="font-ui text-sm font-extrabold uppercase tracking-[0.18em] text-bordeaux">{title}</h3>
                    <p className="mt-2 font-body text-lg leading-7 text-encre/70">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-16 text-center sm:px-8">
        <div className="rounded-[28px] border border-sepia/60 bg-secondary px-6 py-10 text-creme shadow-2xl">
          <p className="font-ui text-xs font-extrabold uppercase tracking-[0.28em] text-or">Rejoindre Bordero</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-heading text-4xl text-creme sm:text-5xl">Choisissez votre rôle et entrez dans le réseau des livres voyageurs.</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/landing-lecteur" className="bordero-action-primary px-6 py-3 text-xs">Je suis lecteur</Link>
            <Link to="/landing-voyageur" className="bordero-action-secondary border-creme/30 bg-creme/10 px-6 py-3 text-xs !text-creme">Je voyage</Link>
            <Link to="/landing-relais" className="bordero-action-secondary border-creme/30 bg-creme/10 px-6 py-3 text-xs !text-creme">Je suis relais</Link>
          </div>
        </div>
      </section>
    </main>
  );
}