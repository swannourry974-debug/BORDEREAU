import React from 'react';

const tabs = [
  ['missions', 'Missions'],
  ['wallet', 'Wallet / solde'],
  ['profil', 'Profil'],
];

export default function VoyageurSectionTabs({ active, onChange }) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {tabs.map(([id, label]) => (
        <button key={id} onClick={() => onChange(id)} className={`min-h-[44px] shrink-0 border px-4 font-ui text-[10px] uppercase tracking-[1.8px] ${active === id ? 'border-bordeaux bg-bordeaux text-creme' : 'border-bordeaux/20 bg-papier text-bordeaux'}`}>{label}</button>
      ))}
    </div>
  );
}