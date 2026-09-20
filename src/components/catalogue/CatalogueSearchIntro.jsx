import React from 'react';

export default function CatalogueSearchIntro() {
  return (
    <div className="bg-bordeaux text-creme p-4 mb-5 relative overflow-hidden shadow-[3px_3px_0_rgba(26,16,8,0.18)]">
      <div className="font-typewriter text-[9px] tracking-[3px] uppercase opacity-70 mb-2">Découverte lecteur</div>
      <div className="font-serif text-[22px] font-bold leading-tight mb-2">Commencez par le livre qui vous manque.</div>
      <div className="font-fell italic text-[13px] opacity-80 leading-relaxed">
        Recherchez un titre ou scannez un ISBN. La destination, le mode de livraison et le point relais se choisissent ensuite pour ce livre précis.
      </div>
    </div>
  );
}