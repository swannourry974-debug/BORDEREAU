import React from 'react';

export default function BorderoLogo({ compact = false }) {
  return (
    <div
      className="inline-flex items-center gap-3 rounded-[16px] border px-4 py-3 shadow-[0_16px_34px_rgba(46,17,17,0.22)]"
      style={{
        background: 'linear-gradient(145deg, rgba(243,232,210,0.98), rgba(247,238,220,0.92))',
        color: 'var(--bordeaux)',
        borderColor: 'rgba(199,161,90,0.78)',
        boxShadow: '0 16px 34px rgba(46,17,17,0.22), inset 0 0 0 1px rgba(255,255,255,0.36)',
      }}
    >
      <span className="text-xl" style={{ color: 'var(--sepia)' }}>✦</span>
      <div className="relative px-3 py-1">
        <span
          className="absolute inset-0 rounded-[10px] pointer-events-none"
          style={{ border: '1px dashed rgba(110,30,46,0.36)' }}
        />
        <div className="bordero-ui text-[9px] font-bold uppercase tracking-[3px]" style={{ color: 'var(--bois-fonce)' }}>France</div>
        <div className="bordero-title text-2xl leading-none tracking-[1px]" style={{ textShadow: '0 1px 0 rgba(199,161,90,0.35)' }}>BORDERO</div>
        {!compact && <div className="bordero-ui text-[8px] font-semibold uppercase tracking-[1px]" style={{ color: 'rgba(30,26,24,0.66)' }}>Manifeste des livres voyageurs</div>}
      </div>
      <span className="text-xl" style={{ color: 'var(--sepia)' }}>✦</span>
    </div>
  );
}