import React from 'react';
import { getCollecteStatus } from '@/components/collecte/collecteUtils';

const textures = [
  ['#6E1E2E', '#8B3345', '#C7A15A'],
  ['#3B2A23', '#6B4A30', '#D7BB78'],
  ['#4B1220', '#7A2D22', '#C7A15A'],
  ['#1E1A18', '#5A3A22', '#F3E8D2'],
];

export default function CollecteBookSpine({ order, index, height, faded = false }) {
  const [base, light, gold] = textures[index % textures.length];
  const tilt = index % 2 === 0 ? '-0.8deg' : '0.7deg';

  return (
    <div
      title={order.livre_titre}
      style={{
        height,
        margin: '0 auto 5px',
        width: `${80 + (index % 4) * 4}%`,
        transform: `rotate(${tilt})`,
        opacity: faded ? 0.62 : 1,
        background: `linear-gradient(90deg, ${base}, ${light} 18%, ${base} 42%, ${light} 73%, ${base}), repeating-linear-gradient(0deg, transparent 0 6px, rgba(243,232,210,0.08) 6px 7px)`,
        border: `1px solid ${gold}`,
        boxShadow: 'inset 8px 0 13px rgba(0,0,0,0.24), inset -10px 0 14px rgba(243,232,210,0.09), 0 7px 13px rgba(46,17,17,0.24)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        padding: '0 12px', color: '#F3E8D2', overflow: 'hidden', position: 'relative',
      }}
    >
      <span style={{ position: 'absolute', left: 9, top: 4, bottom: 4, width: 3, background: `linear-gradient(${gold}, rgba(243,232,210,0.35), ${gold})`, opacity: 0.75 }} />
      <span className="font-special" style={{ fontSize: 8, letterSpacing: 1.6, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingLeft: 10 }}>{order.livre_titre || 'Livre collecte'}</span>
      <span style={{ width: 34, height: '68%', borderLeft: `1px solid ${gold}`, borderRight: `1px solid ${gold}`, background: 'linear-gradient(90deg, rgba(243,232,210,0.23), transparent)', flexShrink: 0 }} />
      <span className="font-fell" style={{ fontSize: 10, fontStyle: 'italic', color: '#D7BB78', flexShrink: 0 }}>{getCollecteStatus(order)}</span>
    </div>
  );
}