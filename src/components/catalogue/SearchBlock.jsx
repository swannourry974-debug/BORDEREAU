import React, { useState } from 'react';
import CouponButton from '@/components/shared/CouponButton';

export default function SearchBlock({ onSearch, onScanOpen }) {
  const [query, setQuery] = useState('');

  return (
    <div className="bg-papier border-[1.5px] border-encre p-[14px] px-4 relative mb-5 shadow-[3px_3px_0_#1a1008]">
      <div className="text-[13px] text-foreground/40 tracking-[0.5px] mb-2 font-typewriter">
        🔍 Chercher un titre, auteur, ISBN...
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
          placeholder="Le Petit Prince..."
          className="flex-1 bg-creme border border-foreground/30 px-3 py-2 text-[15px] text-foreground outline-none focus:border-bordeaux focus:shadow-[0_0_0_2px_rgba(128,0,32,0.1)]"
          style={{ fontFamily: 'Georgia, serif', color: '#000000' }}
        />
        <CouponButton onClick={() => onSearch(query)}>Chercher</CouponButton>
      </div>
      <button
        onClick={onScanOpen}
        style={{
          marginTop: 10, width: '100%', padding: '9px 0',
          border: '1px dashed var(--bordeaux)', background: 'transparent',
          color: 'var(--bordeaux)', fontFamily: 'Special Elite, monospace',
          fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <span>📷</span> Scanner un code-barres ISBN
      </button>
    </div>
  );
}