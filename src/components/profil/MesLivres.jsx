import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { base44 } from '@/api/base44Client';
import NotationVoyageur from './NotationVoyageur';
import { useLang } from '@/lib/LangContext';

const STATUT_META = {
  en_attente_paiement: { key: 'statut_en_attente_paiement', color: '#8B6914', bg: 'rgba(139,105,20,0.1)', emoji: '⏳', dot: '#8B6914' },
  payee:               { key: 'statut_payee',               color: '#1a3a5c', bg: 'rgba(26,58,92,0.08)',   emoji: '✅', dot: '#1a3a5c' },
  en_transit:          { key: 'statut_en_transit',           color: '#2a5ca8', bg: 'rgba(42,92,168,0.1)',  emoji: '✈️', dot: '#2a5ca8' },
  au_relais:           { key: 'statut_au_relais',            color: '#8B6914', bg: 'rgba(139,105,20,0.14)', emoji: '📦', dot: '#c47f00' },
  livree:              { key: 'statut_livree',               color: '#2d6a2d', bg: 'rgba(45,106,45,0.1)',  emoji: '🎉', dot: '#2d6a2d' },
  litige:              { key: 'statut_litige',               color: '#b41414', bg: 'rgba(180,20,20,0.08)', emoji: '⚠️', dot: '#b41414' },
};

const TIMELINE = ['en_attente_paiement', 'payee', 'en_transit', 'au_relais', 'livree'];

