import React from 'react';

export default function BorderoBadge({ icon = '★', title, subtitle, locked = false }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border p-3" style={{ background: 'var(--bordeaux-dark)', borderColor: locked ? 'rgba(200,161,101,0.18)' : 'rgba(200,161,101,0.48)', color: 'var(--creme)' }}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full border text-xl" style={{ borderColor: 'var(--sepia)', color: locked ? 'rgba(245,230,204,0.45)' : 'var(--or-clair)' }}>{locked ? '◌' : icon}</span>
      <div>
        <div className="bordero-title text-sm">{title}</div>
        {subtitle && <div className="bordero-ui text-xs opacity-60">{subtitle}</div>}
      </div>
    </div>
  );
}