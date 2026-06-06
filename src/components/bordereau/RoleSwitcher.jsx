import React from 'react';
import { useLang } from '@/lib/LangContext';

const roles = [
  { id: 'lecteur', icon: '📖', label_key: 'role_lecteur', desc_key: 'role_switch_lecteur_desc' },
  { id: 'voyageur', icon: '✈️', label_key: 'role_voyageur', desc_key: 'role_switch_voyageur_desc' },
  { id: 'relais', icon: '🏪', label_key: 'role_relais', desc_key: 'role_switch_relais_desc' },
];

export default function RoleSwitcher({ open, onSwitch }) {
  const { t } = useLang();
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
            <div style={{ fontSize: 13, letterSpacing: 1 }}>{t(r.label_key)}</div>
            <div style={{ fontSize: 10, color: 'rgba(26,16,8,0.5)', fontStyle: 'italic' }}>{t(r.desc_key)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}