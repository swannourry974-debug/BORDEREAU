import React from 'react';

export default function CatalogueSearchIntro() {
  return (
    <div
      className="relative mb-5 p-5"
      style={{
        background: 'var(--bordero-surface-strong)',
        border: '1px solid var(--bordero-line)',
        borderRadius: 'var(--bordero-radius-lg)',
        boxShadow: 'var(--bordero-shadow-paper)',
      }}
    >
      <div className="font-ui mb-2 text-[10px] font-bold uppercase tracking-[2px]" style={{ color: 'var(--bordeaux)' }}>
        Découverte lecteur
      </div>
      <div className="font-heading mb-2 text-[24px] font-bold leading-tight" style={{ color: 'var(--bordeaux)' }}>
        Commencez par le livre qui vous manque.
      </div>
      <div className="font-body text-[16px] leading-7" style={{ color: 'var(--encre-douce)' }}>
        Recherchez un titre ou scannez un ISBN. La destination, le mode de livraison et le point relais se choisissent ensuite pour ce livre précis.
      </div>
    </div>
  );
}
