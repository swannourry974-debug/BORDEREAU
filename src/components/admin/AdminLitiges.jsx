import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function AdminLitiges() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    base44.entities.Commande.list('-updated_date', 500).then(commandes => {
      const today = new Date().toISOString().slice(0, 10);
      setItems((commandes || []).filter(c => c.statut === 'litige' || (c.statut === 'au_relais' && c.date_limite_collecte && c.date_limite_collecte < today) || c.admin_notes));
    });
  }, []);

  return (
    <div>
      <h2 className="font-special" style={{ fontSize: 20, letterSpacing: 3, color: 'var(--bordeaux)', textTransform: 'uppercase', marginBottom: 14 }}>Tableau de bord des litiges</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map(c => <div key={c.id} style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 16 }}><strong>{c.livre_titre || 'Livre'}</strong><div style={{ color: 'rgba(26,16,8,0.65)', marginTop: 4 }}>{c.zone_nom || 'Zone'} · {c.statut?.replace(/_/g, ' ')} · lecteur {c.lecteur_email || '?'}</div><div style={{ marginTop: 8, color: 'var(--bordeaux)' }}>{c.admin_notes || (c.date_limite_collecte ? 'Colis non retiré dans les délais.' : 'Anomalie à traiter.')}</div></div>)}
        {items.length === 0 && <div style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 20 }}>Aucun litige ou colis non retiré à traiter.</div>}
      </div>
    </div>
  );
}