import React from 'react';

const roles = [
  { id: 'lecteur', icon: '📖', label: 'LECTEUR', desc: "Acheter un livre depuis l'étranger" },
  { id: 'voyageur', icon: '✈️', label: 'VOYAGEUR', desc: 'Transporter & gagner des commissions' },
  { id: 'relais', icon: '🏪', label: 'POINT RELAIS', desc: 'Gérer le stock & les dépôts' },
];

export default function RoleSwitcher({ open, onSwitch }) {
  if (!open) return null;
  return (
    <div style={{
      background: 'var(--papier)',
      borderBottom: '2px solid var(--papier-fonce)',
      padding: '0 20px',
      maxWidth: 480,
      margin: '0 auto',
    }}>
      {roles.map((r, i) => (
        <div
          key={r.id}
          onClick={() => onSwitch(r.id)}
          style={{
            padding: '12px 0',
            borderBottom: i < roles.length - 1 ? '1px dashed rgba(26,16,8,0.2)' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 13,
            letterSpacing: 1,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--bordeaux)'}
          onMouseLeave={e => e.currentTarget.style.color = ''}
        >
          <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{r.icon}</span>
          <div>
            <div style={{ fontSize: 13, letterSpacing: 1 }}>{r.label}</div>
            <div style={{ fontSize: 10, color: 'rgba(26,16,8,0.5)', fontStyle: 'italic' }}>{r.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}