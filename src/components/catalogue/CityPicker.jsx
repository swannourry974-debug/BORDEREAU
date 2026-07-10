import React, { useState } from 'react';
import { ZONES } from '@/lib/tarifsConfig';

const VILLES_PAR_ZONE = {
  europe: [
    { label: 'Paris, France', emoji: '🇫🇷' },
    { label: 'Londres, Royaume-Uni', emoji: '🇬🇧' },
    { label: 'Berlin, Allemagne', emoji: '🇩🇪' },
    { label: 'Bruxelles, Belgique', emoji: '🇧🇪' },
    { label: 'Genève, Suisse', emoji: '🇨🇭' },
    { label: 'Madrid, Espagne', emoji: '🇪🇸' },
  ],
  international: [
    { label: 'Miami, FL — USA', emoji: '🇺🇸' },
    { label: 'New York, NY — USA', emoji: '🇺🇸' },
    { label: 'Montréal, Canada', emoji: '🇨🇦' },
    { label: 'Sydney, Australie', emoji: '🇦🇺' },
    { label: 'Dubaï, EAU', emoji: '🇦🇪' },
    { label: 'Tokyo, Japon', emoji: '🇯🇵' },
  ],
  grand_export: [
    { label: 'Abidjan, Côte d\'Ivoire', emoji: '🇨🇮' },
    { label: 'Dakar, Sénégal', emoji: '🇸🇳' },
    { label: 'Douala, Cameroun', emoji: '🇨🇲' },
    { label: 'Lagos, Nigéria', emoji: '🇳🇬' },
    { label: 'São Paulo, Brésil', emoji: '🇧🇷' },
    { label: 'Mexico, Mexique', emoji: '🇲🇽' },
  ],
};

export default function CityPicker({ selected, onSelect, onClose }) {
  const [activeZone, setActiveZone] = useState(null);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(26,16,8,0.85)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--papier)',
          borderTop: '3px solid var(--bordeaux)',
          padding: '24px 20px 32px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--encre)' }}>
              Choisir ma destination
            </div>
            <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.5)', marginTop: 2 }}>
              Les tarifs s'adaptent selon la zone
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', opacity: 0.5, color: 'var(--encre)' }}>✕</button>
        </div>

        {/* Zones */}
        {!activeZone && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.values(ZONES).map(zone => (
              <button
                key={zone.id}
                onClick={() => setActiveZone(zone.id)}
                style={{
                  background: 'var(--creme)',
                  border: '1.5px solid rgba(26,16,8,0.15)',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{zone.emoji}</span>
                  <div>
                    <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--encre)' }}>
                      {zone.label}
                    </div>
                    <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.45)', marginTop: 2 }}>
                      Dès {zone.express.prix_client.toFixed(2)} € · {VILLES_PAR_ZONE[zone.id]?.length || 0} villes
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 12, opacity: 0.4, color: 'var(--encre)' }}>›</span>
              </button>
            ))}
          </div>
        )}

        {/* Villes de la zone sélectionnée */}
        {activeZone && (
          <>
            <button
              onClick={() => setActiveZone(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2,
                textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              ‹ Retour aux zones
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(VILLES_PAR_ZONE[activeZone] || []).map(ville => {
                const isSelected = selected?.label === ville.label;
                return (
                  <button
                    key={ville.label}
                    onClick={() => { onSelect({ ...ville, zone_id: activeZone }); onClose(); }}
                    style={{
                      background: isSelected ? 'rgba(128,0,32,0.07)' : 'var(--creme)',
                      border: isSelected ? '2px solid var(--bordeaux)' : '1.5px solid rgba(26,16,8,0.15)',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{ville.emoji}</span>
                    <span style={{
                      fontFamily: 'Special Elite, monospace', fontSize: 12,
                      letterSpacing: 1, textTransform: 'uppercase',
                      color: isSelected ? 'var(--bordeaux)' : 'var(--encre)',
                    }}>
                      {ville.label}
                    </span>
                    {isSelected && <span style={{ marginLeft: 'auto', color: 'var(--bordeaux)', fontSize: 14 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}