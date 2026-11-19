import React from 'react';
import { Link } from 'react-router-dom';

const cards = [
  { icon: '📖', title: 'Lecteurs', text: 'Trouvez vos livres, choisissez Express ou Collecte et suivez chaque étape jusqu’au relais.', href: '/landing-lecteur' },
  { icon: '✈️', title: 'Voyageurs', text: 'Déclarez vos trajets, acceptez des missions et transportez des livres dans un cadre défini.', href: '/landing-voyageur' },
  { icon: '🏪', title: 'Points relais', text: 'Recevez, stockez et remettez les livres avec des opérations simples à valider.', href: '/landing-relais' },
];

export default function PresentationCards() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(card => (
          <Link key={card.title} to={card.href} className="bordero-surface group p-6 transition-all duration-300 hover:-translate-y-1 hover:border-bordeaux/45">
            <div className="text-4xl">{card.icon}</div>
            <h2 className="mt-5 font-heading text-3xl text-bordeaux">{card.title}</h2>
            <p className="mt-3 font-body text-xl leading-8 text-encre/70">{card.text}</p>
            <div className="mt-6 font-ui text-xs font-extrabold uppercase tracking-[0.2em] text-cta group-hover:text-cta-dark">Explorer →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}