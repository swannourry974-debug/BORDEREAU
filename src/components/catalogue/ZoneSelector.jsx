import React from 'react';
import { ZONES } from '@/lib/tarifsConfig';

/**
 * Sélecteur de zone géographique avec affichage des tarifs Express / Collectif
 */
export default function ZoneSelector({ selected, onSelect, mode = 'express' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Object.values(ZONES).map(zone => {
        const isSelected = selected === zone.id;
        const prix = mode === 'express' ? zone.express.prix_client : zone.collectif.cout_moyen_livre;
        return (
          <button
            key={zone.id}
            onClick={() => onSelect(zone)}
            style={{
              background: isSelected ? 'rgba(128,0,32,0.07)' : 'var(--papier)',
              border: isSelected ? '2px solid var(--bordeaux)' : '1.5px solid hsl(var(--border))',
              padding: '12px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{zone.emoji}</span>
                <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: isSelected ? 'var(--bordeaux)' : 'var(--encre)' }}>
                  {zone.label}
                </span>
              </div>
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>
                Quota : {zone.quota_livres} livres max · {zone.quota_kg} kg
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 18, color: isSelected ? 'var(--bordeaux)' : 'var(--encre)' }}>
                {prix.toFixed(2)} €
              </div>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>
                {mode === 'express' ? 'frais express' : 'coût / livre'}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}