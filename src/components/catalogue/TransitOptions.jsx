import React from 'react';

const OPTIONS = [
  {
    id: 'express',
    icon: '✈️',
    name: 'Express · Individuel',
    detail: 'Prochain vol disponible · 5–10 jours',
    badge: 'Plein tarif',
    badgeClass: 'border-sepia text-sepia',
  },
  {
    id: 'collecte',
    icon: '📦',
    name: 'Collecte · Carton 20kg',
    detail: 'Rempli à 63% · 5 livres manquants',
    badge: 'Jusqu\'à −5€',
    badgeClass: 'border-bordeaux text-bordeaux',
  },
];

export default function TransitOptions({ selected, onSelect }) {
  return (
    <div className="flex flex-col gap-[10px] mb-5">
      {OPTIONS.map((opt) => (
        <div
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className={`bg-papier p-[14px] px-4 cursor-pointer transition-all flex items-center gap-[14px] ${
            selected === opt.id
              ? 'border-[1.5px] border-solid border-bordeaux bg-bordeaux/[0.03]'
              : 'border-[1.5px] border-dashed border-foreground/30 hover:border-foreground/50'
          }`}
        >
          <span className="text-[28px]">{opt.icon}</span>
          <div className="flex-1">
            <div className="text-[13px] tracking-[1px] uppercase font-typewriter mb-[3px]">{opt.name}</div>
            <div className="text-[11px] text-encre italic font-fell">{opt.detail}</div>
          </div>
          <span className={`text-[9px] tracking-[1px] uppercase px-2 py-[3px] border border-dashed ${opt.badgeClass}`}>
            {opt.badge}
          </span>
        </div>
      ))}
    </div>
  );
}