import React from 'react';
import { getOrderWeightKg, getCollecteStatus, formatKg } from '@/components/collecte/collecteUtils';

export default function CollecteOrderList({ orders }) {
  if (!orders.length) return <div className="font-fell" style={{ textAlign: 'center', fontStyle: 'italic', color: 'rgba(128,0,32,0.55)', padding: 24 }}>Aucune commande Collecte active pour le moment.</div>;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {orders.map(order => (
        <div key={order.id} style={{ background: 'var(--papier)', border: '1px solid rgba(128,0,32,0.24)', padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div className="font-playfair" style={{ fontSize: 15, fontWeight: 700, color: 'var(--bordeaux)' }}>{order.livre_titre || 'Livre Collecte'}</div>
            <div className="font-fell" style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(128,0,32,0.62)', marginTop: 2 }}>{order.livre_auteur || 'Auteur non renseigné'} · {order.zone_nom || 'Destination collecte'}</div>
            <div className="font-fell" style={{ fontSize: 11, fontStyle: 'italic', color: 'rgba(128,0,32,0.48)', marginTop: 3 }}>
              {order.malle_id ? `Malle ${order.malle_id.slice(0, 8)}` : 'En attente de regroupement Bordero'}{order.transporteur_assigne ? ` · ${order.transporteur_assigne}` : ''}{order.reference_suivi_collecte ? ` · ${order.reference_suivi_collecte}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="font-special" style={{ fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: '#C2410C' }}>{getCollecteStatus(order)}</div>
            <div className="font-fell" style={{ fontSize: 12, color: 'rgba(128,0,32,0.72)', marginTop: 4 }}>{formatKg(getOrderWeightKg(order))}</div>
            {order.visuel_bordero_serie && <div className="font-special" style={{ fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--bordeaux)', marginTop: 4 }}>Visuel {order.visuel_bordero_serie}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}