import React from 'react';
import { useLang } from '@/lib/LangContext';

const roles = [
  { id: 'lecteur', icon: '📖', label_key: 'role_lecteur', desc_key: 'role_switch_lecteur_desc' },
  { id: 'voyageur', icon: '✈️', label_key: 'role_voyageur', desc_key: 'role_switch_voyageur_desc' },
  { id: 'admin', icon: '⌘', label: 'Admin', desc: 'Accéder au tableau de bord' },
];

export default function RoleSwitcher({ open, currentRole, onSwitch }) {
  const { t } = useLang();
  const canOpenAdmin = currentRole === 'admin' || currentRole === 'admin_secondaire';
  const visibleRoles = roles.filter(role => role.id !== 'admin' || canOpenAdmin);
  if (!open) return null;
  return (
    <div style={{
      background: 'var(--papier)',
      borderBottom: '2px solid var(--papier-fonce)',
      padding: '0 20px',
      maxWidth: 480,
      margin: '0 auto',
    }}>
      {visibleRoles.map((r, i) => (
        <div
          key={r.id}
          onClick={() => onSwitch(r.id)}
          style={{
            padding: '12px 0',
            borderBottom: i < visibleRoles.length - 1 ? '1px dashed rgba(26,16,8,0.2)' : 'none',
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
            <div style={{ fontSize: 13, letterSpacing: 1 }}>{r.label || t(r.label_key)}</div>
            <div style={{ fontSize: 10, color: 'rgba(26,16,8,0.5)', fontStyle: 'italic' }}>{r.desc || t(r.desc_key)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}