import React from 'react';

// S < 300g → 3€ voyageur | M 300–700g → 5€ | L > 700g → 10€
// Prix lecteur = commission voyageur + marge plateforme
const FORFAITS = [
  { id: 'S', name: 'S · Léger', express: '8,90€', collecte: '6,90€', desc: '< 300g · Manga, Poche', commission: 3 },
  { id: 'M', name: 'M · Standard', express: '12,90€', collecte: '9,90€', desc: '300–700g · Roman, BD', commission: 5 },
  { id: 'L', name: 'L · Lourd', express: '19,90€', collecte: '14,90€', desc: '> 700g · Manuel, Beau livre', commission: 10 },
];

export default function ForfaitGrid({ selected, onSelect, transit = 'express' }) {
  return (
    <div className="grid grid-cols-3 gap-[10px] mb-4">
      {FORFAITS.map((f) => (
        <div
          key={f.id}
          onClick={() => onSelect(f)}
          className={`bg-papier border-[1.5px] p-[12px] px-2 cursor-pointer transition-all text-center relative ${
            selected === f.id
              ? 'border-bordeaux bg-bordeaux/[0.04] shadow-[3px_3px_0_#800020]'
              : 'border-foreground/25 hover:border-foreground/40'
          }`}
        >
          {selected === f.id && (
            <span className="absolute top-[5px] right-[6px] text-bordeaux text-[11px]">✓</span>
          )}
          <div className="text-[10px] tracking-[1.5px] uppercase text-encre mb-1 font-typewriter">{f.name}</div>
          <div className="font-serif text-[20px] font-bold text-bordeaux leading-none mb-[3px]">
            {transit === 'collecte' ? f.collecte : f.express}
          </div>
          {transit === 'collecte' && (
            <div className="text-[9px] line-through text-encre/35 leading-none mb-[2px]">{f.express}</div>
          )}
          <div className="text-[9px] text-encre/70 tracking-[0.5px] leading-tight">{f.desc}</div>
          <div className="mt-[6px] text-[9px] text-encre/60 italic font-fell">
            ✈ {f.commission}€ voyageur
          </div>
        </div>
      ))}
    </div>
  );
}