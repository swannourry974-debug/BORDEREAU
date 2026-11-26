import React from 'react';

const MAX = 10;

export default function JaugeValise({ livresActifs, totalCommission }) {
  const pct = Math.min(100, (livresActifs / MAX) * 100);
  const isMax = livresActifs >= MAX;
  const isNearMax = livresActifs >= 8;

  const couleur = isMax ? 'var(--bordeaux)' : isNearMax ? 'var(--statut-attente)' : 'var(--sepia)';

  return (
    <div className="bordero-card mb-5 p-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginBottom: 10 }}>
        <div>
          <div className="bordero-ui" style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--encre-douce)', marginBottom: 2 }}>
            Capacité valise
          </div>
          <div className="bordero-title" style={{ fontSize: 22, color: isMax ? 'var(--bordeaux)' : 'var(--encre)' }}>
            {livresActifs} <span style={{ fontSize: 14, color: 'var(--encre-douce)' }}>/ {MAX} livres</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="bordero-ui" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--encre-douce)', marginBottom: 2 }}>
            Commission totale
          </div>
          <div className="bordero-title" style={{ fontSize: 20, color: 'var(--bordeaux)' }}>
            {totalCommission.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{
        height: 12,
        background: 'var(--statut-attente-soft)',
        border: '1px solid var(--bordero-line)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`,
          background: couleur,
          transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        }} />
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i + 1) * 10}%`,
            top: 0, bottom: 0, width: 1,
            background: 'var(--bordero-line)',
          }} />
        ))}
      </div>

      {/* Emojis livres */}
      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
        {Array.from({ length: MAX }, (_, i) => (
          <span key={i} style={{
            fontSize: 14,
            filter: i < livresActifs ? 'none' : 'grayscale(1)',
            opacity: i < livresActifs ? 1 : 0.3,
          }}>
            📚
          </span>
        ))}
      </div>

      {/* Message contextuel */}
      {isMax && (
        <div className="bordero-note" data-tone="attente" style={{ marginTop: 10 }}>
          🔒 Limite de sécurité atteinte (10 livres max) pour garantir un passage serein en douane.
        </div>
      )}
      {livresActifs === 1 && (
        <div className="bordero-note" data-tone="attente" style={{ marginTop: 10 }}>
          💡 Ajoutez un 2ème livre pour gagner +6,50 € au lieu de 5 € !
        </div>
      )}
    </div>
  );
}
