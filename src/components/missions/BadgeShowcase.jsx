import React, { useState } from 'react';
import { BADGES_CONFIG, RARETE_STYLES } from '@/lib/badges';

// Stats simulées — à connecter à la vraie BDD plus tard
const STATS_DEMO = {
  livresLivres: 12,
  livraisonsRapides: 4,
  livraisonsUltraRapides: 1,
  maxLivresParVoyage: 10,
  missionsAcceptees: 7,
  paysVisites: 2,
};

function BadgeItem({ badge, unlocked }) {
  const style = RARETE_STYLES[badge.rarete];
  return (
    <div style={{
      background: unlocked ? style.bg : 'rgba(26,16,8,0.03)',
      border: unlocked ? style.border : '1px dashed rgba(26,16,8,0.12)',
      padding: '14px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, position: 'relative', transition: 'all 0.2s',
      boxShadow: unlocked ? style.glow : 'none',
      opacity: unlocked ? 1 : 0.45,
      filter: unlocked ? 'none' : 'grayscale(1)',
    }}>
      {/* Emoji badge */}
      <div style={{ fontSize: 30, lineHeight: 1 }}>
        {unlocked ? badge.emoji : '🔒'}
      </div>

      {/* Nom */}
      <div style={{
        fontFamily: 'Special Elite, monospace',
        fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase',
        color: unlocked ? 'var(--encre)' : 'hsl(var(--muted-foreground))',
        textAlign: 'center', lineHeight: 1.3,
      }}>
        {badge.nom}
      </div>

      {/* Rareté */}
      {unlocked && (
        <div style={{
          fontFamily: 'Special Elite, monospace', fontSize: 8,
          letterSpacing: 2, textTransform: 'uppercase',
          color: style.labelColor, opacity: 0.8,
        }}>
          {style.label}
        </div>
      )}

      {/* Stamp débloqué */}
      {unlocked && badge.rarete === 'legendaire' && (
        <div style={{
          position: 'absolute', top: 4, right: 4,
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--bordeaux)',
          boxShadow: '0 0 4px rgba(128,0,32,0.6)',
        }} />
      )}
    </div>
  );
}

export default function BadgeShowcase({ stats = STATS_DEMO }) {
  const [detail, setDetail] = useState(null);

  const debloques = BADGES_CONFIG.filter(b => b.condition(stats)).map(b => b.id);
  const total = BADGES_CONFIG.length;
  const obtenus = debloques.length;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Header */}
      <div style={{
        background: 'var(--encre)', color: 'var(--creme)',
        padding: '14px 16px', marginBottom: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.6, marginBottom: 4 }}>
            Vos distinctions
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700 }}>
            Palmarès Voyageur
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#d4b896' }}>
            {obtenus}<span style={{ fontSize: 13, opacity: 0.6 }}>/{total}</span>
          </div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.5 }}>
            Badges
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ height: 3, background: 'hsl(var(--border))', marginBottom: 14, position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${(obtenus / total) * 100}%`,
          background: 'var(--bordeaux)', transition: 'width 0.6s ease',
        }} />
      </div>

      {/* Grille des badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {BADGES_CONFIG.map(badge => (
          <div
            key={badge.id}
            onClick={() => setDetail(detail?.id === badge.id ? null : badge)}
            style={{ cursor: 'pointer' }}
          >
            <BadgeItem badge={badge} unlocked={debloques.includes(badge.id)} />
          </div>
        ))}
      </div>

      {/* Détail badge au clic */}
      {detail && (
        <div style={{
          marginTop: 12, background: 'var(--papier)',
          border: `1.5px solid ${RARETE_STYLES[detail.rarete].border.split(' ').pop()}`,
          padding: '14px 16px',
          boxShadow: RARETE_STYLES[detail.rarete].glow,
          animation: 'fadeSlideIn 0.25s ease',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 36 }}>{debloques.includes(detail.id) ? detail.emoji : '🔒'}</div>
            <div>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--encre)', marginBottom: 4 }}>
                {detail.nom}
                <span style={{ marginLeft: 8, fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, color: RARETE_STYLES[detail.rarete].labelColor }}>
                  · {RARETE_STYLES[detail.rarete].label}
                </span>
              </div>
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                {detail.description}
              </div>
              {!debloques.includes(detail.id) && (
                <div style={{ marginTop: 6, fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>
                  🔒 Non débloqué
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}