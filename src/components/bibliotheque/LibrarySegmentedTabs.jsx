import React from 'react';
import { LIBRARY_COLORS } from './libraryUtils';

export default function LibrarySegmentedTabs({ active, onChange }) {
  const tabs = [
    { id: 'bibliotheque', label: 'Bibliothèque' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'favoris', label: 'Favoris' },
  ];
  return (
    <nav className="my-4 grid grid-cols-3 gap-2 rounded-[18px] border p-1" style={{ background: 'rgba(255,248,234,0.62)', borderColor: 'rgba(110,30,46,0.16)' }}>
      {tabs.map(tab => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="min-h-[44px] px-2 py-3 font-ui text-[10px] font-extrabold uppercase tracking-[0.14em] transition-all"
            style={{
              background: selected ? LIBRARY_COLORS.wine : 'transparent',
              color: selected ? LIBRARY_COLORS.cream : LIBRARY_COLORS.leather,
              boxShadow: selected ? '0 10px 22px rgba(110,30,46,0.18)' : 'none',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}