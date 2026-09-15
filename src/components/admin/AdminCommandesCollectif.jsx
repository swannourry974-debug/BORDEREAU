import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { COLLECTE_MAX_KG, formatKg, getOrderWeightKg } from '@/components/collecte/collecteUtils';

const MALLE_STATUS = {
  en_preparation: 'En préparation',
  en_transit: 'En transit',
  arrivee_relais: 'Arrivée relais',
};

export default function AdminCommandesCollectif() {
  const [commandes, setCommandes] = useState([]);
  const [malles, setMalles] = useState([]);
  const [relais, setRelais] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState('');

  const load = async () => {
    const [orders, trunks, relays] = await Promise.all([
      base44.entities.Commande.filter({ mode_livraison: 'collectif' }, '-created_date', 500),
      base44.entities.MalleCollecte.list('-updated_date', 250),
      base44.entities.PointRelais.list('-updated_date', 250),
    ]);
    setCommandes(orders || []);
    setMalles(trunks || []);
    setRelais(relays || []);
  };

  useEffect(() => { load(); }, []);

  const relayById = useMemo(() => Object.fromEntries(relais.map(r => [r.id, r])), [relais]);
  const activeOrders = commandes.filter(c => !['annulee', 'livree'].includes(c.statut));
  const unassignedGroups = activeOrders.filter(c => !c.malle_id).reduce((acc, c) => {
    const key = c.point_relais_id || 'sans_relais';
    acc[key] = acc[key] || [];
    acc[key].push(c);
    return acc;
  }, {});

  const ordersForMalle = (malleId) => activeOrders.filter(c => c.malle_id === malleId);
  const poids = (items) => Math.round(items.reduce((s, c) => s + getOrderWeightKg(c), 0) * 100) / 100;

  const createOrFillMalle = async (relayId, items) => {
    const relay = relayById[relayId] || {};
    let malle = malles.find(m => m.point_relais_id === relayId && m.statut === 'en_preparation' && !m.date_fermeture);
    if (!malle) {
      malle = await base44.entities.MalleCollecte.create({
        point_relais_id: relayId,
        point_relais_nom: relay.nom || 'Relais non assigné',
        statut: 'en_preparation',
        poids_actuel_kg: 0,
        nombre_commandes: 0,
      });
    }
    await base44.entities.Commande.bulkUpdate(items.map(c => ({ id: c.id, malle_id: malle.id, statut: 'en_preparation' })));
    await base44.entities.MalleCollecte.update(malle.id, { poids_actuel_kg: poids([...ordersForMalle(malle.id), ...items]), nombre_commandes: ordersForMalle(malle.id).length + items.length });
    setMessage('Commandes rattachées à la malle Collecte.');
    await load();
  };

  const saveMalle = async (malle) => {
    const draft = drafts[malle.id] || {};
    await base44.entities.MalleCollecte.update(malle.id, {
      transporteur_assigne: draft.transporteur_assigne ?? malle.transporteur_assigne ?? '',
      reference_suivi: draft.reference_suivi ?? malle.reference_suivi ?? '',
      notes_admin: draft.notes_admin ?? malle.notes_admin ?? '',
    });
    setMessage('Assignation transporteur enregistrée.');
    await load();
  };

  const closeMalle = async (malle) => {
    await base44.functions.invoke('fermerMalleCollecte', { malleId: malle.id });
    setMessage('Malle fermée : les VisuelBordero S/M/L sont assignés.');
    await load();
  };

  const moveMalle = async (malle, status) => {
    const items = ordersForMalle(malle.id);
    const orderStatus = status === 'arrivee_relais' ? 'au_relais' : 'en_transit';
    const now = new Date().toISOString();
    await base44.entities.MalleCollecte.update(malle.id, {
      statut: status,
      date_depart: status === 'en_transit' ? now : malle.date_depart,
      date_arrivee_relais: status === 'arrivee_relais' ? now : malle.date_arrivee_relais,
    });
    if (items.length) {
      await base44.entities.Commande.bulkUpdate(items.map(c => ({
        id: c.id,
        statut: orderStatus,
        transporteur_assigne: malle.transporteur_assigne || '',
        reference_suivi_collecte: malle.reference_suivi || '',
        date_arrivee_relais: status === 'arrivee_relais' ? now : c.date_arrivee_relais,
      })));
    }
    setMessage(status === 'arrivee_relais' ? 'Malle arrivée au point relais.' : 'Malle passée en transit.');
    await load();
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h2 className="font-special" style={{ fontSize: 20, letterSpacing: 3, color: 'var(--bordeaux)', textTransform: 'uppercase' }}>Malles Collecte Bordero</h2>
        <p className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.55)', marginTop: 4 }}>La Collecte est gérée uniquement par Bordero : regroupement par point relais, assignation transporteur manuelle et jauge 0→20 kg.</p>
      </div>

      {message && <div style={{ background: 'rgba(45,106,45,0.08)', border: '1px solid #2d6a2d', color: '#2d6a2d', padding: 12, fontSize: 12 }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 16 }}>Commandes Collecte<br /><strong style={{ fontSize: 28, color: 'var(--bordeaux)' }}>{commandes.length}</strong></div>
        <div style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 16 }}>Malles ouvertes<br /><strong style={{ fontSize: 28, color: 'var(--bordeaux)' }}>{malles.filter(m => m.statut === 'en_preparation').length}</strong></div>
        <div style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 16 }}>À mettre en malle<br /><strong style={{ fontSize: 28, color: 'var(--bordeaux)' }}>{activeOrders.filter(c => !c.malle_id).length}</strong></div>
      </div>

      {Object.entries(unassignedGroups).map(([relayId, items]) => (
        <div key={relayId} style={{ background: 'var(--papier)', border: '1px dashed var(--bordeaux)', padding: 16 }}>
          <div className="font-special" style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 8 }}>{relayById[relayId]?.nom || 'Relais non assigné'} · {items.length} commande{items.length > 1 ? 's' : ''} · {formatKg(poids(items))}</div>
          <button onClick={() => createOrFillMalle(relayId, items)} style={{ background: 'var(--cta-orange)', color: 'var(--cta-foreground)', border: 'none', padding: '11px 14px', fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer' }}>Créer / compléter la malle</button>
        </div>
      ))}

      {malles.map(malle => {
        const items = ordersForMalle(malle.id);
        const totalKg = poids(items);
        const percent = Math.min((totalKg / COLLECTE_MAX_KG) * 100, 100);
        return (
          <div key={malle.id} style={{ background: 'var(--papier)', border: '1.5px solid hsl(var(--border))', padding: 16, boxShadow: '4px 4px 0 rgba(128,0,32,0.10)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div className="font-special" style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--bordeaux)' }}>{malle.point_relais_nom || relayById[malle.point_relais_id]?.nom || 'Point relais'}</div>
                <div className="font-fell" style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(26,16,8,0.58)', marginTop: 3 }}>{items.length} livres · {formatKg(totalKg)} / 20 kg · {MALLE_STATUS[malle.statut] || malle.statut}</div>
              </div>
              <strong style={{ color: percent >= 100 ? '#2d6a2d' : 'var(--bordeaux)' }}>{Math.round(percent)}%</strong>
            </div>
            <div style={{ height: 10, background: 'rgba(128,0,32,0.08)', border: '1px solid rgba(128,0,32,0.18)', overflow: 'hidden', marginBottom: 12 }}><div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #C8A165, #C2410C)' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
              <input value={drafts[malle.id]?.transporteur_assigne ?? malle.transporteur_assigne ?? ''} onChange={(e) => setDrafts(prev => ({ ...prev, [malle.id]: { ...(prev[malle.id] || {}), transporteur_assigne: e.target.value } }))} placeholder="Transporteur / prestataire" style={{ background: 'var(--creme)', border: '1px solid rgba(26,16,8,0.25)', padding: '9px 10px', fontSize: 12 }} />
              <input value={drafts[malle.id]?.reference_suivi ?? malle.reference_suivi ?? ''} onChange={(e) => setDrafts(prev => ({ ...prev, [malle.id]: { ...(prev[malle.id] || {}), reference_suivi: e.target.value } }))} placeholder="N° de suivi" style={{ background: 'var(--creme)', border: '1px solid rgba(26,16,8,0.25)', padding: '9px 10px', fontSize: 12 }} />
              <button onClick={() => saveMalle(malle)} style={{ background: 'transparent', color: 'var(--bordeaux)', border: '1px solid var(--bordeaux)', padding: '9px 10px', fontFamily: 'Inter, sans-serif', fontSize: 11, textTransform: 'uppercase' }}>Enregistrer</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              <button onClick={() => closeMalle(malle)} style={{ background: 'var(--cta-orange)', color: 'var(--cta-foreground)', border: 'none', padding: '10px 12px', fontFamily: 'Inter, sans-serif', fontSize: 11, textTransform: 'uppercase' }}>Fermer + visuels</button>
              <button onClick={() => moveMalle(malle, 'en_transit')} style={{ background: 'var(--bordeaux)', color: 'var(--creme)', border: 'none', padding: '10px 12px', fontFamily: 'Inter, sans-serif', fontSize: 11, textTransform: 'uppercase' }}>Passer en transit</button>
              <button onClick={() => moveMalle(malle, 'arrivee_relais')} style={{ background: '#2d6a2d', color: 'white', border: 'none', padding: '10px 12px', fontFamily: 'Inter, sans-serif', fontSize: 11, textTransform: 'uppercase' }}>Arrivée relais</button>
            </div>
            {items.map(c => <div key={c.id} style={{ borderTop: '1px dashed rgba(26,16,8,0.14)', padding: '8px 0', fontSize: 12 }}><strong>{c.livre_titre || 'Livre'}</strong> · {c.lecteur_email || 'lecteur'} · {c.format_livre_bordero || 'format à assigner'} · {c.visuel_bordero_serie || 'visuel en attente'}</div>)}
          </div>
        );
      })}

      {commandes.length === 0 && <div style={{ background: 'var(--papier)', border: '1px dashed hsl(var(--border))', padding: 24, textAlign: 'center', color: 'rgba(26,16,8,0.5)' }}>Aucune commande Collecte pour le moment.</div>}
    </div>
  );
}