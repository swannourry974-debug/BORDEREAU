import React from 'react';

export default function BorderoLogo({ compact = false }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-[10px] border px-4 py-3 shadow-[0_10px_24px_rgba(46,17,17,0.22)]" style={{ background: 'var(--creme)', color: 'var(--bordeaux)', borderColor: 'var(--sepia)' }}>
      <span className="text-2xl">✦</span>
      <div>
        <div className="bordero-ui text-[9px] font-bold uppercase tracking-[3px]">France</div>
        <div className="bordero-title text-2xl leading-none tracking-[1px]">BORDERO</div>
        {!compact && <div className="bordero-ui text-[8px] font-semibold uppercase tracking-[1px]">Manifeste des livres voyageurs</div>}
      </div>
      <span className="text-2xl">✦</span>
    </div>
  );
}