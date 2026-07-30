import React from 'react';

const OPTIONS = [
  {
    id: 'email',
    title: 'Par e-mail uniquement',
    desc: 'Facture et notifications envoyées par e-mail.',
  },
  {
    id: 'application',
    title: "Via l'application",
    desc: "Suivi en temps réel et facture dans l'Étagère.",
  },
];

export default function SuiviFacturationChoice({ value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
        Suivi & facture
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {OPTIONS.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 12px', cursor: 'pointer',
                border: active ? '2px solid var(--bordeaux)' : '1px dashed hsl(var(--border))',
                background: active ? 'rgba(128,0,32,0.07)' : 'transparent',
                color: active ? 'var(--bordeaux)' : 'var(--encre)',
              }}
            >
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 1 }}>{option.title}</div>
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{option.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}