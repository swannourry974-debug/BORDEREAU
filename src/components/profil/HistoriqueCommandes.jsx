import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const STATUT_CONFIG = {
  en_attente_paiement: { label: 'Paiement en attente', color: '#8B6914', bg: 'rgba(139,105,20,0.08)', emoji: '⏳' },
  payee:               { label: 'Payé',                color: '#1a3a5c', bg: 'rgba(26,58,92,0.08)',   emoji: '✅' },
  en_transit:          { label: 'En transit',          color: '#1a3a5c', bg: 'rgba(26,58,92,0.1)',    emoji: '✈️' },
  au_relais:           { label: 'Au relais',           color: '#8B6914', bg: 'rgba(139,105,20,0.12)', emoji: '📦' },
  livree:              { label: 'Livré ✓',             color: '#2d6a2d', bg: 'rgba(45,106,45,0.1)',   emoji: '🎉' },
  litige:              { label: 'Litige',              color: '#b41414', bg: 'rgba(180,20,20,0.08)',  emoji: '⚠️' },
};

const TIMELINE_STEPS = [
  { key: 'en_attente_paiement', label: 'Commandé' },
  { key: 'payee',               label: 'Payé' },
  { key: 'en_transit',          label: 'En transit' },
  { key: 'au_relais',           label: 'Au relais' },
  { key: 'livree',              label: 'Livré' },
];

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG.en_attente_paiement;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}`,
      padding: '3px 10px', fontSize: 9,
      fontFamily: 'Special Elite, monospace', letterSpacing: 1.5,
      textTransform: 'uppercase',
    }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

function TimelineBar({ statut }) {
  const currentIdx = TIMELINE_STEPS.findIndex(s => s.key === statut);
  if (statut === 'litige') return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 10, marginBottom: 4 }}>
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 0,
            }}>
              <div style={{
                width: active ? 10 : 7, height: active ? 10 : 7,
                borderRadius: '50%',
                background: done ? 'var(--bordeaux)' : 'rgba(26,16,8,0.15)',
                border: active ? '2px solid var(--bordeaux)' : 'none',
                boxShadow: active ? '0 0 0 3px rgba(128,0,32,0.15)' : 'none',
                transition: 'all 0.2s',
                flexShrink: 0,
              }} />
              <div style={{
                fontFamily: 'Special Elite, monospace', fontSize: 7,
                letterSpacing: 0.5, color: done ? 'var(--bordeaux)' : 'rgba(26,16,8,0.3)',
                marginTop: 4, whiteSpace: 'nowrap',
                fontWeight: active ? 'bold' : 'normal',
              }}>
                {step.label}
              </div>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 1.5, minWidth: 8,
                background: i < currentIdx ? 'var(--bordeaux)' : 'rgba(26,16,8,0.12)',
                marginBottom: 18,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function CommandeCard({ commande }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUT_CONFIG[commande.statut] || STATUT_CONFIG.en_attente_paiement;

  return (
    <div style={{
      background: 'var(--papier)', border: '1.5px solid rgba(26,16,8,0.18)',
      marginBottom: 10, boxShadow: '2px 2px 0 rgba(26,16,8,0.07)',
      overflow: 'hidden',
    }}>
      {/* Barre de statut colorée */}
      <div style={{ height: 3, background: cfg.color, opacity: 0.7 }} />

      <div
        onClick={() => setExpanded(v => !v)}
        style={{ padding: '14px 16px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 15,
              color: 'var(--encre)', marginBottom: 3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {commande.livre_titre || '—'}
            </div>
            {commande.livre_auteur && (
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.55)', marginBottom: 6 }}>
                {commande.livre_auteur}
              </div>
            )}
            <StatutBadge statut={commande.statut} />
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {commande.montant_paye && (
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700, color: 'var(--bordeaux)' }}>
                {commande.montant_paye.toFixed(2)} €
              </div>
            )}
            <div style={{
              fontFamily: 'Special Elite, monospace', fontSize: 8,
              color: 'rgba(26,16,8,0.35)', letterSpacing: 1,
              marginTop: 2, textAlign: 'right',
            }}>
              {expanded ? '▲ Fermer' : '▼ Détails'}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <TimelineBar statut={commande.statut} />
      </div>

      {expanded && (
        <div style={{
          borderTop: '1px dashed rgba(26,16,8,0.15)',
          padding: '12px 16px',
          background: 'rgba(26,16,8,0.02)',
        }}>
          {[
            ['Zone destination', commande.zone_nom],
            ['Format', commande.livre_type],
            ['Mode livraison', commande.mode_livraison === 'express' ? '✈ Express' : '📦 Collectif'],
            ['Date commande', commande.created_date ? new Date(commande.created_date).toLocaleDateString('fr-FR') : null],
            ['Arrivée au relais', commande.date_arrivee_relais ? new Date(commande.date_arrivee_relais).toLocaleDateString('fr-FR') : null],
            ['Date limite collecte', commande.date_limite_collecte ? new Date(commande.date_limite_collecte).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : null],
          ].filter(([, val]) => val).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1, color: 'rgba(26,16,8,0.45)', textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontFamily: 'IM Fell English, serif', fontSize: 12, color: 'var(--encre)' }}>{val}</span>
            </div>
          ))}

          {commande.statut === 'au_relais' && commande.code_secret && (
            <div style={{
              marginTop: 10, padding: '10px 14px', background: 'rgba(128,0,32,0.06)',
              border: '1.5px dashed var(--bordeaux)', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 2, color: 'var(--bordeaux)', marginBottom: 6, textTransform: 'uppercase' }}>
                Code de retrait
              </div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: 'var(--bordeaux)', letterSpacing: 6 }}>
                {commande.code_secret}
              </div>
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.5)', marginTop: 4 }}>
                À présenter au point relais pour récupérer votre livre
              </div>
            </div>
          )}

          {commande.penalite_retard > 0 && (
            <div style={{
              marginTop: 10, padding: '8px 12px', background: 'rgba(180,20,20,0.06)',
              border: '1px solid rgba(180,20,20,0.3)',
              fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1,
              color: '#b41414', textTransform: 'uppercase',
            }}>
              ⚠️ Pénalité de retard : {commande.penalite_retard.toFixed(2)} €
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoriqueCommandes({ userEmail }) {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('tous');

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.Commande.filter({ lecteur_email: userEmail }, '-created_date', 100)
      .then(data => { setCommandes(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userEmail]);

  const filtres = [
    { key: 'tous', label: 'Tous' },
    { key: 'en_cours', label: 'En cours' },
    { key: 'livree', label: 'Reçus' },
  ];

  const commandesFiltrees = commandes.filter(c => {
    if (filtre === 'tous') return true;
    if (filtre === 'livree') return c.statut === 'livree';
    if (filtre === 'en_cours') return c.statut !== 'livree';
    return true;
  });

  const enCours = commandes.filter(c => c.statut !== 'livree').length;
  const recus = commandes.filter(c => c.statut === 'livree').length;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 20, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.4)' }}>
        Chargement de l'historique…
      </div>
    );
  }

  return (
    <div>
      {/* Stats rapides */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { val: commandes.length, label: 'Total' },
          { val: enCours, label: 'En cours' },
          { val: recus, label: 'Reçus' },
        ].map(({ val, label }) => (
          <div key={label} style={{
            flex: 1, textAlign: 'center', padding: '12px 8px',
            background: 'var(--papier)', border: '1px dashed rgba(26,16,8,0.2)',
          }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: 'var(--bordeaux)' }}>{val}</div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(26,16,8,0.45)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {filtres.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltre(f.key)}
            style={{
              padding: '6px 14px', cursor: 'pointer',
              fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
              background: filtre === f.key ? 'var(--bordeaux)' : 'transparent',
              color: filtre === f.key ? 'var(--creme)' : 'rgba(26,16,8,0.5)',
              border: filtre === f.key ? 'none' : '1px dashed rgba(26,16,8,0.25)',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {commandes.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '28px 20px',
          background: 'var(--papier)', border: '1.5px dashed rgba(26,16,8,0.18)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📚</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Aucune commande</div>
          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.45)' }}>
            Vos commandes de livres apparaîtront ici
          </div>
        </div>
      ) : (
        <>
          {commandesFiltrees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.4)' }}>
              Aucune commande dans cette catégorie.
            </div>
          ) : (
            commandesFiltrees.map(c => <CommandeCard key={c.id} commande={c} />)
          )}
        </>
      )}
    </div>
  );
}