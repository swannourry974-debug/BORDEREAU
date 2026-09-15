import React from 'react';
import CollecteBookSpine from '@/components/collecte/CollecteBookSpine';
import { COLLECTE_MAX_KG, getOrderWeightKg, formatKg } from '@/components/collecte/collecteUtils';

export default function CollecteStack({ orders, totalKg }) {
  const fill = Math.min((totalKg / COLLECTE_MAX_KG) * 100, 100);
  const markers = [20, 15, 10, 5, 0];
  const visibleOrders = orders.length ? orders : [{ id: 'empty-collecte', livre_titre: 'Malle en attente', statut: 'en_preparation', format_livre_bordero: 'M' }];

  return (
    <div style={{ background: 'linear-gradient(145deg, var(--papier-fonce), var(--papier))', border: '1.5px solid rgba(110,30,46,0.46)', padding: 18, boxShadow: '0 18px 36px rgba(59,42,35,0.16), inset 0 1px 0 rgba(255,255,255,0.35)', marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '58px 1fr', gap: 14, minHeight: 460 }}>
        <div style={{ position: 'relative', borderRight: '1px dashed rgba(110,30,46,0.32)' }}>
          {markers.map(m => <div key={m} className="font-special" style={{ position: 'absolute', bottom: `${(m / COLLECTE_MAX_KG) * 100}%`, right: 10, transform: 'translateY(50%)', fontSize: 9, letterSpacing: 1.4, color: 'var(--bordeaux)' }}>{m} kg</div>)}
        </div>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '20px 10px 42px', background: 'linear-gradient(180deg, rgba(243,232,210,0.74), rgba(199,161,90,0.13))', border: '1px solid rgba(110,30,46,0.22)', boxShadow: 'inset 0 0 28px rgba(59,42,35,0.08)' }}>
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 34, height: `${fill}%`, maxHeight: 'calc(100% - 64px)', background: 'linear-gradient(180deg, rgba(199,161,90,0.14), rgba(110,30,46,0.08))', borderTop: '2px solid #C7A15A', pointerEvents: 'none' }} />
          <div className="font-special" style={{ position: 'absolute', top: 12, right: 14, color: 'rgba(110,30,46,0.5)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' }}>Pile Collecte Bordero</div>
          {visibleOrders.map((order, index) => <CollecteBookSpine key={order.id} order={order} index={index} height={orders.length ? Math.max(22, Math.min(56, getOrderWeightKg(order) * 56)) : 42} faded={!orders.length} />)}
          <div style={{ height: 12, margin: '2px auto 0', width: '88%', background: 'linear-gradient(90deg, #3B2A23, #5A3A22, #3B2A23)', border: '1px solid rgba(199,161,90,0.55)', boxShadow: '0 8px 18px rgba(46,17,17,0.22)' }} />
          <div className="font-special" style={{ position: 'absolute', left: 0, right: 0, bottom: 8, textAlign: 'center', fontSize: 10, letterSpacing: 2, color: 'var(--bordeaux)', textTransform: 'uppercase' }}>Objectif malle collective · {formatKg(totalKg)} / 20 kg</div>
        </div>
      </div>
    </div>
  );
}