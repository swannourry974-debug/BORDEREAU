import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const today = () => new Date().toISOString().slice(0, 10);

const CATEGORIES = [
  { key: 'attendus', label: 'Attendus', emoji: '✈️', color: '#1a3a5c', bg: 'rgba(26,58,92,0.08)', desc: 'En transit vers le relais' },
  { key: 'recus', label: 'Réceptionnés', emoji: '📦', color: '#8B6914', bg: 'rgba(139,105,20,0.12)', desc: 'Au relais — en attente de retrait' },
  { key: 'remis', label: 'Remis au lecteur', emoji: '✅', color: '#2d6a2d', bg: 'rgba(45,106,45,0.10)', desc: 'Retirés aujourd’hui' },
];

function ColisCard({ commande, categorie }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = CATEGORIES.find(c => c.key === categorie);
  const retardJours = commande.jours_retard || 0;

  return (
    <article onClick={() => setExpanded(v => !v)} className="mb-3 cursor-pointer overflow-hidden border bg-[#FFF8EA]/88 shadow-[0_10px_22px_rgba(59,42,35,0.08)]" style={{ borderColor: `${cfg.color}44`, borderLeft: `5px solid ${cfg.color}` }}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-heading text-[17px] font-bold text-[#6E1E2E]">{commande.livre_titre}</h3>
            {commande.livre_auteur && <p className="mt-1 font-body text-sm italic text-[#3B2A23]/58">{commande.livre_auteur}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {commande.lecteur_email && <span className="font-ui text-[9px] uppercase tracking-[0.12em] text-[#3B2A23]/42">👤 {commande.lecteur_email.split('@')[0]}</span>}
              {commande.mode_livraison && <span className="font-ui text-[9px] uppercase tracking-[0.12em] text-[#3B2A23]/42">{commande.mode_livraison === 'express' ? '✈ Express' : '📦 Collectif'}</span>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            {retardJours > 0 && <div className="mb-1 rounded-full border border-[#b41414]/30 bg-[#b41414]/8 px-2 py-1 font-ui text-[8px] font-bold uppercase tracking-[0.12em] text-[#b41414]">J+{retardJours}</div>}
            {commande.code_secret && categorie === 'recus' && <div className="font-heading text-xl font-bold tracking-[0.18em]" style={{ color: cfg.color }}>{commande.code_secret}</div>}
            <div className="mt-1 font-ui text-[8px] uppercase tracking-[0.12em] text-[#3B2A23]/30">{expanded ? '▲' : '▼ détails'}</div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-dashed border-[#6E1E2E]/16 bg-[#F3E8D2]/42 p-3">
          {[
            ['ID commande', commande.id?.slice(0, 8)],
            ['Zone', commande.zone_nom],
            ['Arrivée relais', commande.date_arrivee_relais ? new Date(commande.date_arrivee_relais).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : null],
            ['À retirer avant', commande.date_limite_collecte ? new Date(commande.date_limite_collecte).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : null],
            ['Pénalité', commande.penalite_retard > 0 ? `${commande.penalite_retard.toFixed(2)} €` : null],
            ['Code secret', categorie === 'recus' ? commande.code_secret : null],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={label} className="mb-2 flex justify-between gap-4">
              <span className="font-ui text-[8px] uppercase tracking-[0.12em] text-[#3B2A23]/42">{label}</span>
              <span className="text-right font-body text-sm text-[#1E1A18]">{val}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function Section({ categorie, commandes, loading }) {
  const cfg = CATEGORIES.find(c => c.key === categorie);
  return (
    <section className="mb-5 bordero-surface p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-xl">{cfg.emoji}</span>
        <div className="flex-1">
          <div className="font-ui text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: cfg.color }}>{cfg.label}</div>
          <div className="font-body text-xs italic text-[#3B2A23]/50">{cfg.desc}</div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full font-heading text-sm font-bold text-[#F3E8D2]" style={{ background: cfg.color }}>{loading ? '…' : commandes.length}</div>
      </div>
      {loading ? <div className="bordero-empty-state py-5 font-body italic">Chargement…</div> : commandes.length === 0 ? <div className="bordero-empty-state py-5 font-body italic">Aucun colis dans cette catégorie</div> : commandes.map(c => <ColisCard key={c.id} commande={c} categorie={categorie} />)}
    </section>
  );
}

export default function TableauDeBordRelais({ relaisEmail }) {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!relaisEmail) return;
    base44.entities.Commande.filter({ point_relais_id: relaisEmail }, '-created_date', 200)
      .then(data => { setCommandes(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [relaisEmail]);

  const attendus = commandes.filter(c => c.statut === 'en_transit');
  const recus = commandes.filter(c => c.statut === 'au_relais');
  const todayStr = today();
  const remis = commandes.filter(c => c.statut === 'livree');
  const retards = recus.filter(c => (c.jours_retard || 0) > 0).length;

  return (
    <div>
      <div className="mb-5 grid grid-cols-3 gap-2">
        {[
          { val: attendus.length, label: 'Attendus', color: '#1a3a5c' },
          { val: recus.length, label: 'Au relais', color: '#8B6914' },
          { val: remis.length, label: 'Remis', color: '#2d6a2d' },
        ].map(({ val, label, color }) => (
          <div key={label} className="border bg-[#FFF8EA]/78 p-3 text-center" style={{ borderColor: `${color}33` }}>
            <div className="font-heading text-3xl font-bold" style={{ color }}>{val}</div>
            <div className="mt-1 font-ui text-[8px] font-extrabold uppercase tracking-[0.14em] text-[#3B2A23]/44">{label}</div>
          </div>
        ))}
      </div>
      {retards > 0 && <div className="mb-4 flex items-center gap-2 border border-[#b41414]/35 bg-[#b41414]/6 p-3 font-ui text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#b41414]">⚠️ {retards} colis en retard — contactez les lecteurs</div>}
      <Section categorie="attendus" commandes={attendus} loading={loading} />
      <Section categorie="recus" commandes={recus} loading={loading} />
      <Section categorie="remis" commandes={remis} loading={loading} />
    </div>
  );
}