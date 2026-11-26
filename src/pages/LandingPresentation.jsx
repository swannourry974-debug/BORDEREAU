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
    <main className="min-h-screen bg-creme text-encre">
      <PresentationHero />
      <PresentationCards />

      {/* Timeline itinerary */}
      <section className="bg-creme px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <p className="font-ui text-xs font-bold uppercase tracking-[0.32em] text-bordeaux/60">
            Parcours
          </p>
          <h2 className="mt-3 font-heading text-4xl font-bold text-bordeaux sm:text-5xl">
            Un itinéraire lisible, du catalogue au retrait.
          </h2>
          <p className="mt-3 max-w-xl font-ui text-lg text-encre/70">
            Bordero transforme chaque commande en route suivie.
          </p>

          <div className="relative mt-12 pl-8">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-bordeaux/20" />

            <div className="space-y-12">
              {routeSteps.map(([step, title, text]) => (
                <div key={step} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-8 top-1 flex h-6 w-6 items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-bordeaux" />
                  </div>
                  <div>
                    <span className="font-ui text-xs font-bold uppercase tracking-[0.24em] text-bordeaux/50">
                      Étape {step}
                    </span>
                    <h3 className="mt-1 font-heading text-2xl font-bold text-bordeaux">{title}</h3>
                    <p className="mt-2 max-w-lg font-ui text-base leading-relaxed text-encre/70">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Single CTA */}
      <section className="border-t border-bordeaux/15 bg-creme px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-heading text-4xl font-bold text-bordeaux sm:text-5xl">
            Entrez dans le réseau des livres voyageurs.
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-ui text-lg text-encre/70">
            Rejoignez Bordero comme lecteur, voyageur ou point relais.
          </p>
          <div className="mt-10">
            <Link
              to="/landing-lecteur"
              className="inline-block min-h-[48px] bg-bordeaux px-10 py-3 font-ui text-sm font-bold uppercase tracking-[0.16em] text-creme transition-all duration-300 hover:bg-bordeaux-dark"
            >
              Commencer
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
