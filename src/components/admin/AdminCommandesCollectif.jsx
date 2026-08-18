import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const STATUTS = ['en_attente_paiement', 'payee', 'en_transit', 'au_relais', 'livree', 'litige'];

export default function AdminCommandesCollectif() {
  const [commandes, setCommandes] = useState([]);
  const [assignations, setAssignations] = useState({});

  const load = async () => {
    const data = await base44.entities.Commande.filter({ mode_livraison: 'collectif' }, '-created_date', 300);
    setCommandes(data || []);
  };

  useEffect(() => { load(); }, []);

  const updateCommande = async (commande, changes) => {
    await base44.entities.Commande.update(commande.id, changes);
    await load();
  };

  const grouped = commandes.reduce((acc, c) => {
    const key = c.zone_nom || 'Zone non définie';
    acc[key] = acc[key] || [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h2 className="font-special" style={{ fontSize: 20, letterSpacing: 3, color: 'var(--bordeaux)', textTransform: 'uppercase' }}>Commandes collectif</h2>
        <p className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.55)', marginTop: 4 }}>Ces commandes restent créées par les lecteurs, mais leur regroupement et leur affectation sont réservés à l’admin.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 16 }}>Collectif<br /><strong style={{ fontSize: 28, color: 'var(--bordeaux)' }}>{commandes.length}</strong></div>
        <div style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 16 }}>Zones<br /><strong style={{ fontSize: 28, color: 'var(--bordeaux)' }}>{Object.keys(grouped).length}</strong></div>
        <div style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 16 }}>À affecter<br /><strong style={{ fontSize: 28, color: 'var(--bordeaux)' }}>{commandes.filter(c => !c.voyageur_email).length}</strong></div>
      </div>

      {Object.entries(grouped).map(([zone, items]) => (
        <div key={zone} style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 16 }}>
          <div className="font-special" style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 10 }}>{zone} · {items.length} lecteur{items.length > 1 ? 's' : ''}</div>
          {items.map(c => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 150px 120px', gap: 10, alignItems: 'center', padding: '10px 0', borderTop: '1px dashed hsl(var(--border))' }}>
              <div>
                <strong>{c.livre_titre || 'Livre'}</strong>
                <div style={{ fontSize: 11, color: 'rgba(26,16,8,0.55)' }}>{c.lecteur_email || 'Lecteur'} · {c.montant_paye ? `${c.montant_paye.toFixed(2)} €` : '—'}</div>
              </div>
              <input value={assignations[c.id] ?? c.voyageur_email ?? ''} onChange={(e) => setAssignations(prev => ({ ...prev, [c.id]: e.target.value }))} placeholder="email voyageur" style={{ background: 'var(--creme)', border: '1px solid rgba(26,16,8,0.25)', padding: '8px 10px', fontSize: 12 }} />
              <select value={c.statut || 'payee'} onChange={(e) => updateCommande(c, { statut: e.target.value })} style={{ background: 'var(--creme)', border: '1px solid rgba(26,16,8,0.25)', padding: '8px 10px', fontSize: 12 }}>
                {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => updateCommande(c, { voyageur_email: assignations[c.id] ?? c.voyageur_email ?? '' })} style={{ background: 'var(--cta-orange)', color: 'var(--cta-foreground)', border: 'none', padding: '9px 10px', fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer' }}>Affecter</button>
            </div>
          ))}
        </div>
      ))}

      {commandes.length === 0 && <div style={{ background: 'var(--papier)', border: '1px dashed hsl(var(--border))', padding: 24, textAlign: 'center', color: 'rgba(26,16,8,0.5)' }}>Aucune commande collectif pour le moment.</div>}
    </div>
  );
}