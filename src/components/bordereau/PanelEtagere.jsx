import React from 'react';
import { WelcomeCard, SectionTitle, PerfoStrip, EtagereItem } from './shared';

export default function PanelEtagere() {
  return (
    <div>
      <WelcomeCard
        eyebrow="Votre bibliothèque en transit"
        title="Étagère Virtuelle"
        sub="3 livres en cours · 1 reçu"
      />

      <SectionTitle>En cours</SectionTitle>

      <EtagereItem
        statusClass="enVol"
        dotClass="enVol"
        title="Le Petit Prince"
        sub="Poche · 8,90€ · Miami"
        stampColor="#1a3a5c"
        stampLabel="EN VOL"
        stampSub="CDG → MIA · 28 avr."
      />
      <EtagereItem
        statusClass="auRelais"
        dotClass="auRelais"
        title="L'Élégance du hérisson"
        sub="Poche · 9,50€ · Miami"
        stampColor="#8B6914"
        stampLabel="AU RELAIS"
        stampSub="Café Lumière · Miami"
      />
      <EtagereItem
        statusClass="default"
        dotClass="paye"
        title="Les Misérables"
        sub="Broché · 28,00€ · Miami"
        stampColor="var(--bordeaux)"
        stampLabel="PAYÉ"
        stampSub="Collecte · 3 mai"
      />

      <PerfoStrip />

      <SectionTitle>Reçu</SectionTitle>

      <EtagereItem
        statusClass="recu"
        dotClass="recu"
        title="Astérix T.1"
        sub="BD · 11,50€ · Miami"
        stampColor="#2d6a2d"
        stampLabel="REÇU ✓"
        stampSub="14 avr. 2026"
      />
    </div>
  );
}