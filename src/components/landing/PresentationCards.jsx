import React from 'react';
import { Link } from 'react-router-dom';

const cards = [
  {
    title: 'Lecteurs',
    text: 'Trouvez vos livres, choisissez Express ou Collecte et suivez chaque étape jusqu’au relais.',
    href: '/landing-lecteur',
    photo: '/assets/photos/img/role-lecteur.webp',
    alt: 'Une lectrice assise sur un canapé, un livre ouvert entre les mains',
  },
  {
    title: 'Voyageurs',
    text: 'Déclarez vos trajets, acceptez des missions et transportez des livres dans un cadre défini.',
    href: '/landing-voyageur',
    photo: '/assets/photos/img/role-voyageur.webp',
    alt: 'Des voyageurs avec leurs bagages traversent un hall d’aéroport',
  },
  {
    title: 'Points relais',
    text: 'Recevez, stockez et remettez les livres avec des opérations simples à valider.',
    href: '/landing-relais',
    photo: '/assets/photos/img/role-relais.webp',
    alt: 'Intérieur d’une librairie-café avec ses rayonnages, son escalier et ses plantes',
  },
];

export default function PresentationCards() {
  return (
    <section className="bg-creme px-6 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <p className="font-ui text-xs font-bold uppercase tracking-[0.32em] text-bordeaux/60">
          Rôles
        </p>
        <h2 className="mt-3 font-heading text-4xl font-bold text-bordeaux sm:text-5xl">
          Trois rôles, un même réseau.
        </h2>
        <p className="mt-3 max-w-xl font-ui text-lg text-encre/70">
          Chaque acteur voit sa part du parcours, du catalogue au retrait.
        </p>

        <div className="mt-12 space-y-6">
          {cards.map(card => (
            <Link
              key={card.title}
              to={card.href}
              className="group flex items-center gap-6 border border-bordeaux/15 bg-white p-4 transition-all duration-300 hover:border-bordeaux/40 hover:shadow-lg sm:p-6"
            >
              <div className="h-[120px] w-[120px] flex-shrink-0 overflow-hidden">
                <img
                  src={card.photo}
                  alt={card.alt}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-2xl font-bold text-bordeaux">{card.title}</h3>
                <p className="mt-2 font-ui text-base leading-relaxed text-encre/70">{card.text}</p>
              </div>
              <span className="hidden font-ui text-sm font-bold uppercase tracking-[0.16em] text-bordeaux/60 transition-colors group-hover:text-bordeaux sm:block">
                Explorer →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
