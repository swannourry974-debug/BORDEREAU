import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const today = () => new Date().toISOString().slice(0, 10);

const CATEGORIES = [
  { key: 'attendus',   label: 'Attendus',         emoji: '✈️', color: '#1a3a5c', bg: 'rgba(26,58,92,0.08)',  desc: 'En transit vers le relais' },
  { key: 'recus',      label: 'Réceptionnés',      emoji: '📦', color: '#8B6914', bg: 'rgba(139,105,20,0.12)', desc: 'Au relais — en attente de retrait' },
  { key: 'remis',      label: 'Remis au lecteur',  emoji: '✅', color: '#2d6a2d', bg: 'rgba(45,106,45,0.10)', desc: 'Retirés aujourd\'hui' },
];

function ColisCard({ commande, categorie }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = CATEGORIES.find(c => c.key === categorie);

  const retardJours = commande.jours_retard || 0;

  return (
    <div
      onClick={() => setExpanded(v => !v)}
      style={{
        background: 'var(--papier)',
        border: `1.5px solid ${cfg.color}`,
        borderLeft: `5px solid ${cfg.color}`,
        marginBottom: 10, cursor: 'pointer',
        boxShadow: `2px 2px 0 ${cfg.color}18`,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 14,
              color: 'var(--encre)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {commande.livre_titre}
            </div>
            {commande.livre_auteur && (
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.5)', marginTop: 1 }}>
                {commande.livre_auteur}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {commande.lecteur_email && (
                <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1, color: 'rgba(26,16,8,0.4)' }}>
                  👤 {commande.lecteur_email.split('@')[0]}
                </span>
              )}
              {commande.mode_livraison && (
                <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1, color: 'rgba(26,16,8,0.4)' }}>
                  {commande.mode_livraison === 'express' ? '✈ Express' : '📦 Collectif'}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {retardJours > 0 && (
              <div style={{
                fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1,
                background: 'rgba(180,20,20,0.08)', color: '#b41414',
                border: '1px solid rgba(180,20,20,0.3)', padding: '2px 7px', marginBottom: 4,
                textTransform: 'uppercase',
              }}>
                ⚠ J+{retardJours}
              </div>
            )}
            {commande.code_secret && categorie === 'recus' && (
              <div style={{
                fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700,
                color: cfg.color, letterSpacing: 4,
              }}>
                {commande.code_secret}
              </div>
            )}
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, color: 'rgba(26,16,8,0.3)', letterSpacing: 1, marginTop: 4 }}>
              {expanded ? '▲' : '▼ détails'}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{
          borderTop: '1px dashed rgba(26,16,8,0.15)',
          padding: '10px 14px', background: 'rgba(26,16,8,0.02)',
        }}>
          {[
            ['ID commande', commande.id?.slice(0, 8)],
            ['Zone', commande.zone_nom],
            ['Arrivée relais', commande.date_arrivee_relais ? new Date(commande.date_arrivee_relais).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : null],
            ['À retirer avant', commande.date_limite_collecte ? new Date(commande.date_limite_collecte).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : null],
            ['Pénalité', commande.penalite_retard > 0 ? `${commande.penalite_retard.toFixed(2)} €` : null],
            ['Code secret', categorie === 'recus' ? commande.code_secret : null],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1, color: 'rgba(26,16,8,0.4)', textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontFamily: 'IM Fell English, serif', fontSize: 12, color: 'var(--encre)' }}>{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ categorie, commandes, loading }) {
  const cfg = CATEGORIES.find(c => c.key === categorie);

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Titre section */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
        background: cfg.bg, border: `1px solid ${cfg.color}`, padding: '8px 14px',
      }}>
        <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: cfg.color }}>
            {cfg.label}
          </div>
          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 10, color: 'rgba(26,16,8,0.45)' }}>
            {cfg.desc}
          </div>
        </div>
        <div style={{
          background: cfg.color, color: 'var(--creme)',
          width: 28, height: 28, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700,
        }}>
          {loading ? '…' : commandes.length}
        </div>
      </div>

      {loading ? (
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.4)', textAlign: 'center', padding: 12 }}>
          Chargement…
        </div>
      ) : commandes.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '16px 20px',
          background: 'var(--papier)', border: '1px dashed rgba(26,16,8,0.15)',
          fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.35)',
        }}>
          Aucun colis dans cette catégorie
        </div>
      ) : (
        commandes.map(c => <ColisCard key={c.id} commande={c} categorie={categorie} />)
      )}
    </div>
  );
}

export default function TableauDeBordRelais({ relaisEmail }) {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!relaisEmail) return;
    base44.entities.Commande.filter(
      { point_relais_id: relaisEmail },
      '-created_date',
      200
    ).then(data => {
      setCommandes(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [relaisEmail]);

  // Catégorisation
  const attendus = commandes.filter(c => c.statut === 'en_transit');
  const recus    = commandes.filter(c => c.statut === 'au_relais');

  // "Remis aujourd'hui" = livrées avec date_arrivee_relais = aujourd'hui ou sans date mais livrees recentes
  const todayStr = today();
  const remis    = commandes.filter(c => c.statut === 'livree');

  // Stats rapides
  const retards  = recus.filter(c => (c.jours_retard || 0) > 0).length;

  return (
    <div>
      {/* Stats rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        {[
          { val: attendus.length, label: 'Attendus',    color: '#1a3a5c' },
          { val: recus.length,    label: 'Au relais',   color: '#8B6914' },
          { val: remis.length,    label: 'Remis',       color: '#2d6a2d' },
        ].map(({ val, label, color }) => (
          <div key={label} style={{
            textAlign: 'center', padding: '14px 6px',
            background: 'var(--papier)', border: '1px dashed rgba(26,16,8,0.2)',
          }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 7.5, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', marginTop: 5 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Alerte retards */}
      {retards > 0 && (
        <div style={{
          background: 'rgba(180,20,20,0.06)', border: '1.5px solid rgba(180,20,20,0.35)',
          padding: '10px 14px', marginBottom: 16,
          fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1.5,
          color: '#b41414', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          {retards} colis {retards > 1 ? 'en retard' : 'en retard'} — contactez les lecteurs
        </div>
      )}

      <Section categorie="attendus" commandes={attendus} loading={loading} />
      <Section categorie="recus"    commandes={recus}    loading={loading} />
      <Section categorie="remis"    commandes={remis}    loading={loading} />
    </div>
  );
}