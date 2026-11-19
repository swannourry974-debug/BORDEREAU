import React from 'react';

const tabs = [
  ['missions', 'Missions'],
  ['wallet', 'Wallet / solde'],
  ['profil', 'Profil'],
];

export default function VoyageurSectionTabs({ active, onChange }) {
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto bordero-surface p-2">
      {tabs.map(([id, label]) => (
        <button key={id} onClick={() => onChange(id)} className={`min-h-[44px] shrink-0 flex-1 border px-4 font-ui text-[10px] font-extrabold uppercase tracking-[0.16em] transition-all ${active === id ? 'border-[#6E1E2E] bg-[#6E1E2E] text-[#F3E8D2] shadow-[0_8px_18px_rgba(110,30,46,0.16)]' : 'border-[#6E1E2E]/18 bg-[#FFF8EA]/70 text-[#6E1E2E]'}`}>{label}</button>
      ))}
    </div>
  );
}