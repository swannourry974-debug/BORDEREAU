import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const STATES = [
  ['payee', 'En préparation'],
  ['en_transit', 'En transit'],
  ['au_relais', 'En Point Relais'],
  ['livree', 'Retiré'],
];

export default function AdminLivraisonsEtats() {
  const [commandes, setCommandes] = useState([]);
  useEffect(() => { base44.entities.Commande.list('-updated_date', 500).then(setCommandes); }, []);

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <h2 className="font-special" style={{ fontSize: 20, letterSpacing: 3, color: 'var(--bordeaux)', textTransform: 'uppercase' }}>Livraisons & États</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {STATES.map(([id, label]) => <div key={id} style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 16 }}><div style={{ fontSize: 28, fontWeight: 800, color: 'var(--bordeaux)' }}>{commandes.filter(c => c.statut === id).length}</div><div>{label}</div></div>)}
      </div>
      <div style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 16 }}>
        {commandes.filter(c => STATES.some(([id]) => id === c.statut)).slice(0, 20).map(c => <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px dashed hsl(var(--border))' }}><span>{c.livre_titre || 'Livre'} · {c.zone_nom || 'Zone'}</span><strong>{STATES.find(([id]) => id === c.statut)?.[1]}</strong></div>)}
      </div>
    </div>
  );
}