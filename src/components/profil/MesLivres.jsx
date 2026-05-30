import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import NotationVoyageur from './NotationVoyageur';

const STATUT_CONFIG = {
  en_attente_paiement: { label: 'Paiement en attente', color: '#8B6914', bg: 'rgba(139,105,20,0.1)', emoji: '⏳', dot: '#8B6914' },
  payee:               { label: 'Payée — préparation', color: '#1a3a5c', bg: 'rgba(26,58,92,0.08)',   emoji: '✅', dot: '#1a3a5c' },
  en_transit:          { label: 'En transit ✈',         color: '#2a5ca8', bg: 'rgba(42,92,168,0.1)',  emoji: '✈️', dot: '#2a5ca8' },
  au_relais:           { label: 'Au relais — à retirer', color: '#8B6914', bg: 'rgba(139,105,20,0.14)', emoji: '📦', dot: '#c47f00' },
  livree:              { label: 'Reçu',                 color: '#2d6a2d', bg: 'rgba(45,106,45,0.1)',  emoji: '🎉', dot: '#2d6a2d' },
  litige:              { label: 'Litige',               color: '#b41414', bg: 'rgba(180,20,20,0.08)', emoji: '⚠️', dot: '#b41414' },
};

const TIMELINE = ['en_attente_paiement', 'payee', 'en_transit', 'au_relais', 'livree'];

function StatutPill({ statut }) {
  const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG.en_attente_paiement;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: cfg.bg, color: cfg.color,
      border: `1.5px solid ${cfg.color}`,
      padding: '5px 12px',
      fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase',
    }}>
      <span style={{ fontSize: 13 }}>{cfg.emoji}</span>
      {cfg.label}
    </div>
  );
}

