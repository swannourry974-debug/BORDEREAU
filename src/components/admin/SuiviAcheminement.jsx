import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// ─── Mapping statuts → index timeline ────────────────────────────────────────
// Express : piloté par statut MissionVoyageur du voyageur assigné
//   acceptee  → 0 (Prise en charge)
//   engagee   → 1 (En vol)
//   livree    → 2 (Arrivé) puis commande.statut gère relais/distribué
// Collecte : piloté manuellement par l'admin via commande.statut

const ETAPES = [
  { id: 'prise_en_charge', label: 'Prise en charge', icon: '📋', color: '#8B6914' },
  { id: 'en_vol',          label: 'En vol',           icon: '✈️',  color: '#1a5276' },
  { id: 'arrive',          label: 'Arrivé',           icon: '🛬',  color: '#2d6a2d' },
  { id: 'au_relais',       label: 'Point Relais',     icon: '🏪',  color: '#6c3483' },
  { id: 'livree',          label: 'Distribué',        icon: '✅',  color: '#800020' },
];

// Pour mode EXPRESS : l'index dépend du statut de la MissionVoyageur
function getExpressEtapeIndex(mission, commandeStatut) {
  if (!mission) {
    // Pas de mission assignée : se base sur commande.statut
    const map = { payee: 0, en_transit: 1, au_relais: 3, livree: 4 };
    return map[commandeStatut] ?? -1;
  }
  if (commandeStatut === 'livree') return 4;
  if (commandeStatut === 'au_relais') return 3;
  // Sinon on lit la mission
  const missionMap = { acceptee: 0, engagee: 1, livree: 2 };
  return missionMap[mission.statut] ?? 0;
}

// Pour mode COLLECTE : l'admin avance manuellement
function getCollecteEtapeIndex(commandeStatut) {
  const map = { payee: 0, en_transit: 1, au_relais: 3, livree: 4 };
  return map[commandeStatut] ?? -1;
}

// Prochaine étape admin pour collecte
const NEXT_STATUT_COLLECTE = {
  payee: 'en_transit',
  en_transit: 'au_relais',
  au_relais: 'livree',
};

const STATUT_LABELS = {
  en_attente_paiement: { label: 'En attente paiement', color: '#8B6914', bg: '#fdf6e3' },
  payee:               { label: 'Prise en charge',     color: '#1a5276', bg: '#eaf4fb' },
  en_transit:          { label: 'En vol',              color: '#2874a6', bg: '#d6eaf8' },
  au_relais:           { label: 'Au relais',           color: '#6c3483', bg: '#f4ecf7' },
  livree:              { label: 'Distribué',           color: '#2d6a2d', bg: '#eafaea' },
  litige:              { label: 'Litige',              color: '#b41414', bg: '#fde8e8' },
};

