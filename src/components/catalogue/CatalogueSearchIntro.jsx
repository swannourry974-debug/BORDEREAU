import React from 'react';
import CouponButton from '@/components/shared/CouponButton';

export default function CatalogueSearchIntro({ deliveryMode, selectedCity, selectedRelay, onChangeMode, onChangeDestination }) {
  return (
    <div className="bg-bordeaux text-creme p-4 mb-5 relative overflow-hidden">
      <div className="font-typewriter text-[9px] tracking-[3px] uppercase opacity-70 mb-2">Catalogue prêt</div>
      <div className="font-serif text-[20px] font-bold leading-tight mb-2">Recherchez votre livre ou scannez son ISBN.</div>
      <div className="font-fell italic text-[12px] opacity-80 leading-relaxed">
        {deliveryMode === 'express' ? 'Express' : 'Collectif malle'} · {selectedCity?.emoji} {selectedCity?.label} · {selectedRelay?.name}
      </div>
      <div className="flex gap-2 mt-4">
        <CouponButton secondary onClick={onChangeMode} className="flex-1 bg-creme/95">Mode</CouponButton>
        <CouponButton secondary onClick={onChangeDestination} className="flex-1 bg-creme/95">Destination</CouponButton>
      </div>
    </div>
  );
}