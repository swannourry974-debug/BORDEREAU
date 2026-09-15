import React from 'react';
import { COLLECTE_MAX_KG, formatKg } from '@/components/collecte/collecteUtils';

export default function CollecteDashboard({ totalKg, count }) {
  const percent = Math.min((totalKg / COLLECTE_MAX_KG) * 100, 100);
  const remaining = Math.max(COLLECTE_MAX_KG - totalKg, 0);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
      {[
        ['Total cumulé', formatKg(totalKg)],
        ['Jauge remplie', `${Math.round(percent)}%`],
        ['Restant', formatKg(remaining)],
      ].map(([label, value]) => (
        <div key={label} style={{ background: 'var(--papier)', border: '1px solid rgba(128,0,32,0.28)', padding: 12, textAlign: 'center' }}>
          <div className="font-playfair" style={{ fontSize: 22, fontWeight: 800, color: 'var(--bordeaux)' }}>{value}</div>
          <div className="font-special" style={{ fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(128,0,32,0.6)', marginTop: 4 }}>{label}</div>
        </div>
      ))}
      <div style={{ gridColumn: '1 / -1', background: 'rgba(128,0,32,0.08)', height: 12, border: '1px solid rgba(128,0,32,0.18)', overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #C8A165, #C2410C)', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}