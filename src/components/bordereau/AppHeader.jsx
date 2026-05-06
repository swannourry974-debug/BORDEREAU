import React from 'react';

const roleLabels = {
  lecteur: '✦ LECTEUR',
  voyageur: '✈ VOYAGEUR',
  relais: '🏪 RELAIS',
};

export default function AppHeader({ role, roleSwitcherOpen, onToggleRoleSwitcher }) {
  return (
    <header style={{
      background: 'var(--papier)',
      paddingTop: `calc(18px + env(safe-area-inset-top, 0px))`,
      paddingBottom: 14,
      paddingLeft: 20,
      paddingRight: 20,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(26,16,8,0.18)',
      borderBottom: '2px dashed rgba(139,105,20,0.4)',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
    }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ lineHeight: 1 }}>
          <div className="font-special" style={{ fontSize: 28, color: 'var(--encre)', letterSpacing: 6, textTransform: 'uppercase' }}>
            BORDEREAU
          </div>
          <span className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--sepia)', letterSpacing: 2, marginTop: 2, display: 'block' }}>
            Manifeste des livres voyageurs
          </span>
        </div>
        <button
          onClick={onToggleRoleSwitcher}
          className="font-special"
          style={{
            background: 'transparent',
            color: 'var(--bordeaux)',
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            padding: '6px 12px',
            border: '1px dashed var(--bordeaux)',
            cursor: 'pointer',
            position: 'relative',
            outline: 'none',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {roleLabels[role]}
        </button>
      </div>
    </header>
  );
}