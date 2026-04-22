import React from 'react';

const roleLabels = {
  lecteur: '✦ LECTEUR',
  voyageur: '✈ VOYAGEUR',
  relais: '🏪 RELAIS',
};

export default function AppHeader({ role, roleSwitcherOpen, onToggleRoleSwitcher }) {
  return (
    <header style={{
      background: 'var(--bordeaux)',
      padding: '18px 20px 14px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 3px 12px rgba(128,0,32,0.4)',
      borderBottom: '2px solid var(--bordeaux-dark)',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ lineHeight: 1 }}>
          <div className="font-special" style={{ fontSize: 28, color: 'var(--creme)', letterSpacing: 6, textTransform: 'uppercase' }}>
            BORDEREAU
          </div>
          <span className="font-fell" style={{ fontStyle: 'italic', fontSize: 11, color: 'rgba(253,252,240,0.7)', letterSpacing: 2, marginTop: 2, display: 'block' }}>
            Manifeste des livres voyageurs
          </span>
        </div>
        <button
          onClick={onToggleRoleSwitcher}
          className="font-special"
          style={{
            background: 'var(--creme)',
            color: 'var(--bordeaux)',
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
            padding: '4px 10px',
            border: '1px solid var(--bordeaux-dark)',
            cursor: 'pointer',
            position: 'relative',
            outline: 'none',
          }}
        >
          <span style={{
            position: 'absolute',
            top: -3, right: -3, bottom: -3, left: -3,
            border: '1px dashed rgba(128,0,32,0.4)',
            pointerEvents: 'none',
          }} />
          {roleLabels[role]}
        </button>
      </div>
    </header>
  );
}