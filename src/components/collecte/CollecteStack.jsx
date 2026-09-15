import React from 'react';
import CollecteBookSpine from '@/components/collecte/CollecteBookSpine';
import { COLLECTE_MAX_KG, getOrderWeightKg, formatKg } from '@/components/collecte/collecteUtils';

export default function CollecteStack({ orders, totalKg }) {
  const fill = Math.min((totalKg / COLLECTE_MAX_KG) * 100, 100);
  const markers = [20, 15, 10, 5, 0];
  return (
    <div style={{ background: 'var(--papier)', border: '1.5px solid var(--bordeaux)', padding: 16, boxShadow: '5px 5px 0 rgba(128,0,32,0.12)', marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '54px 1fr', gap: 14, minHeight: 440 }}>
        <div style={{ position: 'relative', borderRight: '1px dashed rgba(128,0,32,0.35)' }}>
          {markers.map(m => <div key={m} className="font-special" style={{ position: 'absolute', bottom: `${(m / COLLECTE_MAX_KG) * 100}%`, right: 10, transform: 'translateY(50%)', fontSize: 9, letterSpacing: 1.4, color: 'var(--bordeaux)' }}>{m} kg</div>)}
        </div>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '14px 6px 34px', background: 'linear-gradient(180deg, rgba(245,230,204,0.45), rgba(200,161,101,0.12))', border: '1px solid rgba(128,0,32,0.18)' }}>
          <div style={{ position: 'absolute', left: 10, right: 10, bottom: 26, height: `${fill}%`, maxHeight: 'calc(100% - 50px)', background: 'linear-gradient(180deg, rgba(200,161,101,0.10), rgba(128,0,32,0.08))', borderTop: '2px solid #C8A165', pointerEvents: 'none' }} />
          {orders.map((order, index) => <CollecteBookSpine key={order.id} order={order} index={index} height={Math.max(20, Math.min(52, getOrderWeightKg(order) * 54))} />)}
          <div className="font-special" style={{ position: 'absolute', left: 0, right: 0, bottom: 6, textAlign: 'center', fontSize: 10, letterSpacing: 2, color: 'var(--bordeaux)', textTransform: 'uppercase' }}>Objectif malle collective · {formatKg(totalKg)} / 20 kg</div>
        </div>
      </div>
    </div>
  );
}