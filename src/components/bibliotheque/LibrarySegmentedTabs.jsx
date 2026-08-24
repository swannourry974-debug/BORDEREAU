import React from 'react';
import { LIBRARY_COLORS } from './libraryUtils';

export default function LibrarySegmentedTabs({ active, onChange }) {
  const tabs = [{ id: 'bibliotheque', label: 'Bibliothèque' }, { id: 'wishlist', label: 'Wishlist' }, { id: 'favoris', label: 'Favoris' }];
  return (
    <div className="grid grid-cols-3 gap-2 my-4">
      {tabs.map(tab => (
        <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className="py-3 text-xs font-bold uppercase tracking-[1px] border" style={{ background: active === tab.id ? LIBRARY_COLORS.wine : 'var(--papier)', color: active === tab.id ? LIBRARY_COLORS.cream : LIBRARY_COLORS.wine, borderColor: 'rgba(75,30,30,0.25)' }}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}