function TimelineDots({ statut }) {
  const idx = TIMELINE.indexOf(statut);
  if (idx === -1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 12 }}>
      {TIMELINE.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        const cfg = STATUT_CONFIG[s];
        return (
          <React.Fragment key={s}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 0,
            }}>
              <div style={{
                width: active ? 12 : 8, height: active ? 12 : 8,
                borderRadius: '50%',
                background: done ? 'var(--bordeaux)' : active ? cfg.dot : 'rgba(26,16,8,0.12)',
                border: active ? `2px solid ${cfg.dot}` : 'none',
                boxShadow: active ? `0 0 0 3px ${cfg.dot}22` : 'none',
                flexShrink: 0, transition: 'all 0.2s',
              }} />
              <div style={{
                fontFamily: 'Special Elite, monospace', fontSize: 7,
                color: done || active ? (active ? cfg.dot : 'var(--bordeaux)') : 'rgba(26,16,8,0.25)',
                marginTop: 4, whiteSpace: 'nowrap',
                fontWeight: active ? 'bold' : 'normal',
              }}>
                {['Commandé', 'Payé', 'Transit', 'Relais', 'Reçu'][i]}
              </div>
            </div>
            {i < TIMELINE.length - 1 && (
              <div style={{
                flex: 1, height: 2, minWidth: 10,
                background: i < idx ? 'var(--bordeaux)' : 'rgba(26,16,8,0.1)',
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
      border: `2px solid ${cfg.color}`,
      marginBottom: 12, overflow: 'hidden',
      background: 'var(--papier)',
      boxShadow: `3px 3px 0 ${cfg.color}22`,
    }}>
      {/* Bande de couleur statut */}
      <div style={{ background: cfg.color, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
        <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--creme)' }}>
          {cfg.label}
        </span>
        {commande.statut === 'en_transit' && (
          <span style={{ marginLeft: 'auto', fontFamily: 'Special Elite, monospace', fontSize: 8, color: 'rgba(253,252,240,0.7)', letterSpacing: 1 }}>
            EN ROUTE →
          </span>
        )}
        {commande.statut === 'au_relais' && (
          <span style={{ marginLeft: 'auto', fontFamily: 'Special Elite, monospace', fontSize: 8, color: 'rgba(253,252,240,0.85)', letterSpacing: 1, fontWeight: 'bold' }}>
            À RETIRER !
          </span>
        )}
      </div>

      <div
        onClick={() => setExpanded(v => !v)}
        style={{ padding: '14px 16px', cursor: 'pointer' }}
      >
        {/* Titre + prix */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16, color: 'var(--encre)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2,
            }}>
              {commande.livre_titre || '—'}
            </div>
            {commande.livre_auteur && (
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.5)' }}>
                {commande.livre_auteur}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {commande.montant_paye > 0 && (
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700, color: 'var(--bordeaux)' }}>
                {commande.montant_paye.toFixed(2)} €
              </div>
            )}
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, color: 'rgba(26,16,8,0.3)', marginTop: 2 }}>
              {expanded ? '▲' : '▼ Détails'}
            </div>
          </div>
        </div>

        {/* Infos rapides */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {commande.zone_nom && (
            <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, color: 'rgba(26,16,8,0.45)', letterSpacing: 1 }}>
              📍 {commande.zone_nom}
            </span>
          )}
          {commande.livre_type && (
            <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, color: 'rgba(26,16,8,0.45)', letterSpacing: 1 }}>
              {commande.livre_type}
            </span>
          )}
          {commande.mode_livraison && (
            <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, color: 'rgba(26,16,8,0.45)', letterSpacing: 1 }}>
              {commande.mode_livraison === 'express' ? '✈ Express' : '📦 Collectif'}
            </span>
          )}
        </div>

        {/* Timeline */}
        <TimelineDots statut={commande.statut} />
      </div>

      {/* Détails expandables */}
      {expanded && (
        <div style={{
          borderTop: '1px dashed rgba(26,16,8,0.15)',
          padding: '12px 16px', background: 'rgba(26,16,8,0.02)',
        }}>
          {[
            ['Date commande', commande.created_date ? new Date(commande.created_date).toLocaleDateString('fr-FR') : null],
            ['Arrivée au relais', commande.date_arrivee_relais ? new Date(commande.date_arrivee_relais).toLocaleDateString('fr-FR') : null],
            ['À retirer avant', commande.date_limite_collecte ? new Date(commande.date_limite_collecte).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : null],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1, color: 'rgba(26,16,8,0.4)', textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontFamily: 'IM Fell English, serif', fontSize: 12, color: 'var(--encre)' }}>{val}</span>
            </div>
          ))}

          {/* Code de retrait si au relais */}
          {commande.statut === 'au_relais' && commande.code_secret && (
            <div style={{
              marginTop: 10, padding: '12px 14px', background: `${cfg.color}0d`,
              border: `2px dashed ${cfg.color}`, textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 2, color: cfg.color, marginBottom: 6, textTransform: 'uppercase' }}>
                Code de retrait
              </div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: cfg.color, letterSpacing: 8 }}>
                {commande.code_secret}
              </div>
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.45)', marginTop: 4 }}>
                À présenter au point relais
              </div>
            </div>
          )}

          {/* Pénalité */}
          {commande.penalite_retard > 0 && (
            <div style={{
              marginTop: 10, padding: '8px 12px', background: 'rgba(180,20,20,0.05)',
              border: '1px solid rgba(180,20,20,0.3)',
              fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1,
              color: '#b41414', textTransform: 'uppercase',
            }}>
              ⚠️ Pénalité de retard : {commande.penalite_retard.toFixed(2)} €
            </div>
          )}

          {/* Notation voyageur */}
          {commande.statut === 'livree' && commande.voyageur_email && (
            <div style={{ marginTop: 14 }}>
              <NotationVoyageur commande={commande} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MesLivres({ userEmail }) {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.Commande.filter({ lecteur_email: userEmail }, '-created_date', 100)
      .then(data => { setCommandes(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userEmail]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.4)' }}>
        Chargement…
      </div>
    );
  }

  const enCours = commandes.filter(c => c.statut !== 'livree' && c.statut !== 'litige');
  const recus   = commandes.filter(c => c.statut === 'livree');
  const litiges = commandes.filter(c => c.statut === 'litige');

  if (commandes.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '28px 20px',
        background: 'var(--papier)', border: '1.5px dashed rgba(26,16,8,0.18)',
      }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>📚</div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Aucune commande</div>
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.45)' }}>
          Vos livres commandés apparaîtront ici.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { val: enCours.length, label: 'En cours', color: '#2a5ca8' },
          { val: recus.length,   label: 'Reçus',    color: '#2d6a2d' },
          { val: commandes.length, label: 'Total',  color: 'var(--bordeaux)' },
        ].map(({ val, label, color }) => (
          <div key={label} style={{
            flex: 1, textAlign: 'center', padding: '12px 6px',
            background: 'var(--papier)', border: '1px dashed rgba(26,16,8,0.2)',
          }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color }}>{val}</div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* En cours d'acheminement */}
      {enCours.length > 0 && (
        <>
          <div style={{
            fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3,
            textTransform: 'uppercase', color: '#2a5ca8',
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
          }}>
            En cours d'acheminement
            <span style={{ flex: 1, height: 1, background: 'rgba(42,92,168,0.2)' }} />
          </div>
          {enCours.map(c => <CommandeCard key={c.id} commande={c} />)}
        </>
      )}

      {/* Litiges */}
      {litiges.length > 0 && (
        <>
          <div style={{
            fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3,
            textTransform: 'uppercase', color: '#b41414',
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: enCours.length > 0 ? 20 : 0,
          }}>
            Litiges
            <span style={{ flex: 1, height: 1, background: 'rgba(180,20,20,0.2)' }} />
          </div>
          {litiges.map(c => <CommandeCard key={c.id} commande={c} />)}
        </>
      )}

      {/* Reçus */}
      {recus.length > 0 && (
        <>
          <div style={{
            fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3,
            textTransform: 'uppercase', color: '#2d6a2d',
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
            marginTop: (enCours.length > 0 || litiges.length > 0) ? 20 : 0,
          }}>
            Livres reçus
            <span style={{ flex: 1, height: 1, background: 'rgba(45,106,45,0.2)' }} />
          </div>
          {recus.map(c => <CommandeCard key={c.id} commande={c} />)}
        </>
      )}
    </div>
  );
}