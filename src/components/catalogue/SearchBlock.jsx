import React, { useState } from 'react';
import CouponButton from '@/components/shared/CouponButton';
import ScanPhotoButton from '@/components/catalogue/ScanPhotoButton';

export default function SearchBlock({ onSearch, onScanOpen, onScanResult }) {
  const [query, setQuery] = useState('');

  return (
    <div className="bg-papier border-[1.5px] border-encre p-3 sm:p-[14px] sm:px-4 relative mb-5 shadow-[3px_3px_0_#1a1008]">
      <div className="text-[12px] sm:text-[13px] text-foreground/40 tracking-[0.5px] mb-2 font-typewriter leading-snug">
        🔍 Chercher un titre, auteur, ISBN...
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
          placeholder="Le Petit Prince..."
          className="w-full min-w-0 flex-1 bg-creme border border-foreground/30 px-3 py-3 sm:py-2 text-[16px] sm:text-[15px] text-foreground outline-none focus:border-bordeaux focus:shadow-[0_0_0_2px_rgba(128,0,32,0.1)]"
          style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--encre)' }}
        />
        <CouponButton onClick={() => onSearch(query)} className="w-full sm:w-auto justify-center">Chercher</CouponButton>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          onClick={onScanOpen}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-bordeaux/50 bg-transparent px-3 py-2 font-ui text-[10px] uppercase tracking-[1.8px] text-bordeaux transition hover:border-cta hover:text-cta"
        >
          <span>📷</span> Scanner caméra
        </button>
        <ScanPhotoButton onResult={onScanResult} />
      </div>
    </div>
  );
}