import React from 'react';
import { Link } from 'react-router-dom';

const cards = [
  { icon: '📖', title: 'Je suis lecteur', text: 'Commandez des livres, suivez leur parcours et enrichissez votre bibliothèque.', href: '/landing-lecteur' },
  { icon: '✈️', title: 'Je suis voyageur', text: 'Transportez des livres sur vos trajets et gagnez une commission claire.', href: '/landing-voyageur' },
  { icon: '🏪', title: 'Je suis relais', text: 'Devenez point relais partenaire et sécurisez les remises locales.', href: '/landing-relais' },
];

export default function PresentationCards() {
  return (
    <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-10 sm:px-8 md:grid-cols-3">
      {cards.map(card => (
        <Link key={card.title} to={card.href} className="rounded-[22px] border border-[#800020]/20 bg-[#F5E6CC] p-5 shadow-lg shadow-[#800020]/10">
          <div className="text-3xl">{card.icon}</div>
          <h2 className="mt-4 font-heading text-2xl text-[#800020]">{card.title}</h2>
          <p className="mt-3 font-body text-lg leading-7 text-[#5A0015]/75">{card.text}</p>
          <div className="mt-5 font-ui text-xs font-bold uppercase tracking-[0.2em] text-[#C2410C]">Entrer →</div>
        </Link>
      ))}
    </section>
  );
}