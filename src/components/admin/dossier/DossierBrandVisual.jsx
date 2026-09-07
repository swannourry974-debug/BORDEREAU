import React from 'react';
import BorderoLogo from '@/components/bordero/BorderoLogo';

export default function DossierBrandVisual() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border-2 border-bordeaux bg-[#fff7ed] p-6 shadow-[10px_10px_0_rgba(128,0,32,0.12)]">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full border-[18px] border-or/35" />
      <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-cta/10" />
      <div className="relative flex flex-col items-center gap-6 text-center">
        <BorderoLogo />
        <div className="grid w-full grid-cols-3 gap-3 font-ui text-[10px] font-bold uppercase tracking-[2px] text-bordeaux">
          <span className="rounded-2xl border border-bordeaux/30 bg-creme px-3 py-4">Livre</span>
          <span className="rounded-2xl border border-cta/40 bg-[#FFE0C2] px-3 py-4">Trajet</span>
          <span className="rounded-2xl border border-bordeaux/30 bg-creme px-3 py-4">Relais</span>
        </div>
      </div>
    </div>
  );
}