import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const ACTIONS = [
  { label: 'Validé', changes: { statut: 'livree', validation_admin: 'validee', admin_notes: 'Litige validé par l’administrateur.' } },
  { label: 'Transmis en point relais', changes: { statut: 'au_relais', validation_admin: 'validee', admin_notes: 'Dossier transmis en point relais.' } },
  { label: 'En attente', changes: { statut: 'litige', validation_admin: 'en_attente', admin_notes: 'Litige maintenu en attente.' } },
  { label: 'Annuler', changes: { statut: 'annulee', validation_admin: 'rejetee', admin_notes: 'Commande annulée depuis le tableau litiges.' } },
];

export default function AdminLitiges() {
  const [items, setItems] = useState([]);

  const load = async () => {
    const commandes = await base44.entities.Commande.list('-updated_date', 500);
    const today = new Date().toISOString().slice(0, 10);
    setItems((commandes || []).filter(c => c.statut === 'litige' || c.statut === 'annulee' || (c.statut === 'au_relais' && c.date_limite_collecte && c.date_limite_collecte < today) || c.admin_notes));
  };

  useEffect(() => { load(); }, []);

  const updateLitige = async (commande, changes) => {
    await base44.entities.Commande.update(commande.id, changes);
    await load();
  };

  const deleteLitige = async (commande) => {
    await base44.entities.Commande.delete(commande.id);
    await load();
  };

  const buttonStyle = {
    background: 'var(--cta-orange)',
    color: 'var(--cta-foreground)',
    border: 'none',
    padding: '8px 10px',
    fontFamily: 'Inter, sans-serif',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    cursor: 'pointer'
  };

  return (
    <div>
      <h2 className="font-special" style={{ fontSize: 20, letterSpacing: 3, color: 'var(--bordeaux)', textTransform: 'uppercase', marginBottom: 14 }}>Tableau de bord des litiges</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map(c => (
          <div key={c.id} style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 16 }}>
            <strong>{c.livre_titre || 'Livre'}</strong>
            <div style={{ color: 'rgba(26,16,8,0.65)', marginTop: 4 }}>{c.zone_nom || 'Zone'} · {c.statut?.replace(/_/g, ' ')} · lecteur {c.lecteur_email || '?'}</div>
            <div style={{ marginTop: 8, color: 'var(--bordeaux)' }}>{c.admin_notes || (c.date_limite_collecte ? 'Colis non retiré dans les délais.' : 'Anomalie à traiter.')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {ACTIONS.map(action => <button key={action.label} onClick={() => updateLitige(c, action.changes)} style={buttonStyle}>{action.label}</button>)}
              <button onClick={() => deleteLitige(c)} style={{ ...buttonStyle, background: '#800020' }}>Supprimer</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 20 }}>Aucun litige ou colis non retiré à traiter.</div>}
      </div>
    </div>
  );
}