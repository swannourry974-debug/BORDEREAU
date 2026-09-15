import React from 'react';
import { COLLECTE_MAX_KG, formatKg } from '@/components/collecte/collecteUtils';

export default function CollecteHeader({ totalKg, count, scopeLabel }) {
  const remaining = Math.max(COLLECTE_MAX_KG - totalKg, 0);
  return (
    <div style={{ background: 'linear-gradient(135deg, #800020 0%, #5A0015 100%)', color: 'var(--creme)', border: '1px solid #C8A165', padding: 20, marginBottom: 18, boxShadow: '0 18px 40px rgba(128,0,32,0.22)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.16, backgroundImage: 'radial-gradient(circle at 20% 20%, #D8B87A 0 1px, transparent 1px), radial-gradient(circle at 80% 60%, #F5E6CC 0 1px, transparent 1px)', backgroundSize: '18px 18px, 26px 26px' }} />
      <div style={{ position: 'relative' }}>
        <div className="font-special" style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#D8B87A', marginBottom: 8 }}>Progression Collecte</div>
        <div className="font-playfair" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>Pile de livres · 0 à 20 kg</div>
        <div className="font-fell" style={{ fontSize: 14, fontStyle: 'italic', opacity: 0.82, marginTop: 8 }}>{scopeLabel} · {count} livre{count > 1 ? 's' : ''} · reste {formatKg(remaining)}</div>
      </div>
    </div>
  );
}