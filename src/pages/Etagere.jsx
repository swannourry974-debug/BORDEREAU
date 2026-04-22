import React from 'react';
import WelcomeCard from '@/components/shared/WelcomeCard';
import SectionTitle from '@/components/shared/SectionTitle';
import PerfoStrip from '@/components/shared/PerfoStrip';
import EtagereItem from '@/components/etagere/EtagereItem';

const EN_COURS = [
  { title: 'Le Petit Prince', detail: 'Poche · 8,90€ · Miami', status: 'enVol', statusLabel: 'EN VOL', subDetail: 'CDG → MIA · 28 avr.' },
  { title: "L'Élégance du hérisson", detail: 'Poche · 9,50€ · Miami', status: 'auRelais', statusLabel: 'AU RELAIS', subDetail: 'Café Lumière · Miami' },
  { title: 'Les Misérables', detail: 'Broché · 28,00€ · Miami', status: 'paye', statusLabel: 'PAYÉ', subDetail: 'Collecte · 3 mai' },
];

const RECUS = [
  { title: 'Astérix T.1', detail: 'BD · 11,50€ · Miami', status: 'recu', statusLabel: 'REÇU ✓', subDetail: '14 avr. 2026' },
];

export default function Etagere() {
  return (
    <div>
      <WelcomeCard
        eyebrow="Votre bibliothèque en transit"
        title="Étagère Virtuelle"
        subtitle="3 livres en cours · 1 reçu"
      />

      <SectionTitle>En cours</SectionTitle>
      {EN_COURS.map((item, i) => (
        <EtagereItem key={i} item={item} index={i} />
      ))}

      <PerfoStrip />

      <SectionTitle>Reçu</SectionTitle>
      {RECUS.map((item, i) => (
        <EtagereItem key={i} item={item} index={i} />
      ))}
    </div>
  );
}