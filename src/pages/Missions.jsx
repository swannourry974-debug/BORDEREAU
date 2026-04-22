import React from 'react';
import WelcomeCard from '@/components/shared/WelcomeCard';
import SectionTitle from '@/components/shared/SectionTitle';
import PerfoStrip from '@/components/shared/PerfoStrip';
import MissionCard from '@/components/missions/MissionCard';
import CouponButton from '@/components/shared/CouponButton';
import { toast } from 'sonner';

const MISSIONS = [
  { city: 'MIAMI, FL', date: 'Accepte jusqu\'au 26 avril · Vol Air France AF038', bookTitle: 'Le Petit Prince', bookType: 'Poche', weight: '180g', commission: '10 €', engaged: false },
  { city: 'MIAMI, FL', date: 'Accepte jusqu\'au 26 avril', bookTitle: "L'Élégance du hérisson", bookType: 'Poche', weight: '310g', commission: '10 €', engaged: false },
  { city: 'MIAMI, FL', date: 'Ticket scanné · Achat confirmé', bookTitle: 'Astérix T.1', bookType: 'BD', weight: '250g', commission: '10 €', engaged: true },
];

export default function Missions() {
  return (
    <div>
      <WelcomeCard
        eyebrow="Votre prochain vol"
        title="Paris → Miami<br>28 Avril 2026"
        subtitle="💰 Portefeuille : 40,00 € · 4 missions complètes"
      />

      <SectionTitle>Missions disponibles</SectionTitle>
      {MISSIONS.map((mission, i) => (
        <MissionCard key={i} mission={mission} index={i} />
      ))}

      <PerfoStrip />

      <SectionTitle>Déclarer un nouveau vol</SectionTitle>
      <div className="bg-papier border-[1.5px] border-dashed border-foreground/30 p-5 text-center">
        <div className="text-[32px] mb-2">✈️</div>
        <div className="text-[12px] text-foreground/50 mb-[14px] italic font-fell">
          Vous avez un autre voyage prévu ?
        </div>
        <CouponButton onClick={() => toast.info('Formulaire de déclaration de vol à venir')}>
          + Déclarer un vol
        </CouponButton>
      </div>
    </div>
  );
}