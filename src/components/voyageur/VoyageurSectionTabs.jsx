import React from 'react';

const tabs = [
  ['missions', 'Missions'],
  ['wallet', 'Wallet / solde'],
  ['profil', 'Profil'],
];

export default function VoyageurSectionTabs({ active, onChange }) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {tabs.map(([id, label]) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            className="bordero-ui min-h-[44px] shrink-0 border px-4 text-[10px] uppercase tracking-[1.8px]"
            style={{
              background: isActive ? '#6E1E2E' : 'var(--bordero-surface)',
              borderColor: isActive ? '#6E1E2E' : 'var(--bordero-line)',
              color: isActive ? '#F3E8D2' : '#6E1E2E',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
