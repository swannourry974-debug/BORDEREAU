import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

function AlertSection({ title, items, empty }) {
  return (
    <div className="bg-papier border border-encre/20 p-4">
      <div className="text-[11px] tracking-[2px] uppercase text-bordeaux font-special mb-3">{title}</div>
      {items.length === 0 ? (
        <div className="text-[13px] italic text-encre/45">{empty}</div>
      ) : items.map(item => (
        <div key={item.id} className="border-t border-encre/10 py-3 first:border-t-0">
          <div className="font-bold text-[14px] text-encre">{item.title}</div>
          <div className="text-[12px] text-encre/60 mt-1">{item.meta}</div>
          <div className="text-[10px] tracking-[1.5px] uppercase text-bordeaux mt-2">{item.badge}</div>
        </div>
      ))}
    </div>
  );
}

export default function AgentBordeurNotifications() {
  const [data, setData] = useState({ commandes: [], missions: [], relais: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Commande.list('-updated_date', 120),
      base44.entities.MissionVoyageur.list('-updated_date', 120),
      base44.entities.PointRelais.list('-updated_date', 80),
    ]).then(([commandes, missions, relais]) => {
      setData({ commandes: commandes || [], missions: missions || [], relais: relais || [] });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10 italic text-encre/50">Chargement des alertes Agent Bordeur…</div>;

  const achats = data.commandes.filter(c => ['en_attente_paiement', 'payee'].includes(c.statut)).slice(0, 8).map(c => ({
    id: c.id, title: c.livre_titre || 'Commande sans titre', meta: `${c.lecteur_email || 'Lecteur inconnu'} · ${c.zone_nom || 'Destination à préciser'}`, badge: `Achat · ${c.statut?.replace(/_/g, ' ') || 'nouveau'}`,
  }));
  const livraisons = data.commandes.filter(c => ['en_transit', 'au_relais', 'litige'].includes(c.statut)).slice(0, 8).map(c => ({
    id: c.id, title: c.livre_titre || 'Livraison', meta: `${c.voyageur_email || 'Voyageur à assigner'} · ${c.point_relais_id ? 'Relais assigné' : 'Relais à confirmer'}`, badge: `Livraison · ${c.statut?.replace(/_/g, ' ')}`,
  }));
  const priorites = data.commandes.filter(c => !c.voyageur_email || c.validation_admin === 'en_attente' || c.statut === 'payee').slice(0, 8).map(c => ({
    id: c.id, title: c.livre_titre || 'Envoi prioritaire', meta: `${c.mode_livraison || 'Mode inconnu'} · ${c.zone_nom || 'Zone inconnue'}`, badge: !c.voyageur_email ? 'À assigner en priorité' : 'À surveiller',
  }));

  return (
    <div>
      <div className="bg-bordeaux text-creme p-5 mb-5">
        <div className="text-[10px] tracking-[3px] uppercase opacity-70 font-special">Agent Bordeur</div>
        <h2 className="text-[22px] font-bold mt-1">Notifications d’activité</h2>
        <p className="text-[13px] opacity-75 mt-1">Vue constante en lecture seule : achats, livraisons et envois à prioriser.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <AlertSection title="Achats récents" items={achats} empty="Aucun achat récent à surveiller." />
        <AlertSection title="Livraisons" items={livraisons} empty="Aucune livraison active." />
        <AlertSection title="Priorités" items={priorites} empty="Aucun envoi prioritaire." />
      </div>
    </div>
  );
}