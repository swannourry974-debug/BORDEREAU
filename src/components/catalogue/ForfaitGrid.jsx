import React from 'react';

const FORFAITS = [
  { id: 'poche', name: 'Poche', price: '8,90€', desc: '< 300g · roman' },
  { id: 'broche', name: 'Broché', price: '14,90€', desc: '300g–800g' },
  { id: 'bd', name: 'BD', price: '12,90€', desc: 'Bandes dessinées' },
  { id: 'beau', name: 'Beau Livre', price: '24,90€', desc: '> 800g · illustré' },
];

export default function ForfaitGrid({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-[10px] mb-4">
      {FORFAITS.map((f) => (
        <div
          key={f.id}
          onClick={() => onSelect(f)}
          className={`bg-papier border-[1.5px] p-[14px] px-3 cursor-pointer transition-all text-center relative ${
            selected === f.id
              ? 'border-bordeaux bg-bordeaux/[0.04] shadow-[3px_3px_0_#800020]'
              : 'border-foreground/25 hover:border-foreground/40'
          }`}
        >
          {selected === f.id && (
            <span className="absolute top-[6px] right-2 text-bordeaux text-[12px]">✓</span>
          )}
          <div className="text-[11px] tracking-[2px] uppercase text-foreground mb-1 font-typewriter">{f.name}</div>
          <div className="font-serif text-[22px] font-bold text-bordeaux leading-none mb-[3px]">{f.price}</div>
          <div className="text-[10px] text-foreground/50 tracking-[0.5px]">{f.desc}</div>
        </div>
      ))}
    </div>
  );
}