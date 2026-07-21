import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookOrders({ book, onOrder, onClose }) {
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

          <div style={{
            background: 'rgba(26,16,8,0.03)', border: '1px dashed rgba(26,16,8,0.2)',
            padding: '18px', textAlign: 'center', marginBottom: 14,
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>📭</div>
            <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.45)' }}>
              Les commandes des autres lecteurs restent privées.
            </div>
          </div>

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