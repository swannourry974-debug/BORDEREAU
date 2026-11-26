import React, { useState } from 'react';
import CouponButton from '@/components/shared/CouponButton';
import ScanPhotoButton from '@/components/catalogue/ScanPhotoButton';

export default function SearchBlock({ onSearch, onScanOpen, onScanResult }) {
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('');

  // Auparavant, une recherche trop courte ne faisait rien du tout : aucun retour visuel.
  const submit = () => {
    if (query.trim().length < 2) {
      setFeedback('Saisissez au moins 2 caractères, un titre, un auteur ou un ISBN.');
      return;
    }
    setFeedback('');
    onSearch(query);
  };

  return (
    <div
      className="relative mb-5 p-4"
      style={{
        background: 'var(--bordero-surface-strong)',
        border: '1px solid var(--bordero-line)',
        borderRadius: 'var(--bordero-radius-md)',
        boxShadow: 'var(--bordero-shadow-paper)',
      }}
    >
      <div className="font-ui mb-2 text-[11px] uppercase tracking-[1.4px]" style={{ color: 'var(--encre-douce)' }}>
        Chercher un titre, auteur, ISBN…
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Le Petit Prince..."
          className="w-full min-w-0 flex-1 px-4 py-3 text-[16px] outline-none"
          style={{ fontFamily: "'Inter', sans-serif", color: 'var(--encre)', background: '#FFFAF0', border: '1px solid var(--bordero-line-strong)', borderRadius: 14 }}
        />
        <CouponButton onClick={submit} className="w-full sm:w-auto justify-center">Chercher</CouponButton>
      </div>
      {feedback && (
        <p role="status" className="mt-2 font-typewriter text-[11px] leading-relaxed text-bordeaux">{feedback}</p>
      )}
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