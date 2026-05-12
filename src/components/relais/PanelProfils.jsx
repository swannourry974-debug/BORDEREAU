import React from 'react';
import ProfilsTableau from './ProfilsTableau';

export default function PanelProfils() {
  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'var(--bordeaux)', color: 'var(--creme)',
        padding: '18px 20px', marginBottom: 24, position: 'relative', overflow: 'hidden'
      }}>
        <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 60, opacity: 0.1 }}>📊</span>
        <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6, fontFamily: 'Special Elite, monospace' }}>
          Point Relais · Statistiques
        </div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
          Profils lecteurs
        </div>
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          Suivi des commandes par période
        </div>
      </div>

      <ProfilsTableau />
    </div>
  );
}