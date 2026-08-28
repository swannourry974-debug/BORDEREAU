import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';

const STATUTS = [['all', 'Tous'], ['en_attente', 'En attente'], ['suspendu', 'Suspendus'], ['valide', 'Validés'], ['bloque', 'Bloqués']];

function Stat({ label, value }) {
  return <div className="bg-papier border border-bordeaux/15 p-4"><div className="font-ui text-[11px] uppercase tracking-[2px] text-bordeaux/55">{label}</div><strong className="font-heading text-3xl text-bordeaux">{value}</strong></div>;
}

export default function AdminValidationVoyageurs() {
  const [voyages, setVoyages] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('en_attente');
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [allVoyages, allUsers] = await Promise.all([
      base44.entities.Voyage.list('-updated_date', 500),
      base44.entities.User.list('-updated_date', 500),
    ]);
    setVoyages(allVoyages || []);
    setUsers(allUsers || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const userByEmail = useMemo(() => Object.fromEntries(users.map(u => [u.email, u])), [users]);
  const visible = voyages.filter(v => filter === 'all' || (v.validation_admin || 'en_attente') === filter);

  const decide = async (voyage, decision, fraud = false) => {
    const account = userByEmail[voyage.voyageur_email];
    const tentative = voyage.tentative_validation || account?.voyageur_tentatives_validation || 1;
    const finalDecision = decision === 'suspendu' && tentative >= 6 ? 'bloque' : decision;
    const note = notes[voyage.id] || (finalDecision === 'suspendu' ? 'Justificatif insuffisant : merci de renvoyer le bon document.' : fraud ? 'Tentative frauduleuse signalée.' : '');
    const updated = await base44.entities.Voyage.update(voyage.id, {
      validation_admin: finalDecision,
      actif: finalDecision === 'valide',
      admin_notes: note,
      fraude_signalee: fraud,
      validation_date: new Date().toISOString(),
    });
    if (account) {
      await base44.entities.User.update(account.id, {
        role: finalDecision === 'valide' && !['admin', 'admin_secondaire'].includes(account.role) ? 'voyageur' : account.role,
        voyageur_valide: finalDecision === 'valide',
        voyageur_validation_status: finalDecision,
        voyageur_validation_notes: note,
        voyageur_valide_le: finalDecision === 'valide' ? new Date().toISOString() : account.voyageur_valide_le,
        voyageur_tentatives_validation: Math.max(tentative, account.voyageur_tentatives_validation || 0),
        voyageur_bloque: finalDecision === 'bloque',
        voyageur_fraude_signalee: fraud || account.voyageur_fraude_signalee || false,
      });
    }
    setVoyages(prev => prev.map(v => v.id === updated.id ? updated : v));
  };

  if (loading) return <div className="text-center py-8 text-bordeaux/55 italic">Chargement des validations voyageurs…</div>;

  return (
    <div className="grid gap-5">
      <div><p className="font-ui text-[11px] tracking-[3px] uppercase text-bordeaux/60">Contrôle voyageurs</p><h2 className="font-heading text-3xl text-bordeaux">Validations des vols</h2></div>
      <div className="grid sm:grid-cols-5 gap-3"><Stat label="En attente" value={voyages.filter(v => (v.validation_admin || 'en_attente') === 'en_attente').length} /><Stat label="Suspendus" value={voyages.filter(v => v.validation_admin === 'suspendu').length} /><Stat label="Validés" value={voyages.filter(v => v.validation_admin === 'valide').length} /><Stat label="Bloqués" value={voyages.filter(v => v.validation_admin === 'bloque').length} /><Stat label="Fraudes" value={voyages.filter(v => v.fraude_signalee).length} /></div>
      <div className="flex gap-2 overflow-x-auto">{STATUTS.map(([id, label]) => <button key={id} onClick={() => setFilter(id)} className={`min-h-[44px] px-4 font-ui text-[11px] tracking-[1.5px] uppercase border ${filter === id ? 'bg-bordeaux text-creme border-bordeaux' : 'bg-papier text-bordeaux border-bordeaux/20'}`}>{label}</button>)}</div>
      <div className="bg-papier border border-bordeaux/20 overflow-x-auto"><table className="w-full text-sm"><thead className="font-ui text-[11px] uppercase tracking-[1.5px] text-bordeaux/55"><tr><th className="text-left p-3">Voyageur</th><th className="text-left p-3">Vol futur</th><th className="text-left p-3">Justificatif</th><th className="text-left p-3">Statut</th><th className="text-left p-3">Note admin</th><th className="text-right p-3">Actions</th></tr></thead><tbody>{visible.map(v => <tr key={v.id} className="border-t border-bordeaux/10 align-top"><td className="p-3 text-bordeaux font-medium">{userByEmail[v.voyageur_email]?.full_name || 'Voyageur'}<div className="text-xs text-bordeaux/50">{v.voyageur_email}</div></td><td className="p-3 text-bordeaux/65">{v.depart_ville} → {v.arrivee_ville}<div className="text-xs">{v.date_vol} · essai {v.tentative_validation || 1}/6</div></td><td className="p-3">{v.confirmation_vol_url ? <a href={v.confirmation_vol_url} target="_blank" rel="noreferrer" className="underline text-bordeaux">Ouvrir le document</a> : <span className="text-bordeaux/40">Aucun fichier</span>}</td><td className="p-3"><span className={`px-3 py-1 rounded-full text-xs ${v.validation_admin === 'valide' ? 'bg-green-100 text-green-800' : v.validation_admin === 'bloque' ? 'bg-red-100 text-red-800' : v.validation_admin === 'suspendu' ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'}`}>{v.validation_admin || 'en_attente'}</span></td><td className="p-3"><textarea value={notes[v.id] ?? v.admin_notes ?? ''} onChange={e => setNotes({ ...notes, [v.id]: e.target.value })} className="min-w-[190px] w-full bg-creme border border-bordeaux/20 p-2 text-bordeaux" placeholder="Motif ou demande de papier…" /></td><td className="p-3"><div className="flex justify-end gap-2 min-w-[250px]"><button onClick={() => decide(v, 'valide')} className="bg-cta text-cta-foreground px-3 py-2 text-xs">Valider</button><button onClick={() => decide(v, 'suspendu')} className="border border-bordeaux text-bordeaux px-3 py-2 text-xs">Suspendre</button><button onClick={() => decide(v, 'bloque', true)} className="bg-red-800 text-white px-3 py-2 text-xs">Fraude</button></div></td></tr>)}{visible.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-bordeaux/50 italic">Aucun voyageur dans ce statut.</td></tr>}</tbody></table></div>
    </div>
  );
}