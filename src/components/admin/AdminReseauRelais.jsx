import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import RelaisFinalisationActions from './RelaisFinalisationActions';

const TYPES_COMMERCE = ['Boulangerie', 'Café', 'Restaurant'];
const EMPTY_FORM = { nom: '', identifiant_connexion: '', gerant_email: '', adresse: '', ville: '', pays_nom: 'France', type_commerce: 'Boulangerie', telephone: '', horaires: '', validation_admin: 'valide' };

const paysCode = (pays) => {
  const normalized = pays.trim().toLowerCase();
  if (normalized.includes('france')) return 'FR';
  if (normalized.includes('belgique')) return 'BE';
  if (normalized.includes('suisse')) return 'CH';
  if (normalized.includes('canada')) return 'CA';
  return pays.trim().slice(0, 2).toUpperCase() || 'FR';
};

function StatCard({ label, value }) {
  return <div className="bg-papier border border-bordeaux/15 p-4"><div className="font-ui text-[11px] uppercase tracking-[2px] text-bordeaux/55">{label}</div><strong className="font-heading text-3xl text-bordeaux">{value}</strong></div>;
}

export default function AdminReseauRelais() {
  const [relais, setRelais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setRelais(await base44.entities.PointRelais.list('-updated_date', 300));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateLinkedUser = async (r, data) => {
    const users = await base44.entities.User.filter({ email: r.gerant_email }, '-updated_date', 1);
    if (users[0]) await base44.entities.User.update(users[0].id, data);
  };

  const approve = async (r) => {
    const updated = await base44.entities.PointRelais.update(r.id, { actif: true, validation_admin: 'valide' });
    await updateLinkedUser(updated, { role: 'relais', relais_valide: true, relais_validation_status: 'valide', relais_valide_le: new Date().toISOString(), point_relais_id: updated.id });
    await load();
  };

  const reject = async (r) => {
    const updated = await base44.entities.PointRelais.update(r.id, { actif: false, validation_admin: 'rejete' });
    await updateLinkedUser(updated, { relais_valide: false, relais_validation_status: 'rejete', point_relais_id: '' });
    await load();
  };

  const createRelais = async (e) => {
    e.preventDefault();
    setMessage('');
    const payload = { ...form, pays_code: paysCode(form.pays_nom), actif: form.validation_admin === 'valide', stock_actuel: 0 };
    const created = await base44.entities.PointRelais.create(payload);
    if (payload.validation_admin === 'valide') await updateLinkedUser(created, { role: 'relais', relais_valide: true, relais_validation_status: 'valide', point_relais_id: created.id });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setMessage('Point relais créé avec succès.');
    await load();
  };

  const visibleRelais = useMemo(() => relais.filter(r => filter === 'all' || (filter === 'actif' ? r.actif && r.validation_admin === 'valide' : r.validation_admin === filter)), [relais, filter]);
  const totalStock = relais.reduce((sum, r) => sum + (r.stock_actuel || 0), 0);

  if (loading) return <div className="text-center py-8 text-bordeaux/55 italic">Chargement des points relais…</div>;

  return (
    <div className="grid gap-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3"><div><p className="font-ui text-[11px] tracking-[3px] uppercase text-bordeaux/60">Réseau Points Relais</p><h2 className="font-heading text-3xl text-bordeaux">Suivi & création</h2></div><button onClick={() => setShowForm(v => !v)} className="min-h-[44px] bg-cta text-cta-foreground px-5 font-ui text-[12px] tracking-[2px] uppercase">{showForm ? 'Fermer' : '+ Créer un point relais'}</button></div>
      <div className="grid sm:grid-cols-4 gap-3"><StatCard label="Actifs" value={relais.filter(r => r.actif && r.validation_admin === 'valide').length} /><StatCard label="En attente" value={relais.filter(r => r.validation_admin === 'en_attente').length} /><StatCard label="Refusés" value={relais.filter(r => r.validation_admin === 'rejete').length} /><StatCard label="Stock total" value={totalStock} /></div>
      {message && <div className="bg-green-50 border border-green-700 text-green-800 p-3 text-sm">{message}</div>}
      {showForm && <form onSubmit={createRelais} className="bg-papier border border-bordeaux/20 p-4 grid md:grid-cols-2 gap-3">{[['nom','Nom du commerce'],['identifiant_connexion','Identifiant relais'],['gerant_email','Email gérant'],['adresse','Adresse'],['ville','Ville'],['pays_nom','Pays'],['telephone','Téléphone'],['horaires','Horaires']].map(([field,label]) => <label key={field} className="font-ui text-[11px] uppercase tracking-[1.5px] text-bordeaux/65">{label}<input required value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} className="mt-1 w-full min-h-[44px] bg-creme border border-bordeaux/20 px-3 text-sm text-bordeaux normal-case tracking-normal" /></label>)}<label className="font-ui text-[11px] uppercase tracking-[1.5px] text-bordeaux/65">Type<select value={form.type_commerce} onChange={e => setForm({ ...form, type_commerce: e.target.value })} className="mt-1 w-full min-h-[44px] bg-creme border border-bordeaux/20 px-3 text-sm text-bordeaux">{TYPES_COMMERCE.map(t => <option key={t}>{t}</option>)}</select></label><label className="font-ui text-[11px] uppercase tracking-[1.5px] text-bordeaux/65">Statut<select value={form.validation_admin} onChange={e => setForm({ ...form, validation_admin: e.target.value })} className="mt-1 w-full min-h-[44px] bg-creme border border-bordeaux/20 px-3 text-sm text-bordeaux"><option value="valide">Actif validé</option><option value="en_attente">En attente</option></select></label><button className="md:col-span-2 min-h-[44px] bg-cta text-cta-foreground px-5 font-ui text-[12px] tracking-[2px] uppercase">Créer le point relais</button></form>}
      <div className="flex gap-2 overflow-x-auto">{[['all','Tous'],['actif','Actifs'],['en_attente','En attente'],['rejete','Refusés']].map(([id,label]) => <button key={id} onClick={() => setFilter(id)} className={`min-h-[44px] px-4 font-ui text-[11px] tracking-[1.5px] uppercase border ${filter === id ? 'bg-bordeaux text-creme border-bordeaux' : 'bg-papier text-bordeaux border-bordeaux/20'}`}>{label}</button>)}</div>
      <div className="bg-papier border border-bordeaux/20 overflow-x-auto"><table className="w-full text-sm"><thead className="font-ui text-[11px] uppercase tracking-[1.5px] text-bordeaux/55"><tr><th className="text-left p-3">Commerce</th><th className="text-left p-3">Localisation</th><th className="text-left p-3">Contact</th><th className="text-left p-3">Statut</th><th className="text-right p-3">Actions</th></tr></thead><tbody>{visibleRelais.map(r => <tr key={r.id} className="border-t border-bordeaux/10"><td className="p-3 text-bordeaux font-medium">{r.nom}<div className="text-xs text-bordeaux/50">{r.identifiant_connexion || 'Sans identifiant'}</div></td><td className="p-3 text-bordeaux/65">{r.ville || '—'} · {r.pays_nom || r.pays_code || '—'}</td><td className="p-3 text-bordeaux/65">{r.gerant_email}<div className="text-xs">{r.telephone || '—'}</div></td><td className="p-3"><span className={`px-3 py-1 rounded-full text-xs ${r.actif && r.validation_admin === 'valide' ? 'bg-green-100 text-green-800' : r.validation_admin === 'rejete' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{r.actif && r.validation_admin === 'valide' ? 'Actif' : r.validation_admin === 'rejete' ? 'Refusé' : 'En attente'}</span></td><td className="p-3 text-right"><div className="flex flex-col items-end gap-2"><RelaisFinalisationActions relais={r} /><div className="flex justify-end gap-2">{r.validation_admin !== 'valide' && <button onClick={() => approve(r)} className="bg-cta text-cta-foreground px-3 py-2 text-xs">Valider</button>}{r.validation_admin !== 'rejete' && <button onClick={() => reject(r)} className="border border-bordeaux text-bordeaux px-3 py-2 text-xs">Refuser</button>}</div></div></td></tr>)}{visibleRelais.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-bordeaux/50 italic">Aucun point relais dans cette catégorie.</td></tr>}</tbody></table></div>
    </div>
  );
}