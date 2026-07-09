import React from 'react';

const LEVELS = [
  { min: 0,  max: 0,  emoji: '🌱', label: 'Premier vol',      message: 'Acceptez votre première mission pour commencer l\'aventure !' },
  { min: 1,  max: 4,  emoji: '✈️', label: 'Voyageur novice',  message: 'Vous avez franchi le cap ! Continuez, les gains augmentent.' },
  { min: 5,  max: 14, emoji: '🌍', label: 'Globe-Trotteur',   message: 'Votre réputation grandit à chaque valise. Superbe travail !' },
  { min: 15, max: 29, emoji: '🎖️', label: 'Ambassadeur',      message: 'Vous êtes un pilier de la communauté Bordero. Respect !' },
  { min: 30, max: Infinity, emoji: '👑', label: 'Légende', message: 'Une légende vivante des livres voyageurs. Chapeau bas !' },
];

function getLevel(count) {
  return LEVELS.find(l => count >= l.min && count <= l.max) || LEVELS[0];
}

export default function VoyageurStatsCard({ missions }) {
  const livrees = missions.filter(m => m.statut === 'livree');
  const gainsTotal = livrees.reduce((s, m) => s + (m.commission || 0), 0);
  const enCours = missions.filter(m => m.statut === 'engagee' || m.statut === 'acceptee').length;
  const level = getLevel(livrees.length);

  // Progress vers le prochain niveau
  const nextLevel = LEVELS.find(l => l.min > livrees.length);
  const progress = nextLevel
    ? ((livrees.length - level.min) / (nextLevel.min - level.min)) * 100
    : 100;

  return (
    <div style={{
      background: 'var(--papier)',
      border: '2px solid var(--bordeaux)',
      marginBottom: 20,
      boxShadow: '4px 4px 0 rgba(128,0,32,0.18)',
      overflow: 'hidden',
    }}>
      {/* Bandeau titre */}
      <div style={{
        background: 'var(--bordeaux)',
        padding: '8px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>{level.emoji}</span>
        <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--creme)' }}>
          {level.label}
        </span>
      </div>

      {/* Stats principales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
        {[
          { val: livrees.length, label: 'Livraisons', icon: '📦', color: '#2d6a2d' },
          { val: `${gainsTotal.toFixed(2)} €`, label: 'Gains cumulés', icon: '💰', color: 'var(--bordeaux)' },
          { val: enCours, label: 'En cours', icon: '✈️', color: '#1a3a5c' },
        ].map(({ val, label, icon, color }, i) => (
          <div key={label} style={{
            textAlign: 'center', padding: '18px 8px',
            borderRight: i < 2 ? '1px dashed rgba(26,16,8,0.15)' : 'none',
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: label === 'Gains cumulés' ? 15 : 22, fontWeight: 700, color, lineHeight: 1.1 }}>
              {val}
            </div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 7.5, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', marginTop: 4 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Barre de progression */}
      <div style={{ padding: '10px 16px 14px', borderTop: '1px dashed rgba(26,16,8,0.15)' }}>
        {nextLevel ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1, color: 'rgba(26,16,8,0.4)', textTransform: 'uppercase' }}>
                Progression → {nextLevel.emoji} {LEVELS[LEVELS.indexOf(nextLevel)].label || ''}
              </span>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 10, color: 'var(--bordeaux)', fontWeight: 700 }}>
                {livrees.length} / {nextLevel.min}
              </span>
            </div>
            <div style={{ background: 'rgba(26,16,8,0.1)', height: 6, position: 'relative' }}>
              <div style={{
                height: '100%', background: 'var(--bordeaux)',
                width: `${Math.min(progress, 100)}%`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'var(--bordeaux)' }}>
            👑 Niveau maximum atteint !
          </div>
        )}

        {/* Message motivant */}
        <div style={{
          fontFamily: 'IM Fell English, serif', fontStyle: 'italic',
          fontSize: 11, color: 'rgba(26,16,8,0.5)', marginTop: 10, textAlign: 'center', lineHeight: 1.5,
        }}>
          {level.message}
        </div>
      </div>
    </div>
  );
}