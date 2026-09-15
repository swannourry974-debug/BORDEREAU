import React from 'react';
import { getCollecteStatus } from '@/components/collecte/collecteUtils';

const textures = [
  ['#4B1E1E', '#7A2D22', '#C8A165'],
  ['#5A3A22', '#8A5A32', '#D8B87A'],
  ['#800020', '#A0304A', '#C8A165'],
  ['#2E1111', '#613018', '#F5E6CC'],
];

export default function CollecteBookSpine({ order, index, height }) {
  const [base, light, gold] = textures[index % textures.length];
  return (
    <div title={order.livre_titre} style={{ height, margin: '0 auto 4px', width: `${78 + (index % 4) * 4}%`, background: `linear-gradient(90deg, ${base}, ${light} 18%, ${base} 44%, ${light} 74%, ${base}), repeating-linear-gradient(0deg, transparent 0 6px, rgba(245,230,204,0.08) 6px 7px)`, border: `1px solid ${gold}`, boxShadow: 'inset 7px 0 12px rgba(0,0,0,0.25), inset -10px 0 12px rgba(245,230,204,0.08), 0 5px 10px rgba(46,17,17,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 12px', color: '#F5E6CC', overflow: 'hidden' }}>
      <span className="font-special" style={{ fontSize: 8, letterSpacing: 1.6, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.livre_titre || 'Livre collecte'}</span>
      <span style={{ width: 32, height: '70%', borderLeft: `1px solid ${gold}`, borderRight: `1px solid ${gold}`, background: 'linear-gradient(90deg, rgba(245,230,204,0.22), transparent)' }} />
      <span className="font-fell" style={{ fontSize: 10, fontStyle: 'italic', color: '#D8B87A', flexShrink: 0 }}>{getCollecteStatus(order)}</span>
    </div>
  );
}