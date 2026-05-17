import React from 'react';
import { getQuotaKg, getQuotaLivres } from '@/lib/tarifsConfig';

/**
 * Jauge de quota douanier pour un voyageur
 * Affiche le poids cumulé et le nombre de livres acceptés vs quota max
 */
export default function QuotaJauge({ zone, poidsActuelG = 0, nbLivres = 0 }) {
  const quotaKg = getQuotaKg(zone);
  const quotaLivres = getQuotaLivres(zone);
  const poidsKg = poidsActuelG / 1000;

  const pct = Math.min(100, Math.round((poidsKg / quotaKg) * 100));
  const isAlert = pct >= 80;
  const isFull = pct >= 100;

  const barColor = isFull ? '#b41414' : isAlert ? '#8B6914' : '#2d6a2d';

  return (
    <div style={{
      background: 'var(--papier)',
      border: `1.5px solid ${isFull ? '#b41414' : isAlert ? '#8B6914' : 'hsl(var(--border))'}`,
      padding: '14px 16px',
      marginBottom: 16,
      boxShadow: '3px 3px 0 rgba(26,16,8,0.08)',
    }}>
      {/* Titre */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--encre)' }}>
            🧳 Quota douanier
          </div>
          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
            {zone ? `Zone ${zone.label}` : 'Zone non définie'} · max {quotaKg} kg
          </div>
        </div>
        <div style={{
          fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 1,
          color: barColor, background: `${barColor}18`,
          border: `1px solid ${barColor}44`, padding: '3px 8px',
        }}>
          {nbLivres}/{quotaLivres} livres
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ background: 'hsl(var(--border))', height: 8, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: barColor,
          transition: 'width 0.5s ease',
          position: 'relative',
        }}>
          {pct > 15 && (
            <span style={{
              position: 'absolute', right: 4, top: -1,
              fontSize: 8, color: 'white', fontFamily: 'Special Elite, monospace',
            }}>
              {pct}%
            </span>
          )}
        </div>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: barColor }}>
          {poidsKg.toFixed(2)} kg chargés
        </span>
        <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, color: 'hsl(var(--muted-foreground))', letterSpacing: 1 }}>
          MAX {quotaKg} kg
        </span>
      </div>

      {/* Alerte */}
      {isFull && (
        <div style={{
          marginTop: 10, background: 'rgba(180,20,20,0.08)',
          border: '1px dashed #b41414', padding: '8px 12px',
          fontFamily: 'IM Fell English, serif', fontStyle: 'italic',
          fontSize: 12, color: '#b41414', lineHeight: 1.5,
        }}>
          🔒 Quota atteint — Ce trajet ne peut plus accepter de nouvelles missions.
        </div>
      )}
      {isAlert && !isFull && (
        <div style={{
          marginTop: 10, background: 'rgba(139,105,20,0.08)',
          border: '1px dashed #8B6914', padding: '8px 12px',
          fontFamily: 'IM Fell English, serif', fontStyle: 'italic',
          fontSize: 12, color: '#8B6914', lineHeight: 1.5,
        }}>
          ⚠️ Presque complet — {(quotaKg - poidsKg).toFixed(2)} kg restants
        </div>
      )}
    </div>
  );
}