// ─── Sous-composant Timeline ─────────────────────────────────────────────────
function Timeline({ commande, mission, onUpdate, readOnly = false }) {
  const isExpress = commande.mode_livraison === 'express';
  const currentIdx = isExpress
    ? getExpressEtapeIndex(mission, commande.statut)
    : getCollecteEtapeIndex(commande.statut);

  const nextStatut = !isExpress ? NEXT_STATUT_COLLECTE[commande.statut] : null;

  const handleAdvance = async () => {
    if (!nextStatut) return;
    await base44.entities.Commande.update(commande.id, { statut: nextStatut });
    onUpdate();
  };

  // % de la barre de progression
  const progressPct = currentIdx < 0 ? 0 : (currentIdx / (ETAPES.length - 1)) * 88;

  return (
    <div style={{ position: 'relative', padding: '16px 0 8px' }}>
      {/* Rail */}
      <div style={{ position: 'absolute', top: 34, left: '6%', right: '6%', height: 3, background: 'hsl(var(--border))', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 34, left: '6%', height: 3, width: `${progressPct}%`, background: isExpress ? '#1a5276' : 'var(--bordeaux)', zIndex: 1, transition: 'width 0.4s ease' }} />

      {/* Étapes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
        {ETAPES.map((etape, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={etape.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: done ? etape.color : 'hsl(var(--card))',
                border: active ? `3px solid ${etape.color}` : done ? `2px solid ${etape.color}` : '2px solid hsl(var(--border))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 16 : 12, transition: 'all 0.3s',
                boxShadow: active ? `0 0 0 5px ${etape.color}20` : 'none',
              }}>
                {done ? etape.icon : <span style={{ opacity: 0.25, fontSize: 11 }}>{i + 1}</span>}
              </div>
              <div style={{
                marginTop: 6, fontSize: 9, textAlign: 'center', lineHeight: 1.3,
                fontFamily: 'Special Elite, monospace', letterSpacing: 0.8,
                color: done ? etape.color : 'hsl(var(--muted-foreground))',
                fontWeight: active ? 700 : 400, maxWidth: 64,
              }}>
                {etape.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Source du statut */}
      <div style={{ marginTop: 12, fontSize: 9, fontFamily: 'Special Elite, monospace', letterSpacing: 1, color: 'hsl(var(--muted-foreground))' }}>
        {isExpress ? (
          mission
            ? <span>✈ Express · Statut voyageur : <strong style={{ color: '#1a5276' }}>{mission.statut}</strong> — <em style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic' }}>mis à jour par le voyageur</em></span>
            : <span>✈ Express · <em style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', color: '#b41414' }}>Aucun voyageur assigné</em></span>
        ) : (
          readOnly
            ? <span style={{ color: 'hsl(var(--muted-foreground))' }}>Lecture seule · action réservée à l’administrateur principal</span>
            : nextStatut
            ? <button
                onClick={handleAdvance}
                style={{
                  background: 'var(--bordeaux)', color: 'var(--creme)', border: 'none',
                  padding: '6px 14px', fontFamily: 'Special Elite, monospace',
                  fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
                  cursor: 'pointer', boxShadow: '2px 2px 0 var(--bordeaux-dark)', marginTop: 4,
                }}
              >
                ▶ Avancer → {ETAPES[getCollecteEtapeIndex(nextStatut)]?.label}
              </button>
            : commande.statut === 'livree'
              ? <span style={{ color: '#2d6a2d' }}>✓ Livraison collecte terminée</span>
              : null
        )}
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────
export default function SuiviAcheminement({ readOnly = false }) {
  const [commandes, setCommandes] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all'); // 'all' | 'express' | 'collectif'
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    const [cmds, msns] = await Promise.all([
      base44.entities.Commande.list('-updated_date', 100),
      base44.entities.MissionVoyageur.list('-updated_date', 200),
    ]);
    setCommandes(cmds);
    setMissions(msns);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Trouver la mission associée à une commande (via mission_id ou voyageur_email + livre)
  const getMission = (cmd) => {
    if (cmd.mission_id) return missions.find(m => m.id === cmd.mission_id) || null;
    if (cmd.voyageur_email && cmd.livre_titre) {
      return missions.find(m => m.voyageur_email === cmd.voyageur_email && m.livre === cmd.livre_titre) || null;
    }
    return null;
  };

  const ACTIVE_STATUTS = ['payee', 'en_transit', 'au_relais', 'livree'];
  const FILTER_STATUTS = ['payee', 'en_transit', 'au_relais', 'livree', 'litige'];

  const base = commandes.filter(c => ACTIVE_STATUTS.includes(c.statut));

  const displayed = base.filter(c => {
    const statutOk = filter === 'all' || c.statut === filter;
    const modeOk = modeFilter === 'all' || c.mode_livraison === modeFilter;
    return statutOk && modeOk;
  });

  const counts = {};
  FILTER_STATUTS.forEach(s => { counts[s] = commandes.filter(c => c.statut === s).length; });

  return (
    <div>
      {/* En-tête */}
      <div style={{ marginBottom: 20 }}>
        <div className="font-special" style={{ fontSize: 18, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 }}>
          Suivi Acheminement
        </div>
        <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
          Express : avancée automatique selon le voyageur · Collecte : contrôle manuel admin
        </div>
      </div>

      {/* Filtre mode */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['all', 'Tous modes'], ['express', '✈ Express'], ['collectif', '📦 Collecte']].map(([val, label]) => (
          <button key={val} onClick={() => setModeFilter(val)} style={{
            padding: '6px 14px', border: modeFilter === val ? '2px solid var(--bordeaux)' : '1.5px solid hsl(var(--border))',
            background: modeFilter === val ? 'var(--bordeaux)' : 'transparent',
            color: modeFilter === val ? 'var(--creme)' : 'hsl(var(--foreground))',
            fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* Filtre statut */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button onClick={() => setFilter('all')} style={{
          padding: '7px 14px', border: filter === 'all' ? '2px solid var(--bordeaux)' : '1.5px solid hsl(var(--border))',
          background: filter === 'all' ? 'var(--bordeaux)' : 'hsl(var(--card))',
          color: filter === 'all' ? 'var(--creme)' : 'hsl(var(--foreground))',
          cursor: 'pointer', fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2,
        }}>
          TOUS · {base.length}
        </button>
        {FILTER_STATUTS.map(s => {
          const info = STATUT_LABELS[s];
          return (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '7px 12px', border: filter === s ? `2px solid ${info.color}` : '1.5px solid hsl(var(--border))',
              background: filter === s ? info.bg : 'hsl(var(--card))',
              color: info.color, cursor: 'pointer',
              fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1,
            }}>
              {info.label} · {counts[s] || 0}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', color: 'hsl(var(--muted-foreground))' }}>
          Chargement…
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', color: 'hsl(var(--muted-foreground))' }}>
          Aucune commande dans cette catégorie.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayed.map(cmd => {
            const info = STATUT_LABELS[cmd.statut] || STATUT_LABELS['payee'];
            const isOpen = expanded === cmd.id;
            const mission = getMission(cmd);
            const isExpress = cmd.mode_livraison === 'express';

            return (
              <div key={cmd.id} style={{
                background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))',
                borderLeft: `4px solid ${info.color}`, overflow: 'hidden',
              }}>
                {/* Header cliquable */}
                <div onClick={() => setExpanded(isOpen ? null : cmd.id)} style={{
                  padding: '13px 18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="font-serif" style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cmd.livre_titre || '—'}
                      </span>
                      <span style={{
                        fontSize: 8, fontFamily: 'Special Elite, monospace', letterSpacing: 1, padding: '2px 7px',
                        border: `1px solid ${isExpress ? '#1a527688' : '#80002088'}`,
                        color: isExpress ? '#1a5276' : '#800020',
                        background: isExpress ? '#eaf4fb' : '#fdf0f2',
                        flexShrink: 0,
                      }}>
                        {isExpress ? '✈ EXPRESS' : '📦 COLLECTE'}
                      </span>
                    </div>
                    <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                      {cmd.lecteur_email} · {cmd.zone_nom || '?'}
                      {isExpress && mission && <span> · <strong>Voyageur :</strong> {cmd.voyageur_email}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      background: info.bg, color: info.color, padding: '3px 10px',
                      fontSize: 9, letterSpacing: 1, fontFamily: 'Special Elite, monospace',
                      textTransform: 'uppercase', border: `1px solid ${info.color}44`,
                    }}>
                      {info.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Timeline dépliée */}
                {isOpen && (
                  <div style={{ padding: '4px 18px 18px', borderTop: '1px dashed hsl(var(--border))' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12, marginBottom: 4 }}>
                      <div style={{ fontSize: 9, fontFamily: 'Special Elite, monospace', color: 'hsl(var(--muted-foreground))', letterSpacing: 1 }}>
                        MODE<br /><span style={{ color: 'hsl(var(--foreground))', fontSize: 11 }}>{cmd.mode_livraison || '—'}</span>
                      </div>
                      <div style={{ fontSize: 9, fontFamily: 'Special Elite, monospace', color: 'hsl(var(--muted-foreground))', letterSpacing: 1 }}>
                        MONTANT<br /><span style={{ color: 'var(--bordeaux)', fontWeight: 700, fontSize: 13 }}>{cmd.montant_paye ? `${cmd.montant_paye} €` : '—'}</span>
                      </div>
                      {isExpress && (
                        <div style={{ fontSize: 9, fontFamily: 'Special Elite, monospace', color: 'hsl(var(--muted-foreground))', letterSpacing: 1 }}>
                          MISSION<br />
                          <span style={{ color: mission ? '#2d6a2d' : '#b41414', fontSize: 10 }}>
                            {mission ? `✓ ${mission.statut}` : '⚠ non assignée'}
                          </span>
                        </div>
                      )}
                    </div>
                    <Timeline commande={cmd} mission={isExpress ? mission : null} onUpdate={load} readOnly={readOnly} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}