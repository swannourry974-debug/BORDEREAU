import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const ETAPES = [
  { id: 'prise_en_charge', label: 'Prise en charge', icon: '📋', color: '#8B6914', desc: 'Livre acheté & scanné par le voyageur' },
  { id: 'en_vol', label: 'En vol', icon: '✈️', color: '#1a5276', desc: 'Voyage en cours vers la destination' },
  { id: 'arrive', label: 'Arrivé', icon: '🛬', color: '#2d6a2d', desc: 'Atterrissage confirmé' },
  { id: 'au_relais', label: 'Point Relais', icon: '🏪', color: '#6c3483', desc: 'Réception / En attente de remise' },
  { id: 'livree', label: 'Distribué', icon: '✅', color: '#800020', desc: 'Livre remis au lecteur' },
];

const STATUT_TO_ETAPE = {
  en_attente_paiement: null,
  payee: 'prise_en_charge',
  en_transit: 'en_vol',
  au_relais: 'au_relais',
  livree: 'livree',
  litige: null,
};

function getEtapeIndex(statut) {
  const etapeId = STATUT_TO_ETAPE[statut];
  if (!etapeId) return -1;
  return ETAPES.findIndex(e => e.id === etapeId);
}

function Timeline({ statut, commandeId, onUpdate }) {
  const currentIdx = getEtapeIndex(statut);

  const nextStatutMap = {
    payee: 'en_transit',
    en_transit: 'au_relais',
    au_relais: 'livree',
  };

  const handleAdvance = async () => {
    const next = nextStatutMap[statut];
    if (!next) return;
    await base44.entities.Commande.update(commandeId, { statut: next });
    onUpdate();
  };

  return (
    <div style={{ position: 'relative', padding: '12px 0 8px' }}>
      {/* Ligne de fond */}
      <div style={{
        position: 'absolute', top: 28, left: 20, right: 20, height: 3,
        background: 'hsl(var(--border))', zIndex: 0,
      }} />
      {/* Ligne de progression */}
      <div style={{
        position: 'absolute', top: 28, left: 20, height: 3,
        width: currentIdx < 0 ? '0%' : `${(currentIdx / (ETAPES.length - 1)) * (100 - (40 / 300 * 100))}%`,
        background: 'var(--bordeaux)', zIndex: 1, transition: 'width 0.4s ease',
      }} />

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
                fontSize: done ? 16 : 14, transition: 'all 0.3s',
                boxShadow: active ? `0 0 0 4px ${etape.color}22` : 'none',
              }}>
                {done ? etape.icon : <span style={{ opacity: 0.3, fontSize: 12 }}>{i + 1}</span>}
              </div>
              <div style={{
                marginTop: 6, fontSize: 9, textAlign: 'center', lineHeight: 1.3,
                fontFamily: 'Special Elite, monospace', letterSpacing: 1,
                color: done ? etape.color : 'hsl(var(--muted-foreground))',
                fontWeight: active ? 700 : 400, maxWidth: 60,
              }}>
                {etape.label}
              </div>
            </div>
          );
        })}
      </div>

      {nextStatutMap[statut] && (
        <button
          onClick={handleAdvance}
          style={{
            marginTop: 10, width: '100%', background: 'var(--bordeaux)',
            color: 'var(--creme)', border: 'none', padding: '7px 12px',
            fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2,
            textTransform: 'uppercase', cursor: 'pointer',
            boxShadow: '2px 2px 0 var(--bordeaux-dark)',
          }}
        >
          ▶ Avancer vers : {ETAPES[ETAPES.findIndex(e => e.id === STATUT_TO_ETAPE[nextStatutMap[statut]])]?.label}
        </button>
      )}
    </div>
  );
}

const STATUT_LABELS = {
  en_attente_paiement: { label: 'En attente', color: '#8B6914', bg: '#fdf6e3' },
  payee: { label: 'Prise en charge', color: '#1a5276', bg: '#eaf4fb' },
  en_transit: { label: 'En vol', color: '#2874a6', bg: '#d6eaf8' },
  au_relais: { label: 'Au relais', color: '#6c3483', bg: '#f4ecf7' },
  livree: { label: 'Distribué', color: '#2d6a2d', bg: '#eafaea' },
  litige: { label: 'Litige', color: '#b41414', bg: '#fde8e8' },
};

