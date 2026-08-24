import React from 'react';
import { LIBRARY_COLORS } from './libraryUtils';

export default function LibrarySegmentedTabs({ active, onChange }) {
  const tabs = [{ id: 'bibliotheque', label: 'Bibliothèque' }, { id: 'wishlist', label: 'Wishlist' }, { id: 'favoris', label: 'Favoris' }];
  return (
    <div className="grid grid-cols-3 gap-2 my-4">
      {tabs.map(tab => (
        <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className="py-3 text-xs font-bold uppercase tracking-[1px] border" style={{ background: active === tab.id ? LIBRARY_COLORS.gold : LIBRARY_COLORS.darkWine, color: active === tab.id ? LIBRARY_COLORS.wine : LIBRARY_COLORS.cream, borderColor: 'rgba(200,161,101,0.35)' }}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}