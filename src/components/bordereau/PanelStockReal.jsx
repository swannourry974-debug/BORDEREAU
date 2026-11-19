import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ProfilsTableau from '../relais/ProfilsTableau';
import NotationRelais from '../relais/NotationRelais';

const joursEnStock = (commande) => {
  const dateReference = commande.date_arrivee_relais || commande.updated_date || commande.created_date;
  if (!dateReference) return 0;
  return Math.floor((Date.now() - new Date(dateReference).getTime()) / (1000 * 60 * 60 * 24));
};

function RelayStat({ value, label, color }) {
  return (
    <div className="border bg-[#FFF8EA]/76 p-3 text-center" style={{ borderColor: `${color}33` }}>
      <div className="font-heading text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="mt-1 font-ui text-[8px] font-extrabold uppercase tracking-[0.16em] text-[#3B2A23]/45">{label}</div>
    </div>
  );
}

function RelayOrderRow({ commande, tone, statusLabel, extra }) {
  return (
    <article className="mb-3 flex items-center gap-3 border bg-[#FFF8EA]/88 p-3 shadow-[0_10px_22px_rgba(59,42,35,0.08)]" style={{ borderColor: `${tone}33`, borderLeft: `5px solid ${tone}` }}>
      <div className="h-3 w-3 shrink-0 rounded-full" style={{ background: tone }} />
      <div className="min-w-0 flex-1">
        <h3 className="font-heading text-[17px] font-bold leading-tight text-[#6E1E2E]">{commande.livre_titre || 'Livre'}</h3>
        <p className="mt-1 font-ui text-[10px] uppercase tracking-[0.11em] text-[#3B2A23]/48">{commande.livre_auteur || 'Auteur non renseigné'} · Lecteur : {commande.lecteur_email?.split('@')[0] || '—'}</p>
        {extra && <div className="mt-2 font-ui text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: tone }}>{extra}</div>}
      </div>
      <span className="shrink-0 rounded-full border px-2 py-1 font-ui text-[8px] font-extrabold uppercase tracking-[0.12em]" style={{ color: tone, borderColor: `${tone}66`, background: `${tone}10` }}>{statusLabel}</span>
    </article>
  );
}

export default function PanelStock() {
  const [view, setView] = useState('stock');
  const [stockFilter, setStockFilter] = useState('all');
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relais, setRelais] = useState(null);
  const [user, setUser] = useState(null);
  const [stockCount, setStockCount] = useState(0);
  const [relayActive, setRelayActive] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState('idle');

  const load = async () => {
    setLoading(true);
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (!u) { setLoading(false); return; }
      const r = await base44.entities.PointRelais.filter({ gerant_email: u.email });
      setRelais(r[0] || null);
      setRelayActive(r[0]?.actif !== false);

      let cmds = [];
      if (r[0]) {
        cmds = await base44.entities.Commande.filter({ point_relais_id: r[0].id }, '-created_date', 100);
      } else {
        cmds = await base44.entities.Commande.list('-created_date', 100);
      }
      setCommandes(cmds || []);
      setStockCount(r[0]?.stock_actuel ?? (cmds || []).filter(c => c.statut === 'au_relais').length);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStockCount = async (nextValue) => {
    const previous = stockCount;
    const previousRelais = relais;
    const next = Math.max(0, nextValue);
    setStockCount(next);
    try {
      const res = await base44.functions.invoke('updateRelayInventory', { stock_actuel: next, actif: relayActive });
      if (res?.data?.relais) setRelais(res.data.relais);
    } catch (error) {
      setStockCount(previous);
      setRelais(previousRelais);
      throw error;
    }
  };

  const toggleRelayActive = async () => {
    const previous = relayActive;
    const previousRelais = relais;
    const next = !relayActive;
    setRelayActive(next);
    try {
      const res = await base44.functions.invoke('updateRelayInventory', { stock_actuel: stockCount, actif: next });
      if (res?.data?.relais) setRelais(res.data.relais);
    } catch (error) {
      setRelayActive(previous);
      setRelais(previousRelais);
      throw error;
    }
  };

  const notifyInventoryChange = async () => {
    if (!user?.email) return;
    setNotificationStatus('sending');
    try {
      const res = await base44.functions.invoke('updateRelayInventory', { stock_actuel: stockCount, actif: relayActive, notify: true });
      if (res?.data?.relais) setRelais(res.data.relais);
      setNotificationStatus('sent');
    } catch (e) {
      setNotificationStatus('error');
    }
  };

  const auRelais = commandes.filter(c => c.statut === 'au_relais');
  const colisStagnants = auRelais.filter(c => joursEnStock(c) > 3);
  const stockAffiche = stockFilter === 'stagnants' ? colisStagnants : auRelais;
  const enTransit = commandes.filter(c => c.statut === 'en_transit');
  const livrees = commandes.filter(c => c.statut === 'livree');

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden bordero-card-premium p-5 sm:p-6">
        <div className="pointer-events-none absolute right-5 top-5 font-heading text-7xl text-[#6E1E2E]/5">⬡</div>
        <div className="bordero-heading-section">Comptoir Point Relais</div>
        <h1 className="mt-2 font-heading text-3xl font-bold text-[#6E1E2E] sm:text-4xl">Gestion du stock</h1>
        <p className="mt-2 font-body text-[16px] italic text-[#3B2A23]/64">{auRelais.length} colis en attente · Stock : {stockCount} · Relais {relayActive ? 'actif' : 'inactif'}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <RelayStat value={auRelais.length} label="Au relais" color="#8B6914" />
          <RelayStat value={enTransit.length} label="En transit" color="#1a3a5c" />
          <RelayStat value={livrees.length} label="Livrés" color="#2d6a2d" />
        </div>
      </section>

      <section className="bordero-surface p-4">
        <div className="bordero-heading-section mb-3">Statut & inventaire relais</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={toggleRelayActive} aria-label={relayActive ? 'Désactiver le relais' : 'Activer le relais'} className="min-h-[44px] bg-[#6E1E2E] px-4 font-ui text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#F3E8D2]">
            {relayActive ? '✓ Relais actif — désactiver' : '⏸ Relais inactif — activer'}
          </button>
          <button type="button" aria-label="Notifier les changements d'inventaire" onClick={notifyInventoryChange} disabled={notificationStatus === 'sending'} className="min-h-[44px] border border-[#6E1E2E]/25 bg-[#FFF8EA] px-4 font-ui text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#6E1E2E] disabled:cursor-wait disabled:opacity-60">
            {notificationStatus === 'sending' ? 'Envoi...' : notificationStatus === 'sent' ? '✓ Inventaire notifié' : 'Notifier inventaire'}
          </button>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <label htmlFor="stock-quantity" className="flex-1">
            <span className="block font-ui text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#3B2A23]/46">Quantité de stock</span>
            <input id="stock-quantity" aria-label="Quantité de stock" type="number" min="0" value={stockCount} onChange={(e) => updateStockCount(Number(e.target.value) || 0)} className="mt-2 w-28 border border-[#6E1E2E]/35 bg-[#FFF8EA] px-3 py-2 font-heading text-2xl font-bold text-[#6E1E2E]" />
          </label>
          <div className="flex gap-2">
            <button type="button" aria-label="Réduire le stock" onClick={() => updateStockCount(stockCount - 1)} className="h-11 w-11 border border-[#6E1E2E] bg-[#FFF8EA] text-2xl text-[#6E1E2E]">−</button>
            <button type="button" aria-label="Augmenter le stock" onClick={() => updateStockCount(stockCount + 1)} className="h-11 w-11 bg-[#6E1E2E] text-2xl text-[#F3E8D2]">+</button>
          </div>
        </div>
        {notificationStatus === 'error' && <div className="mt-3 font-body text-sm italic text-[#b41414]">Notification impossible pour le moment.</div>}
      </section>

      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { id: 'stock', icon: '📦', label: 'Colis au relais' },
          { id: 'transit', icon: '🚚', label: 'En transit' },
          { id: 'notation', icon: '★', label: 'Notation' },
          { id: 'profils', icon: '📊', label: 'Profils' },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} className={`min-h-[44px] border px-3 font-ui text-[10px] font-extrabold uppercase tracking-[0.14em] ${view === v.id ? 'border-[#6E1E2E] bg-[#6E1E2E] text-[#F3E8D2]' : 'border-[#6E1E2E]/20 bg-[#FFF8EA] text-[#6E1E2E]'}`}>
            {v.icon} {v.label}
          </button>
        ))}
      </nav>

      {loading ? <div className="bordero-empty-state font-body italic">Chargement du comptoir…</div> : (
        <>
          {view === 'stock' && (
            <section className="bordero-surface p-4">
              <div className="mb-3 flex items-center gap-3"><div className="bordero-heading-section">Colis au relais ({auRelais.length})</div><span className="h-px flex-1 bg-[#6E1E2E]/18" /></div>
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setStockFilter('all')} className={`min-h-[40px] border font-ui text-[9px] font-extrabold uppercase tracking-[0.14em] ${stockFilter === 'all' ? 'border-[#6E1E2E] bg-[#6E1E2E] text-[#F3E8D2]' : 'border-[#6E1E2E]/20 bg-[#FFF8EA] text-[#6E1E2E]'}`}>Tous ({auRelais.length})</button>
                <button type="button" onClick={() => setStockFilter('stagnants')} className={`min-h-[40px] border font-ui text-[9px] font-extrabold uppercase tracking-[0.14em] ${stockFilter === 'stagnants' ? 'border-[#b41414] bg-[#b41414] text-white' : 'border-[#b41414]/30 bg-[#FFF8EA] text-[#b41414]'}`}>+3 jours ({colisStagnants.length})</button>
              </div>
              {stockAffiche.length === 0 ? <div className="bordero-empty-state py-7 font-body italic">{stockFilter === 'stagnants' ? 'Aucun colis ne stagne depuis plus de trois jours.' : 'Aucun colis au relais pour le moment.'}</div> : stockAffiche.map(c => <RelayOrderRow key={c.id} commande={c} tone={joursEnStock(c) > 3 ? '#b41414' : '#8B6914'} statusLabel={joursEnStock(c) > 3 ? 'À relancer' : 'À remettre'} extra={joursEnStock(c) > 3 ? `${joursEnStock(c)} jours au relais · Voyageur : ${c.voyageur_email?.split('@')[0] || '—'}` : null} />)}
              {livrees.length > 0 && <div className="mt-5"><div className="mb-3 bordero-heading-section text-[#2d6a2d]">Livrés récemment ({livrees.length})</div>{livrees.slice(0, 5).map(c => <RelayOrderRow key={c.id} commande={c} tone="#2d6a2d" statusLabel="Livré" />)}</div>}
            </section>
          )}

          {view === 'transit' && (
            <section className="bordero-surface p-4">
              <div className="mb-3 bordero-heading-section text-[#1a3a5c]">En transit vers votre relais ({enTransit.length})</div>
              {enTransit.length === 0 ? <div className="bordero-empty-state py-7 font-body italic">Aucun livre en transit pour le moment.</div> : enTransit.map(c => <RelayOrderRow key={c.id} commande={c} tone="#1a3a5c" statusLabel="En vol" extra={`Voyageur : ${c.voyageur_email?.split('@')[0] || '—'} · Mode : ${c.mode_livraison}`} />)}
            </section>
          )}

          {view === 'notation' && <NotationRelais commandes={commandes} relaisEmail={user?.email} />}
          {view === 'profils' && <ProfilsTableau />}
        </>
      )}
    </div>
  );
}