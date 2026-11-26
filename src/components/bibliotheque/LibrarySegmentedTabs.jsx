import React from 'react';

export default function LibrarySegmentedTabs({ active, onChange }) {
  const tabs = [{ id: 'bibliotheque', label: 'Bibliothèque' }, { id: 'wishlist', label: 'Wishlist' }, { id: 'favoris', label: 'Favoris' }];
  return (
    <div className="my-4 grid grid-cols-3 gap-2">
      {tabs.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={isActive}
            className="bordero-ui py-3 text-xs font-bold uppercase tracking-[1px] border transition-colors"
            style={{
              borderRadius: 'var(--bordero-radius-md)',
              background: isActive ? '#6E1E2E' : 'var(--bordero-surface)',
              borderColor: isActive ? '#6E1E2E' : 'var(--bordero-line-strong)',
              color: isActive ? '#F3E8D2' : '#6E1E2E',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
