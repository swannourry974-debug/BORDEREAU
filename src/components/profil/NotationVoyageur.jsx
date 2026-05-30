import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function EtoilesInput({ value, onChange, label }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 28, padding: '2px 1px', lineHeight: 1,
              color: star <= (hover || value) ? '#8B6914' : 'rgba(26,16,8,0.18)',
              transition: 'color 0.1s, transform 0.1s',
              transform: star <= (hover || value) ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            ★
          </button>
        ))}
        <span style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.4)', alignSelf: 'center', marginLeft: 4 }}>
          {value ? `${value}/5` : '—'}
        </span>
      </div>
    </div>
  );
}

export default function NotationVoyageur({ commande, onDone }) {
  const [notePonctualite, setNotePonctualite] = useState(0);
  const [noteSoin, setNoteSoin] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [dejaNote, setDejaNote] = useState(false);
  const [noteExistante, setNoteExistante] = useState(null);

  useEffect(() => {
    if (!commande?.id) return;
    base44.entities.NotationVoyageur.filter({ commande_id: commande.id })
      .then(res => {
        if (res?.length > 0) {
          setDejaNote(true);
          setNoteExistante(res[0]);
          setNotePonctualite(res[0].note_ponctualite || 0);
          setNoteSoin(res[0].note_soin || 0);
          setCommentaire(res[0].commentaire || '');
        }
      })
      .catch(() => {});
  }, [commande?.id]);

  const handleSubmit = async () => {
    if (!notePonctualite) {
      toast.error('Veuillez attribuer au moins une note de ponctualité.');
      return;
    }
    setLoading(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.NotationVoyageur.create({
        mission_id: commande.mission_id || '',
        commande_id: commande.id,
        voyageur_email: commande.voyageur_email || '',
        lecteur_email: user.email,
        note_ponctualite: notePonctualite,
        note_soin: noteSoin || null,
        commentaire: commentaire.trim() || null,
        livre_titre: commande.livre_titre,
      });
      toast.success('Merci pour votre avis !');
      setDejaNote(true);
      onDone?.();
    } catch {
      toast.error('Erreur lors de l\'envoi. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  // Affichage si déjà noté
  if (dejaNote && noteExistante) {
    return (
      <div style={{
        background: 'rgba(45,106,45,0.06)', border: '1.5px solid rgba(45,106,45,0.4)',
        padding: '14px 16px',
      }}>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#2d6a2d', marginBottom: 8 }}>
          ✓ Avis déposé
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1, color: 'rgba(26,16,8,0.4)', textTransform: 'uppercase', marginBottom: 3 }}>Ponctualité</div>
            <div style={{ color: '#8B6914', fontSize: 16, letterSpacing: 2 }}>{'★'.repeat(noteExistante.note_ponctualite)}{'☆'.repeat(5 - noteExistante.note_ponctualite)}</div>
          </div>
          {noteExistante.note_soin > 0 && (
            <div>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1, color: 'rgba(26,16,8,0.4)', textTransform: 'uppercase', marginBottom: 3 }}>Soin du livre</div>
              <div style={{ color: '#8B6914', fontSize: 16, letterSpacing: 2 }}>{'★'.repeat(noteExistante.note_soin)}{'☆'.repeat(5 - noteExistante.note_soin)}</div>
            </div>
          )}
        </div>
        {noteExistante.commentaire && (
          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.55)', marginTop: 8 }}>
            "{noteExistante.commentaire}"
          </div>
        )}
      </div>
    );
  }

  // Formulaire de notation (seulement si commande livrée avec voyageur)
  if (!commande?.voyageur_email || commande.statut !== 'livree') return null;

  return (
    <div style={{
      background: 'var(--papier)', border: '1.5px dashed var(--sepia)',
      padding: '16px 16px 12px',
    }}>
      <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--sepia)', marginBottom: 14 }}>
        ✦ Évaluer votre voyageur
      </div>

      <EtoilesInput value={notePonctualite} onChange={setNotePonctualite} label="Ponctualité *" />
      <EtoilesInput value={noteSoin} onChange={setNoteSoin} label="Soin apporté au livre" />

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 6 }}>
          Commentaire (optionnel)
        </div>
        <textarea
          value={commentaire}
          onChange={e => setCommentaire(e.target.value)}
          placeholder="Ex : Livraison rapide, livre en parfait état…"
          rows={2}
          style={{
            width: '100%', padding: '9px 12px', resize: 'vertical',
            fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13,
            background: 'var(--creme)', border: '1px solid rgba(26,16,8,0.2)',
            color: 'var(--encre)', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !notePonctualite}
        style={{
          width: '100%', background: notePonctualite ? 'var(--bordeaux)' : 'rgba(26,16,8,0.15)',
          color: notePonctualite ? 'var(--creme)' : 'rgba(26,16,8,0.35)',
          border: 'none', padding: '11px 16px', cursor: notePonctualite ? 'pointer' : 'not-allowed',
          fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
          transition: 'all 0.15s',
        }}
      >
        {loading ? '⟳ Envoi…' : '✦ Déposer mon avis'}
      </button>
    </div>
  );
}