export default function SuiviAcheminement() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Commande.list('-updated_date', 100);
    setCommandes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredStatuts = ['payee', 'en_transit', 'au_relais', 'livree', 'litige', 'en_attente_paiement'];
  const displayed = filter === 'all'
    ? commandes.filter(c => ['payee', 'en_transit', 'au_relais', 'livree'].includes(c.statut))
    : commandes.filter(c => c.statut === filter);

  const counts = {};
  filteredStatuts.forEach(s => { counts[s] = commandes.filter(c => c.statut === s).length; });

  return (
    <div>
      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <div className="font-special" style={{ fontSize: 18, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 }}>
          Suivi Acheminement
        </div>
        <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
          Timeline interactive de l'état des livres en circulation
        </div>
      </div>

      {/* Compteurs par statut */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px', border: filter === 'all' ? '2px solid var(--bordeaux)' : '1.5px solid hsl(var(--border))',
            background: filter === 'all' ? 'var(--bordeaux)' : 'hsl(var(--card))',
            color: filter === 'all' ? 'var(--creme)' : 'hsl(var(--foreground))',
            cursor: 'pointer', fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2,
          }}
        >
          TOUS · {commandes.filter(c => ['payee', 'en_transit', 'au_relais', 'livree'].includes(c.statut)).length}
        </button>
        {['payee', 'en_transit', 'au_relais', 'livree', 'litige'].map(s => {
          const info = STATUT_LABELS[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '8px 14px', border: filter === s ? `2px solid ${info.color}` : '1.5px solid hsl(var(--border))',
                background: filter === s ? info.bg : 'hsl(var(--card))',
                color: info.color, cursor: 'pointer',
                fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 1,
              }}
            >
              {info.label} · {counts[s] || 0}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', color: 'hsl(var(--muted-foreground))' }}>
          Chargement des commandes...
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', color: 'hsl(var(--muted-foreground))' }}>
          Aucune commande dans cette catégorie.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayed.map(cmd => {
            const info = STATUT_LABELS[cmd.statut] || STATUT_LABELS['en_attente_paiement'];
            const isOpen = expanded === cmd.id;
            return (
              <div key={cmd.id} style={{
                background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))',
                borderLeft: `4px solid ${info.color}`,
                overflow: 'hidden',
              }}>
                {/* Résumé cliquable */}
                <div
                  onClick={() => setExpanded(isOpen ? null : cmd.id)}
                  style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-serif" style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cmd.livre_titre || '—'}
                    </div>
                    <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                      {cmd.lecteur_email} · {cmd.zone_nom || '?'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{
                      background: info.bg, color: info.color,
                      padding: '3px 10px', fontSize: 9, letterSpacing: 1,
                      fontFamily: 'Special Elite, monospace', textTransform: 'uppercase',
                      border: `1px solid ${info.color}44`,
                    }}>
                      {info.label}
                    </span>
                    <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Timeline dépliable */}
                {isOpen && (
                  <div style={{ padding: '4px 18px 18px', borderTop: '1px dashed hsl(var(--border))' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, marginTop: 12 }}>
                      <div style={{ fontSize: 10, fontFamily: 'Special Elite, monospace', color: 'hsl(var(--muted-foreground))', letterSpacing: 1 }}>
                        MODE · <span style={{ color: 'hsl(var(--foreground))' }}>{cmd.mode_livraison || '—'}</span>
                      </div>
                      <div style={{ fontSize: 10, fontFamily: 'Special Elite, monospace', color: 'hsl(var(--muted-foreground))', letterSpacing: 1 }}>
                        MONTANT · <span style={{ color: 'var(--bordeaux)', fontWeight: 700 }}>{cmd.montant_paye ? `${cmd.montant_paye} €` : '—'}</span>
                      </div>
                      {cmd.voyageur_email && (
                        <div style={{ fontSize: 10, fontFamily: 'Special Elite, monospace', color: 'hsl(var(--muted-foreground))', letterSpacing: 1, gridColumn: '1/-1' }}>
                          VOYAGEUR · <span style={{ color: 'hsl(var(--foreground))' }}>{cmd.voyageur_email}</span>
                        </div>
                      )}
                    </div>
                    <Timeline statut={cmd.statut} commandeId={cmd.id} onUpdate={load} />
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