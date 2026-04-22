import React from 'react';

export default function JaugeValise({ livresActifs, totalCommission }) {
  const MAX = 10;
  const pct = (livresActifs / MAX) * 100;
  const isMax = livresActifs >= MAX;
  const isNearMax = livresActifs >= 8;

  const couleur = isMax
    ? '#800020'
    : isNearMax
    ? '#8B6914'
    : '#2d6a2d';

  return (
    <div style={{
      background: 'var(--papier)',
      border: '1.5px solid var(--encre)',
      padding: '16px 18px',
      marginBottom: 20,
      boxShadow: '3px 3px 0 rgba(26,16,8,0.1)',
    }}>
      {/* Header jauge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 2 }}>
            Capacité valise
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: isMax ? '#800020' : 'var(--encre)' }}>
            {livresActifs} <span style={{ fontSize: 14, color: 'rgba(26,16,8,0.4)' }}>/ {MAX} livres</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 2 }}>
            Commission totale
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#2d6a2d' }}>
            {totalCommission.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{
        height: 12,
        background: 'var(--papier-fonce)',
        border: '1px solid rgba(26,16,8,0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`,
          background: couleur,
          transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        }} />
        {/* Graduations */}
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i + 1) * 10}%`,
            top: 0, bottom: 0, width: 1,
            background: 'rgba(26,16,8,0.15)',
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
            transition: 'all 0.3s',
          }}>
            📚
          </span>
        ))}
      </div>

      {/* Message contextuel */}
      {isMax && (
        <div style={{
          marginTop: 10,
          background: 'rgba(128,0,32,0.08)',
          border: '1px dashed #800020',
          padding: '8px 12px',
          fontFamily: 'IM Fell English, serif',
          fontStyle: 'italic',
          fontSize: 12,
          color: '#800020',
          lineHeight: 1.5,
        }}>
          🔒 Limite de sécurité atteinte (10 livres max) pour garantir un passage serein en douane.
        </div>
      )}
      {livresActifs === 1 && (
        <div style={{
          marginTop: 10,
          background: 'rgba(139,105,20,0.08)',
          border: '1px dashed #8B6914',
          padding: '8px 12px',
          fontFamily: 'IM Fell English, serif',
          fontStyle: 'italic',
          fontSize: 12,
          color: '#8B6914',
          lineHeight: 1.5,
        }}>
          💡 Ajoutez un 2ème livre pour gagner +6,50 € au lieu de 5 € !
        </div>
      )}
    </div>
  );
}