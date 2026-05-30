import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const STATUT_CONFIG = {
  disponible: { label: 'Disponible', color: 'rgba(26,16,8,0.4)', bg: 'rgba(26,16,8,0.05)' },
  acceptee:   { label: 'Acceptée',   color: '#1a3a5c',           bg: 'rgba(26,58,92,0.08)' },
  engagee:    { label: 'En cours',   color: '#8B6914',           bg: 'rgba(139,105,20,0.1)' },
  livree:     { label: 'Livrée ✓',  color: '#2d6a2d',           bg: 'rgba(45,106,45,0.1)' },
};

function MoyenneEtoiles({ notes }) {
  if (!notes || notes.length === 0) return null;
  const moy = notes.reduce((s, n) => s + n.note_ponctualite, 0) / notes.length;
  const arrondi = Math.round(moy * 10) / 10;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ color: '#8B6914', fontSize: 13, letterSpacing: 1 }}>
        {'★'.repeat(Math.round(moy))}{'☆'.repeat(5 - Math.round(moy))}
      </span>
      <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 13, color: '#8B6914' }}>
        {arrondi.toFixed(1)}
      </span>
      <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, color: 'rgba(26,16,8,0.35)', letterSpacing: 1 }}>
        ({notes.length} avis)
      </span>
    </div>
  );
}

function MissionCard({ mission, notation }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUT_CONFIG[mission.statut] || STATUT_CONFIG.disponible;

  return (
    <div style={{
      background: 'var(--papier)', border: '1.5px solid rgba(26,16,8,0.18)',
      marginBottom: 10, overflow: 'hidden', boxShadow: '2px 2px 0 rgba(26,16,8,0.07)',
    }}>
      <div style={{ height: 3, background: cfg.color, opacity: 0.6 }} />
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ padding: '14px 16px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 15,
              color: 'var(--encre)', marginBottom: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {mission.livre}
            </div>
            {mission.auteur && (
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.5)', marginBottom: 6 }}>
                {mission.auteur}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                display: 'inline-block', padding: '2px 8px',
                background: cfg.bg, color: cfg.color,
                fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1.5,
                textTransform: 'uppercase', border: `1px solid ${cfg.color}`,
              }}>
                {cfg.label}
              </span>
              {mission.ville_destination && (
                <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, color: 'rgba(26,16,8,0.4)', letterSpacing: 1 }}>
                  📍 {mission.ville_destination}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {mission.commission > 0 && (
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700, color: '#2d6a2d' }}>
                +{mission.commission.toFixed(2)} €
              </div>
            )}
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, color: 'rgba(26,16,8,0.3)', letterSpacing: 1, marginTop: 2 }}>
              {expanded ? '▲' : '▼'}
            </div>
          </div>
        </div>

        {/* Note voyageur si livrée */}
        {mission.statut === 'livree' && notation && (
          <div style={{ marginTop: 8 }}>
            <MoyenneEtoiles notes={[notation]} />
            {notation.commentaire && (
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.45)', marginTop: 4 }}>
                "{notation.commentaire}"
              </div>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div style={{
          borderTop: '1px dashed rgba(26,16,8,0.15)',
          padding: '12px 16px', background: 'rgba(26,16,8,0.02)',
        }}>
          {[
            ['Type', mission.type],
            ['Poids', mission.poids],
            ['Position valise', mission.numero_ordre ? `Livre n°${mission.numero_ordre}` : null],
            ['Date limite', mission.date_limite ? new Date(mission.date_limite).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }) : null],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1, color: 'rgba(26,16,8,0.4)', textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontFamily: 'IM Fell English, serif', fontSize: 12, color: 'var(--encre)' }}>{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoriqueVoyageur({ userEmail }) {
  const [missions, setMissions] = useState([]);
  const [notations, setNotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('tous');

  useEffect(() => {
    if (!userEmail) return;
    Promise.all([
      base44.entities.MissionVoyageur.filter({ voyageur_email: userEmail }, '-created_date', 200),
      base44.entities.NotationVoyageur.filter({ voyageur_email: userEmail }),
    ]).then(([ms, ns]) => {
      setMissions(ms || []);
      setNotations(ns || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userEmail]);

  const livrees = missions.filter(m => m.statut === 'livree');
  const enCours = missions.filter(m => m.statut !== 'livree');
  const gainsTotal = livrees.reduce((s, m) => s + (m.commission || 0), 0);
  const moyenneNote = notations.length > 0
    ? (notations.reduce((s, n) => s + n.note_ponctualite, 0) / notations.length).toFixed(1)
    : null;

  const filtres = [
    { key: 'tous', label: 'Tous' },
    { key: 'livree', label: 'Livrés' },
    { key: 'en_cours', label: 'En cours' },
  ];

  const missionsFiltrees = missions.filter(m => {
    if (filtre === 'livree') return m.statut === 'livree';
    if (filtre === 'en_cours') return m.statut !== 'livree';
    return true;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.4)' }}>
        Chargement…
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { val: missions.length, label: 'Trajets' },
          { val: `${gainsTotal.toFixed(2)} €`, label: 'Gains totaux' },
          { val: moyenneNote ? `★ ${moyenneNote}` : '—', label: 'Réputation' },
        ].map(({ val, label }) => (
          <div key={label} style={{
            textAlign: 'center', padding: '12px 6px',
            background: 'var(--papier)', border: '1px dashed rgba(26,16,8,0.2)',
          }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: label === 'Gains totaux' ? 14 : 22, fontWeight: 700, color: 'var(--bordeaux)', lineHeight: 1.2 }}>{val}</div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 7.5, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Réputation détaillée */}
      {notations.length > 0 && (
        <div style={{
          background: 'rgba(139,105,20,0.07)', border: '1px dashed var(--sepia)',
          padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--sepia)', marginBottom: 4 }}>Votre réputation</div>
            <MoyenneEtoiles notes={notations} />
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.45)', textAlign: 'right' }}>
            {notations.filter(n => n.note_ponctualite >= 4).length} avis positifs
          </div>
        </div>
      )}

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

      {missions.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '28px 20px',
          background: 'var(--papier)', border: '1.5px dashed rgba(26,16,8,0.18)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✈️</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Aucune mission</div>
          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.45)' }}>
            Vos missions de transport apparaîtront ici
          </div>
        </div>
      ) : (
        missionsFiltrees.map(m => {
          const nota = notations.find(n => n.mission_id === m.id || n.commande_id === m.id);
          return <MissionCard key={m.id} mission={m} notation={nota} />;
        })
      )}
    </div>
  );
}