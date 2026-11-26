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

  const barColor = isFull ? 'var(--statut-alerte)' : isAlert ? 'var(--statut-attente)' : 'var(--sepia)';

  return (
    <div className="bordero-card mb-4 p-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div>
          <div className="bordero-ui" style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--encre)' }}>
            🧳 Quota douanier
          </div>
          <div className="bordero-copy" style={{ fontSize: 12, marginTop: 2 }}>
            {zone ? `Zone ${zone.label}` : 'Zone non définie'} · max {quotaKg} kg
          </div>
        </div>
        <div className="bordero-ui" style={{
          fontSize: 11, letterSpacing: 1, padding: '4px 10px',
          color: barColor, background: 'var(--bordero-surface)',
          border: `1px solid ${barColor}`,
        }}>
          {nbLivres}/{quotaLivres} livres
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ background: 'var(--statut-attente-soft)', height: 8, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.5s ease', position: 'relative' }}>
          {pct > 15 && (
            <span style={{
              position: 'absolute', right: 4, top: -2,
              fontSize: 8, color: 'var(--creme)', fontFamily: "'Inter', sans-serif", fontWeight: 700,
            }}>
              {pct}%
            </span>
          )}
        </div>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span className="bordero-copy" style={{ fontSize: 12, color: barColor }}>
          {poidsKg.toFixed(2)} kg chargés
        </span>
        <span className="bordero-ui" style={{ fontSize: 9, color: 'var(--encre-douce)', letterSpacing: 1 }}>
          MAX {quotaKg} kg
        </span>
      </div>

      {/* Alerte */}
      {isFull && (
        <div className="bordero-note" data-tone="alerte" style={{ marginTop: 10 }}>
          🔒 Quota atteint — Ce trajet ne peut plus accepter de nouvelles missions.
        </div>
      )}
      {isAlert && !isFull && (
        <div className="bordero-note" data-tone="attente" style={{ marginTop: 10 }}>
          ⚠️ Presque complet — {(quotaKg - poidsKg).toFixed(2)} kg restants
        </div>
      )}
    </div>
  );
}
