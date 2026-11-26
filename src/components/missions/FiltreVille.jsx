import React from 'react';
import { ZONES } from '@/lib/tarifsConfig';

const chip = {
  minHeight: 44,
  padding: '8px 14px',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.4,
  textTransform: 'uppercase',
};

export default function FiltreVille({ filtre, onFiltre, missions }) {
  // Extraire les villes uniques des missions disponibles
  const villes = [...new Set(missions.map(m => m.ville))].filter(Boolean);
  const zones = Object.values(ZONES);

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Filtre par zone */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: villes.length > 1 ? 8 : 0 }}>
        <button
          type="button"
          onClick={() => onFiltre(null)}
          aria-pressed={!filtre}
          style={{
            ...chip,
            background: !filtre ? '#6E1E2E' : 'var(--bordero-surface)',
            color: !filtre ? '#F3E8D2' : '#6E1E2E',
            border: `1px solid ${!filtre ? '#6E1E2E' : 'var(--bordero-line)'}`,
          }}
        >
          Tout
        </button>
        {zones.map(z => {
          const count = missions.filter(m => m.zone_id === z.id).length;
          if (count === 0) return null;
          const active = filtre === z.id;
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => onFiltre(z.id)}
              aria-pressed={active}
              style={{
                ...chip,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: active ? '#6E1E2E' : 'var(--bordero-surface)',
                color: active ? '#F3E8D2' : '#6E1E2E',
                border: `1px solid ${active ? '#6E1E2E' : 'var(--bordero-line)'}`,
              }}
            >
              <span style={{ fontSize: 13 }} aria-hidden="true">{z.emoji}</span>
              {z.label}
              <span style={{
                background: active ? 'rgba(243,232,210,0.24)' : 'var(--statut-attente-soft)',
                color: active ? '#F3E8D2' : 'var(--statut-attente)',
                minWidth: 20, height: 20, padding: '0 4px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700,
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
                type="button"
                onClick={() => onFiltre(active ? null : v)}
                aria-pressed={active}
                style={{
                  minHeight: 44,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: active ? 'var(--statut-attente-soft)' : 'transparent',
                  color: active ? 'var(--statut-attente)' : 'var(--encre-douce)',
                  border: `1px dashed ${active ? 'var(--statut-attente)' : 'var(--bordero-line)'}`,
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontSize: 13,
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
