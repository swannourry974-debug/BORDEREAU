import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const Card = ({ title, value, sub }) => (
  <div style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 16 }}>
    <div className="font-special" style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--sepia)' }}>{title}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--bordeaux)', marginTop: 6 }}>{value}</div>
    <div className="font-fell" style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(26,16,8,0.55)' }}>{sub}</div>
  </div>
);

export default function AdminActivityApp() {
  const [commandes, setCommandes] = useState([]);
  const [relais, setRelais] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Commande.list('-updated_date', 300),
      base44.entities.PointRelais.list('-updated_date', 200),
    ]).then(([c, r]) => { setCommandes(c || []); setRelais(r || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Chargement de l'activité…</div>;

  const today = new Date().toISOString().slice(0, 10);
  const ventesJour = commandes.filter(c => c.created_date?.slice(0, 10) === today);
  const retirees = commandes.filter(c => c.statut === 'livree').length;
  const disponibles = commandes.filter(c => ['au_relais', 'livree'].includes(c.statut)).length;
  const tauxRetrait = disponibles ? Math.round((retirees / disponibles) * 100) : 0;
  const villes = commandes.reduce((acc, c) => { const v = c.zone_nom || 'Non classée'; acc[v] = (acc[v] || 0) + 1; return acc; }, {});
  const villePhare = Object.entries(villes).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const printQueue = commandes.filter(c => ['payee', 'en_transit'].includes(c.statut)).slice(0, 8);
  const visuels = commandes.filter(c => c.qr_code_depot || c.facture_reference).length;
  const factures = commandes.filter(c => c.facture_reference || c.facture_url).length;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h2 className="font-special" style={{ fontSize: 20, letterSpacing: 3, color: 'var(--bordeaux)', textTransform: 'uppercase' }}>Activité de l'appli</h2>
        <p className="font-fell" style={{ fontStyle: 'italic', color: 'rgba(26,16,8,0.6)' }}>Suivi instantané des ventes, retraits, villes phares et réseau relais.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <Card title="Ventes du jour" value={ventesJour.length} sub={`${ventesJour.reduce((s, c) => s + (c.montant_paye || 0), 0).toFixed(2)} €`} />
        <Card title="Taux de retrait" value={`${tauxRetrait}%`} sub={`${retirees}/${disponibles || 0} colis retirés`} />
        <Card title="Ville phare" value={villePhare} sub="Plus forte activité commandes" />
        <Card title="Relais actifs" value={relais.filter(r => r.actif && r.validation_admin === 'valide').length} sub="Commerçants partenaires validés" />
      </div>
      <section style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', padding: 18 }}>
        <h3 style={{ marginBottom: 12, fontWeight: 800 }}>File d'impression des visuels</h3>
        {printQueue.length === 0 ? <p>Aucun visuel à imprimer.</p> : printQueue.map(c => <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px dashed hsl(var(--border))' }}><span>{c.livre_titre || 'Livre'} · {c.zone_nom || 'Zone'}</span><strong>{c.qr_code_depot || c.facture_reference || 'visuel à générer'}</strong></div>)}
      </section>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <Card title="Centre visuels uniques" value={visuels} sub="Visuels archivés ou vérifiables" />
        <Card title="Centre facturation" value={factures} sub="Factures générées ou liées" />
        <Card title="Notifications ciblées" value={Object.keys(villes).length} sub="Ciblage disponible par ville" />
      </div>
    </div>
  );
}