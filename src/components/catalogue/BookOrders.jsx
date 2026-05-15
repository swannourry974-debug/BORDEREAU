import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const STATUT_LABEL = {
  payee: 'Payée',
  en_transit: 'En transit',
  au_relais: 'Au relais',
  livree: 'Livrée ✓',
  en_attente_paiement: 'En attente',
};

const STATUT_COLOR = {
  payee: 'var(--bordeaux)',
  en_transit: '#1a3a5c',
  au_relais: 'var(--sepia)',
  livree: '#2d6a2d',
  en_attente_paiement: 'rgba(26,16,8,0.4)',
};

export default function BookOrders({ book, onOrder, onClose }) {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!book) return;
    setLoading(true);
    // Chercher les commandes pour ce titre (insensible à la casse, partiel)
    base44.entities.Commande.list('-created_date', 20)
      .then(all => {
        const titre = book.title?.toLowerCase() || '';
        const filtered = all.filter(c =>
          c.livre_titre?.toLowerCase().includes(titre) ||
          titre.includes(c.livre_titre?.toLowerCase() || '')
        );
        setCommandes(filtered);
      })
      .finally(() => setLoading(false));
  }, [book?.title]);

  if (!book) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div style={{
          background: 'var(--papier)', border: '2px solid var(--encre)',
          padding: '18px', marginBottom: 16,
          boxShadow: '4px 4px 0 rgba(26,16,8,0.15)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.45)', marginBottom: 3 }}>
                Commandes pour ce livre
              </div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700 }}>{book.title}</div>
              {book.author && <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.5)', marginTop: 1 }}>{book.author}</div>}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--bordeaux)', lineHeight: 1 }}>✕</button>
          </div>

          {/* Liste commandes */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.4)' }}>
              Chargement…
            </div>
          ) : commandes.length === 0 ? (
            <div style={{
              background: 'rgba(26,16,8,0.03)', border: '1px dashed rgba(26,16,8,0.2)',
              padding: '18px', textAlign: 'center', marginBottom: 14,
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>📭</div>
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.45)' }}>
                Soyez le premier à commander ce livre !
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', marginBottom: 10 }}>
                {commandes.length} commande{commandes.length > 1 ? 's' : ''} récente{commandes.length > 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {commandes.map(c => {
                  const statut = c.statut || 'payee';
                  const color = STATUT_COLOR[statut] || 'var(--bordeaux)';
                  const date = c.created_date
                    ? new Date(c.created_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                    : '';
                  return (
                    <div key={c.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px',
                      background: 'rgba(26,16,8,0.03)',
                      borderLeft: `3px solid ${color}`,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, color: 'rgba(26,16,8,0.6)' }}>
                          {c.zone_nom || '—'} · {c.mode_livraison === 'express' ? '⚡ Express' : '📦 Collectif'}
                        </div>
                        {date && <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, color: 'rgba(26,16,8,0.35)', marginTop: 2 }}>{date}</div>}
                      </div>
                      <div style={{
                        fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1,
                        textTransform: 'uppercase', color, border: `1px solid ${color}`,
                        padding: '2px 7px',
                      }}>
                        {STATUT_LABEL[statut] || statut}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Séparateur */}
          <div style={{ height: 1, background: 'repeating-linear-gradient(90deg, rgba(26,16,8,0.15) 0, rgba(26,16,8,0.15) 4px, transparent 4px, transparent 8px)', marginBottom: 14 }} />

          {/* CTA */}
          <button
            onClick={onOrder}
            style={{
              width: '100%', background: 'var(--bordeaux)', color: 'var(--creme)',
              border: 'none', padding: '12px 16px', cursor: 'pointer',
              fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 2,
              textTransform: 'uppercase', boxShadow: '3px 3px 0 rgba(90,0,21,0.4)',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
            }}
          >
            ✦ Commander ce livre
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}