function TimelineDots({ statut }) {
  const { t } = useLang();
  const idx = TIMELINE.indexOf(statut);
  if (idx === -1) return null;
  const labels = [t('timeline_commande'), t('timeline_paye'), t('timeline_transit'), t('timeline_relais'), t('timeline_recu')];
  return (
    <div className="mt-4 flex items-center gap-0">
      {TIMELINE.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        const cfg = STATUT_META[s];
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div style={{ width: active ? 12 : 8, height: active ? 12 : 8, borderRadius: '50%', background: done ? 'var(--bordeaux)' : active ? cfg.dot : 'rgba(26,16,8,0.12)', border: active ? `2px solid ${cfg.dot}` : 'none', boxShadow: active ? `0 0 0 3px ${cfg.dot}22` : 'none', flexShrink: 0 }} />
              <div className="mt-1 whitespace-nowrap font-ui text-[7px]" style={{ color: done || active ? (active ? cfg.dot : 'var(--bordeaux)') : 'rgba(26,16,8,0.25)', fontWeight: active ? 800 : 500 }}>
                {labels[i]}
              </div>
            </div>
            {i < TIMELINE.length - 1 && <div className="mb-[18px] h-px min-w-2 flex-1" style={{ background: i < idx ? 'var(--bordeaux)' : 'rgba(26,16,8,0.1)' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SecureDisplay({ commande }) {
  if (commande.statut !== 'au_relais' || (!commande.qr_code_token && !commande.visuel_bordero_url)) return null;
  return (
    <div className="mt-3 border p-3" style={{ background: 'rgba(110,30,46,0.05)', borderColor: 'rgba(110,30,46,0.24)' }}>
      <div className="mb-2 font-ui text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#6E1E2E]">QR Bordero existant</div>
      {commande.visuel_bordero_url && <img src={commande.visuel_bordero_url} alt={`Visuel Bordero ${commande.visuel_bordero_serie || ''}`} className="mb-3 w-full border object-cover" style={{ borderColor: 'rgba(59,42,35,0.22)' }} />}
      {commande.qr_code_token && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white p-2"><QRCodeSVG value={commande.qr_code_token} size={112} bgColor="#ffffff" fgColor="#1E1A18" level="M" /></div>
          <div className="min-w-0 flex-1">
            <div className="font-heading text-[16px] font-bold text-[#6E1E2E]">Présentez ce QR au point relais</div>
            <div className="mt-1 break-all font-ui text-[9px] text-[#3B2A23]/48">{commande.visuel_bordero_serie || 'Visuel'} · {commande.id}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function CommandeCard({ commande }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUT_META[commande.statut] || STATUT_META.en_attente_paiement;
  const coverTone = commande.statut === 'livree' ? '#2d6a2d' : commande.statut === 'au_relais' ? '#8B6914' : commande.statut === 'litige' ? '#b41414' : '#6E1E2E';

  return (
    <article className="mb-3 overflow-hidden border" style={{ background: '#FFF8EA', borderColor: 'rgba(110,30,46,0.16)', boxShadow: '0 12px 26px rgba(59,42,35,0.10)' }}>
      <button type="button" onClick={() => setExpanded(v => !v)} className="flex w-full gap-3 p-3 text-left sm:p-4">
        <div className="flex h-24 w-16 shrink-0 flex-col justify-between p-2 text-[#F3E8D2]" style={{ background: coverTone, boxShadow: '0 10px 20px rgba(59,42,35,0.16)' }}>
          <span className="font-ui text-[7px] uppercase tracking-[0.18em] opacity-70">B</span>
          <span className="font-heading text-[12px] font-bold leading-tight line-clamp-3">{commande.livre_titre || 'Livre'}</span>
          <span className="h-px w-7 bg-[#C7A15A]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-heading text-[18px] font-bold leading-tight text-[#6E1E2E] line-clamp-2">{commande.livre_titre || '—'}</div>
              {commande.livre_auteur && <div className="mt-1 font-body text-[14px] italic text-[#3B2A23]/58 line-clamp-1">{commande.livre_auteur}</div>}
            </div>
            <div className="shrink-0 text-right">
              {commande.montant_paye > 0 && <div className="font-heading text-[16px] font-bold text-[#6E1E2E]">{commande.montant_paye.toFixed(2)} €</div>}
              <div className="mt-1 font-ui text-[8px] uppercase tracking-[0.12em] text-[#3B2A23]/38">{expanded ? t('livre_fermer') : t('livre_details')}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 font-ui text-[9px] font-bold uppercase tracking-[0.12em]" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color }}>{cfg.emoji} {t(cfg.key)}</span>
            {commande.zone_nom && <span className="rounded-full border border-[#6E1E2E]/18 px-2 py-1 font-ui text-[9px] uppercase tracking-[0.12em] text-[#3B2A23]/55">📍 {commande.zone_nom}</span>}
            {commande.mode_livraison && <span className="rounded-full border border-[#6E1E2E]/18 px-2 py-1 font-ui text-[9px] uppercase tracking-[0.12em] text-[#3B2A23]/55">{commande.mode_livraison === 'express' ? '✈ Express' : '📦 Collectif'}</span>}
          </div>
          <TimelineDots statut={commande.statut} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-dashed p-4" style={{ borderColor: 'rgba(110,30,46,0.16)', background: 'rgba(243,232,210,0.46)' }}>
          {[
            [t('livre_date_commande'), commande.created_date ? new Date(commande.created_date).toLocaleDateString('fr-FR') : null],
            [t('livre_arrivee_relais'), commande.date_arrivee_relais ? new Date(commande.date_arrivee_relais).toLocaleDateString('fr-FR') : null],
            [t('livre_retirer_avant'), commande.date_limite_collecte ? new Date(commande.date_limite_collecte).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : null],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={label} className="mb-2 flex justify-between gap-4">
              <span className="font-ui text-[9px] uppercase tracking-[0.12em] text-[#3B2A23]/46">{label}</span>
              <span className="text-right font-body text-[13px] text-[#1E1A18]">{val}</span>
            </div>
          ))}

          {commande.statut === 'au_relais' && commande.code_secret && (
            <div className="mt-3 border-2 border-dashed p-3 text-center" style={{ background: `${cfg.color}0d`, borderColor: cfg.color }}>
              <div className="mb-1 font-ui text-[8px] uppercase tracking-[0.22em]" style={{ color: cfg.color }}>{t('livre_code_retrait')}</div>
              <div className="font-heading text-4xl font-bold tracking-[0.22em]" style={{ color: cfg.color }}>{commande.code_secret}</div>
              <div className="mt-1 font-body text-[12px] italic text-[#3B2A23]/50">{t('livre_code_desc')}</div>
            </div>
          )}

          <SecureDisplay commande={commande} />

          {commande.penalite_retard > 0 && (
            <div className="mt-3 border p-2 font-ui text-[9px] uppercase tracking-[0.12em] text-[#b41414]" style={{ background: 'rgba(180,20,20,0.05)', borderColor: 'rgba(180,20,20,0.3)' }}>
              {t('livre_penalite', { n: commande.penalite_retard.toFixed(2) })}
            </div>
          )}

          {commande.statut === 'livree' && commande.voyageur_email && <div className="mt-4"><NotationVoyageur commande={commande} /></div>}
        </div>
      )}
    </article>
  );
}

function SectionHeader({ children, color = '#6E1E2E' }) {
  return (
    <div className="mb-3 mt-5 flex items-center gap-3 first:mt-0">
      <div className="font-ui text-[10px] font-extrabold uppercase tracking-[0.24em]" style={{ color }}>{children}</div>
      <span className="h-px flex-1" style={{ background: `${color}33` }} />
    </div>
  );
}

export default function MesLivres({ userEmail }) {
  const { t } = useLang();
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setCommandes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    base44.entities.Commande.filter({ lecteur_email: userEmail }, '-created_date', 100)
      .then(data => { setCommandes(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userEmail]);

  if (loading) {
    return <div className="bordero-empty-state font-body italic">{t('livre_chargement')}</div>;
  }

  const enCours = commandes.filter(c => c.statut !== 'livree' && c.statut !== 'litige');
  const recus = commandes.filter(c => c.statut === 'livree');
  const litiges = commandes.filter(c => c.statut === 'litige');

  if (commandes.length === 0) {
    return (
      <div className="border p-8 text-center" style={{ background: 'linear-gradient(145deg, #FFF8EA, #F7EEDC)', borderColor: 'rgba(110,30,46,0.16)' }}>
        <div className="mx-auto mb-3 flex h-16 w-12 items-center justify-center" style={{ background: '#6E1E2E', color: '#F3E8D2' }}>B</div>
        <div className="font-heading text-xl font-bold text-[#6E1E2E]">{t('livre_aucune')}</div>
        <div className="mx-auto mt-2 max-w-xs font-body text-[14px] italic text-[#3B2A23]/56">{t('livre_aucune_desc')}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { val: enCours.length, label: t('livre_en_cours_stat'), color: '#2a5ca8' },
          { val: recus.length, label: t('livre_recus_stat'), color: '#2d6a2d' },
          { val: commandes.length, label: t('livre_total'), color: '#6E1E2E' },
        ].map(({ val, label, color }) => (
          <div key={label} className="border p-3 text-center" style={{ background: '#FFF8EA', borderColor: 'rgba(110,30,46,0.14)' }}>
            <div className="font-heading text-2xl font-bold" style={{ color }}>{val}</div>
            <div className="mt-1 font-ui text-[8px] uppercase tracking-[0.14em] text-[#3B2A23]/46">{label}</div>
          </div>
        ))}
      </div>

      {enCours.length > 0 && <><SectionHeader color="#2a5ca8">{t('livre_en_cours')}</SectionHeader>{enCours.map(c => <CommandeCard key={c.id} commande={c} />)}</>}
      {litiges.length > 0 && <><SectionHeader color="#b41414">{t('livre_litiges')}</SectionHeader>{litiges.map(c => <CommandeCard key={c.id} commande={c} />)}</>}
      {recus.length > 0 && <><SectionHeader color="#2d6a2d">{t('livre_recus')}</SectionHeader>{recus.map(c => <CommandeCard key={c.id} commande={c} />)}</>}
    </div>
  );
}