import React, { useState } from 'react';
import { ZONES, POIDS_FORMAT } from '@/lib/tarifsConfig';

const FORMATS = ['Poche', 'Broché', 'BD', 'Relié'];

function getCommission(zone, rang) {
  const base = zone?.express?.part_voyageur ?? 10.00;
  return Math.round(base * (1 + (rang - 1) * 0.1) * 100) / 100;
}

export default function CalculatriceRevenus() {
  const [zoneId, setZoneId] = useState('international');
  const [livres, setLivres] = useState([{ format: 'Poche' }]);

  const zone = Object.values(ZONES).find(z => z.id === zoneId) || ZONES.INTERNATIONAL;
  const quotaKg = zone.quota_kg;
  const quotaLivres = zone.quota_livres;

  const poidsTotal = livres.reduce((s, l) => s + (POIDS_FORMAT[l.format] || 200), 0);
  const poidsKg = poidsTotal / 1000;
  const gainTotal = livres.reduce((s, _, i) => s + getCommission(zone, i + 1), 0);
  const quotaAtteint = livres.length >= quotaLivres || poidsKg >= quotaKg;

  const addLivre = () => {
    if (quotaAtteint) return;
    setLivres(prev => [...prev, { format: 'Poche' }]);
  };

  const removeLivre = (i) => setLivres(prev => prev.filter((_, idx) => idx !== i));

  const updateFormat = (i, format) => {
    setLivres(prev => prev.map((l, idx) => idx === i ? { ...l, format } : l));
  };

  return (
    <div className="bordero-card mb-5 overflow-hidden">
      {/* En-tête */}
      <div style={{ background: '#6E1E2E', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }} aria-hidden="true">💰</span>
        <span className="bordero-ui" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#F3E8D2' }}>
          Calculatrice de revenus
        </span>
      </div>

      <div style={{ padding: '16px 16px 20px' }}>

        {/* Sélecteur de zone */}
        <div style={{ marginBottom: 14 }}>
          <div className="bordero-ui" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--encre-douce)', marginBottom: 6 }}>
            Destination
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {Object.values(ZONES).map(z => {
              const active = zoneId === z.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZoneId(z.id)}
                  aria-pressed={active}
                  style={{
                    background: active ? '#6E1E2E' : 'var(--bordero-surface)',
                    border: `1px solid ${active ? '#6E1E2E' : 'var(--bordero-line)'}`,
                    padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                    minHeight: 44,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span style={{ fontSize: 14 }} aria-hidden="true">{z.emoji}</span>
                  <div>
                    <div className="bordero-ui" style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: active ? '#F3E8D2' : 'var(--encre)' }}>
                      {z.label}
                    </div>
                    <div className="bordero-copy" style={{ fontSize: 10, color: active ? 'rgba(243,232,210,0.78)' : 'var(--encre-douce)', marginTop: 1 }}>
                      {z.express.part_voyageur.toFixed(2)} € / livre
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste des livres */}
        <div style={{ marginBottom: 12 }}>
          <div className="bordero-ui" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--encre-douce)', marginBottom: 6 }}>
            Livres à transporter ({livres.length} / {quotaLivres})
          </div>
          {livres.map((l, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: '1px dashed var(--bordero-line)', paddingBottom: 8, marginBottom: 8,
            }}>
              <span className="bordero-ui" style={{ fontSize: 9, color: 'var(--bordeaux)', minWidth: 18 }}>#{i + 1}</span>
              <select
                value={l.format}
                onChange={e => updateFormat(i, e.target.value)}
                style={{
                  flex: 1, background: 'var(--bordero-surface)', border: '1px solid var(--bordero-line)',
                  fontFamily: "'Cormorant Garamond', serif", fontSize: 13,
                  padding: '8px 8px', color: 'var(--encre)', minHeight: 44,
                }}
              >
                {FORMATS.map(f => (
                  <option key={f} value={f}>{f} (~{POIDS_FORMAT[f]}g)</option>
                ))}
              </select>
              <span className="bordero-title" style={{ fontSize: 13, color: 'var(--bordeaux)', minWidth: 48, textAlign: 'right' }}>
                +{getCommission(zone, i + 1).toFixed(2)} €
              </span>
              {livres.length > 1 && (
                <button
                  type="button"
                  aria-label={`Retirer le livre ${i + 1}`}
                  onClick={() => removeLivre(i)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
                    color: 'var(--encre-douce)', padding: 0, lineHeight: 1,
                    minWidth: 44, minHeight: 44,
                  }}
                >✕</button>
              )}
            </div>
          ))}

          {/* Bouton ajouter */}
          {!quotaAtteint && (
            <button
              type="button"
              onClick={addLivre}
              style={{
                width: '100%', background: 'none',
                border: '1px dashed var(--bordero-line-strong)', padding: '10px',
                cursor: 'pointer', minHeight: 44,
                fontFamily: "'Inter', sans-serif", fontWeight: 700,
                fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--encre-douce)',
              }}
            >
              + Ajouter un livre
            </button>
          )}
          {quotaAtteint && (
            <div className="bordero-copy" style={{ fontSize: 12, color: 'var(--bordeaux)', textAlign: 'center', padding: '6px 0' }}>
              Quota atteint pour cette zone
            </div>
          )}
        </div>

        {/* Résumé */}
        <div style={{
          background: 'var(--encre)', color: 'var(--creme)',
          padding: '14px 16px',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0,
          borderRadius: 'var(--bordero-radius-sm)',
        }}>
          {[
            { label: 'Poids total', val: `${poidsKg.toFixed(2)} kg`, sub: `max ${quotaKg} kg`, warn: poidsKg > quotaKg * 0.8 },
            { label: 'Livres', val: `${livres.length}`, sub: `max ${quotaLivres}`, warn: livres.length >= quotaLivres * 0.8 },
            { label: 'Gain estimé', val: `${gainTotal.toFixed(2)} €`, sub: '+bonus progressif', warn: false },
          ].map(({ label, val, sub, warn }, i) => (
            <div key={label} style={{
              textAlign: 'center', padding: '0 8px',
              borderRight: i < 2 ? '1px dashed rgba(253,252,240,0.15)' : 'none',
            }}>
              <div className="bordero-title" style={{ fontSize: i === 2 ? 20 : 18, color: warn ? 'var(--sepia)' : i === 2 ? 'var(--or-clair)' : 'var(--creme)' }}>
                {val}
              </div>
              <div className="bordero-ui" style={{ fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.55, marginTop: 3 }}>
                {label}
              </div>
              <div className="bordero-copy" style={{ fontSize: 10, opacity: 0.45, marginTop: 2 }}>
                {sub}
              </div>
            </div>
          ))}
        </div>

        <div className="bordero-copy" style={{ fontSize: 11, marginTop: 10, textAlign: 'center' }}>
          Commission de base {zone.express.part_voyageur.toFixed(2)} € · +10% de bonus par livre supplém
entaire
        </div>
      </div>
    </div>
  );
}
