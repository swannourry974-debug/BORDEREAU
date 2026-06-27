import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

function StarRating({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          disabled={disabled}
          style={{
            background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
            fontSize: 22, padding: 0, lineHeight: 1,
            color: star <= (hovered || value) ? '#8B6914' : 'rgba(26,16,8,0.2)',
            transition: 'color 0.1s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function NotationRelais({ commandes, relaisEmail }) {
  // Seules les commandes livrées sont notables
  const livrables = commandes.filter(c => c.statut === 'livree' && c.voyageur_email);
  const [notations, setNotations] = useState({}); // { commande_id: NotationVoyageur }
  const [forms, setForms] = useState({});          // { commande_id: { note_ponctualite, note_soin, commentaire } }
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});

  useEffect(() => {
    if (!livrables.length || !relaisEmail) return;
    base44.entities.NotationVoyageur.filter({ lecteur_email: relaisEmail })
      .then(notes => {
        const map = {};
        notes.forEach(n => { if (n.commande_id) map[n.commande_id] = n; });
        setNotations(map);
      })
      .catch(() => {});
  }, [commandes, relaisEmail]);

  const getForm = (id) => forms[id] || { note_ponctualite: 0, note_soin: 0, commentaire: '' };
  const setForm = (id, patch) => setForms(f => ({ ...f, [id]: { ...getForm(id), ...patch } }));

  const handleSave = async (commande) => {
    const form = getForm(commande.id);
    if (!form.note_ponctualite) return;
    setSaving(s => ({ ...s, [commande.id]: true }));
    try {
      await base44.entities.NotationVoyageur.create({
        mission_id: commande.mission_id || '',
        commande_id: commande.id,
        voyageur_email: commande.voyageur_email,
        lecteur_email: relaisEmail,
        note_ponctualite: form.note_ponctualite,
        note_soin: form.note_soin || form.note_ponctualite,
        commentaire: form.commentaire,
        livre_titre: commande.livre_titre,
      });
      setNotations(n => ({ ...n, [commande.id]: { ...form } }));
      setSaved(s => ({ ...s, [commande.id]: true }));
    } catch (e) {
      alert('Erreur lors de l\'enregistrement.');
    }
    setSaving(s => ({ ...s, [commande.id]: false }));
  };

  if (livrables.length === 0) {
    return (
      <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.4)', textAlign: 'center', padding: '40px 0' }}>
        Aucune livraison à noter pour le moment.<br />
        <span style={{ fontSize: 11 }}>Les livraisons confirmées apparaîtront ici.</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        Échanges à noter ({livrables.length})
        <span style={{ flex: 1, height: 1, background: 'repeating-linear-gradient(90deg, var(--bordeaux) 0, var(--bordeaux) 4px, transparent 4px, transparent 8px)' }} />
      </div>

      {livrables.map(c => {
        const deja = notations[c.id];
        const form = getForm(c.id);
        const isSaved = saved[c.id];

        return (
          <div key={c.id} style={{
            background: 'var(--papier)', border: '1.5px solid hsl(var(--border))',
            borderLeft: deja || isSaved ? '4px solid #2d6a2d' : '4px solid var(--bordeaux)',
            padding: '14px 16px', marginBottom: 14,
          }}>
            {/* Titre livre */}
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
              {c.livre_titre}
            </div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, color: 'hsl(var(--muted-foreground))', marginBottom: 12 }}>
              Voyageur : {c.voyageur_email?.split('@')[0]} · {c.zone_nom || ''}
            </div>

            {deja || isSaved ? (
              // Déjà noté
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#2d6a2d', fontFamily: 'Special Elite, monospace', border: '1px solid #2d6a2d', padding: '3px 8px' }}>
                  ✓ Noté
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: 16, color: s <= (deja?.note_ponctualite || form.note_ponctualite) ? '#8B6914' : 'rgba(26,16,8,0.15)' }}>★</span>
                  ))}
                </div>
                {(deja?.commentaire || form.commentaire) && (
                  <span style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                    "{deja?.commentaire || form.commentaire}"
                  </span>
                )}
              </div>
            ) : (
              // Formulaire de notation
              <div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>
                      Ponctualité
                    </div>
                    <StarRating value={form.note_ponctualite} onChange={v => setForm(c.id, { note_ponctualite: v })} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>
                      Soin du livre
                    </div>
                    <StarRating value={form.note_soin} onChange={v => setForm(c.id, { note_soin: v })} />
                  </div>
                </div>

                <textarea
                  value={form.commentaire}
                  onChange={e => setForm(c.id, { commentaire: e.target.value })}
                  placeholder="Commentaire libre (optionnel)…"
                  rows={2}
                  style={{
                    width: '100%', padding: '8px 10px', fontFamily: 'IM Fell English, serif',
                    fontStyle: 'italic', fontSize: 12, color: 'var(--encre)',
                    background: 'var(--creme)', border: '1px dashed hsl(var(--border))',
                    outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10,
                  }}
                />

                <button
                  onClick={() => handleSave(c)}
                  disabled={!form.note_ponctualite || saving[c.id]}
                  style={{
                    background: form.note_ponctualite ? 'var(--bordeaux)' : 'transparent',
                    color: form.note_ponctualite ? 'var(--creme)' : 'hsl(var(--muted-foreground))',
                    border: form.note_ponctualite ? 'none' : '1px dashed hsl(var(--border))',
                    padding: '8px 18px', fontFamily: 'Special Elite, monospace',
                    fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                    cursor: form.note_ponctualite ? 'pointer' : 'not-allowed',
                    opacity: saving[c.id] ? 0.6 : 1,
                  }}
                >
                  {saving[c.id] ? '⟳ Envoi…' : '✦ Enregistrer la note'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}