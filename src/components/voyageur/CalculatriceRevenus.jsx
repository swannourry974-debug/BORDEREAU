import React, { useState, useMemo } from 'react';
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
    <div style={{
      background: 'var(--papier)',
      border: '2px solid var(--bordeaux)',
      marginBottom: 20,
      boxShadow: '4px 4px 0 rgba(128,0,32,0.15)',
    }}>
      {/* Header */}
      <div style={{ background: 'var(--bordeaux)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>💰</span>
        <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--creme)' }}>
          Calculatrice de revenus
        </span>
      </div>

      <div style={{ padding: '16px 16px 20px' }}>

        {/* Sélecteur de zone */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 6 }}>
            Destination
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {Object.values(ZONES).map(z => (
              <button
                key={z.id}
                onClick={() => setZoneId(z.id)}
                style={{
                  background: zoneId === z.id ? 'rgba(128,0,32,0.08)' : 'var(--creme)',
                  border: zoneId === z.id ? '2px solid var(--bordeaux)' : '1.5px solid rgba(26,16,8,0.15)',
                  padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>{z.emoji}</span>
                <div>
                  <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: zoneId === z.id ? 'var(--bordeaux)' : 'var(--encre)' }}>
                    {z.label}
                  </div>
                  <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 9, color: 'rgba(26,16,8,0.4)', marginTop: 1 }}>
                    {z.express.part_voyageur.toFixed(2)} € / livre
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Liste des livres */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 6 }}>
            Livres à transporter ({livres.length} / {quotaLivres})
          </div>
          {livres.map((l, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: '1px dashed rgba(26,16,8,0.1)', paddingBottom: 8, marginBottom: 8,
            }}>
              <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, color: 'var(--bordeaux)', minWidth: 18 }}>#{i + 1}</span>
              <select
                value={l.format}
                onChange={e => updateFormat(i, e.target.value)}
                style={{
                  flex: 1, background: 'var(--creme)', border: '1px solid rgba(26,16,8,0.2)',
                  fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12,
                  padding: '5px 8px', color: 'var(--encre)',
                }}
              >
                {FORMATS.map(f => (
                  <option key={f} value={f}>{f} (~{POIDS_FORMAT[f]}g)</option>
                ))}
              </select>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, fontWeight: 700, color: 'var(--bordeaux)', minWidth: 48, textAlign: 'right' }}>
                +{getCommission(zone, i + 1).toFixed(2)} €
              </span>
              {livres.length > 1 && (
                <button onClick={() => removeLivre(i)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
                  color: 'rgba(26,16,8,0.3)', padding: '0 2px', lineHeight: 1,
                }}>✕</button>
              )}
            </div>
          ))}

          {/* Bouton ajouter */}
          {!quotaAtteint && (
            <button onClick={addLivre} style={{
              width: '100%', background: 'none',
              border: '1.5px dashed rgba(26,16,8,0.2)', padding: '8px',
              cursor: 'pointer', fontFamily: 'Special Elite, monospace',
              fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)',
            }}>
              + Ajouter un livre
            </button>
          )}
          {quotaAtteint && (
            <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'var(--bordeaux)', textAlign: 'center', padding: '6px 0' }}>
              Quota atteint pour cette zone
            </div>
          )}
        </div>

        {/* Résumé */}
        <div style={{
          background: 'var(--encre)', color: 'var(--creme)',
          padding: '14px 16px',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0,
        }}>
          {[
            { label: 'Poids total', val: `${poidsKg.toFixed(2)} kg`, sub: `max ${quotaKg} kg`, warn: poidsKg > quotaKg * 0.8 },
            { label: 'Livres', val: `${livres.length}`, sub: `max ${quotaLivres}`, warn: livres.length >= quotaLivres * 0.8 },
            { label: 'Gain estimé', val: `${gainTotal.toFixed(2)} €`, sub: `+bonus progressif`, warn: false },
          ].map(({ label, val, sub, warn }, i) => (
            <div key={label} style={{
              textAlign: 'center', padding: '0 8px',
              borderRight: i < 2 ? '1px dashed rgba(253,252,240,0.15)' : 'none',
            }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: i === 2 ? 20 : 18, fontWeight: 700, color: warn ? '#e8a838' : i === 2 ? '#a8d5a2' : 'var(--creme)' }}>
                {val}
              </div>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 7.5, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.5, marginTop: 3 }}>
                {label}
              </div>
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 9, opacity: 0.4, marginTop: 2 }}>
                {sub}
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 10, color: 'rgba(26,16,8,0.4)', marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>
          Commission de base {zone.express.part_voyageur.toFixed(2)} € · +10% de bonus par livre supplémentaire
        </div>
      </div>
    </div>
  );
}