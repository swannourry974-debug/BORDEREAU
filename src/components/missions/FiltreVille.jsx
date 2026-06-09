import React from 'react';
import { ZONES } from '@/lib/tarifsConfig';

export default function FiltreVille({ filtre, onFiltre, missions }) {
  // Extraire les villes uniques des missions disponibles
  const villes = [...new Set(missions.map(m => m.ville))].filter(Boolean);

  const zones = Object.values(ZONES);

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Filtre par zone */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button
          onClick={() => onFiltre(null)}
          style={{
            background: !filtre ? 'var(--bordeaux)' : 'var(--papier)',
            color: !filtre ? 'var(--creme)' : 'var(--encre)',
            border: !filtre ? 'none' : '1px solid rgba(26,16,8,0.2)',
            padding: '5px 12px', cursor: 'pointer',
            fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase',
          }}
        >
          Tout
        </button>
        {zones.map(z => {
          const count = missions.filter(m => m.zone_id === z.id).length;
          if (count === 0) return null;
          return (
            <button
              key={z.id}
              onClick={() => onFiltre(z.id)}
              style={{
                background: filtre === z.id ? 'var(--bordeaux)' : 'var(--papier)',
                color: filtre === z.id ? 'var(--creme)' : 'var(--encre)',
                border: filtre === z.id ? 'none' : '1px solid rgba(26,16,8,0.2)',
                padding: '5px 12px', cursor: 'pointer',
                fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 12 }}>{z.emoji}</span>
              {z.label}
              <span style={{
                background: filtre === z.id ? 'rgba(255,255,255,0.25)' : 'rgba(26,16,8,0.1)',
                borderRadius: '50%', width: 16, height: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 700,
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filtre par ville (si plusieurs villes dans la même zone) */}
      {villes.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {villes.map(v => {
            const active = filtre === v;
            const matchCount = missions.filter(m => m.ville === v).length;
            return (
              <button
                key={v}
                onClick={() => onFiltre(active ? null : v)}
                style={{
                  background: active ? 'rgba(128,0,32,0.08)' : 'transparent',
                  color: active ? 'var(--bordeaux)' : 'rgba(26,16,8,0.5)',
                  border: `1px dashed ${active ? 'var(--bordeaux)' : 'rgba(26,16,8,0.2)'}`,
                  padding: '4px 10px', cursor: 'pointer',
                  fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11,
                }}
              >
                📍 {v} ({matchCount})
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}