import React from 'react';
import CouponButton from '@/components/shared/CouponButton';

const MODES = [
  { id: 'express', title: 'Express voyageur', desc: 'Le plus rapide, remis par un voyageur.' },
  { id: 'collecte', title: 'Collectif malle', desc: 'Plus économique, groupé par destination.' },
];

export default function CatalogueWelcomeStep({ deliveryMode, onSelectMode, onNext }) {
  return (
    <div className="bg-papier border-[1.5px] border-encre p-5 shadow-[3px_3px_0_rgba(26,16,8,0.18)]">
      <div className="font-typewriter text-[9px] tracking-[3px] uppercase text-bordeaux mb-3">Bonjour lecteur</div>
      <h1 className="font-serif text-[26px] leading-tight font-bold text-encre mb-5">
        Bonjour lecteur, quel livre vous manque t'il ce soir ?
      </h1>
      <div className="space-y-3 mb-5">
        {MODES.map(mode => {
          const active = deliveryMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`w-full text-left border-[1.5px] p-4 transition-all ${active ? 'border-bordeaux bg-bordeaux/5' : 'border-encre/20 bg-creme'}`}
            >
              <div className="font-typewriter text-[12px] tracking-[1.5px] uppercase text-encre">{active ? '✓ ' : ''}{mode.title}</div>
              <div className="font-fell italic text-[12px] text-foreground/55 mt-1">{mode.desc}</div>
            </button>
          );
        })}
      </div>
      <CouponButton onClick={onNext} className="w-full py-4">Continuer vers la destination</CouponButton>
    </div>
  );
}