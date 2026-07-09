import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/CartContext';
import CouponButton from '@/components/shared/CouponButton';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const FORFAITS_STRIPE = { S: 'poche', M: 'broche', L: 'bd' };
const TRANSIT_STRIPE = { express: 'express', collecte: 'collecte' };

export default function PanierCheckout({ onClose }) {
  const { items, removeItem, clearCart, total } = useCart();
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Codes de parrainage simulés (à connecter à une entité si nécessaire)
  const CODES_VALIDES = { 'BIENVENUE': 2, 'AMI10': 1, 'BORDERO': 3 };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (CODES_VALIDES[code]) {
      setCouponDiscount(CODES_VALIDES[code]);
      setCouponApplied(true);
      toast.success(`Code "${code}" appliqué — ${CODES_VALIDES[code]} € de réduction !`);
    } else {
      toast.error('Code invalide ou expiré.');
    }
  };

  const totalFinal = Math.max(0, total - couponDiscount);

  const handlePay = async () => {
    if (items.length === 0) return;

    // Vérifier iframe
    if (window.self !== window.top) {
      alert("Le paiement est uniquement disponible depuis l'application publiée.");
      return;
    }

    setLoading(true);
    // Pour l'instant on passe le premier livre — on pourrait créer une session multi-articles
    const first = items[0];
    const res = await base44.functions.invoke('createCheckout', {
      book: first.book,
      forfait: FORFAITS_STRIPE[first.forfait] || 'poche',
      transit: TRANSIT_STRIPE[first.transit] || 'express',
      adresse: first.adresse || '',
      zone_nom: '',
    });
    setLoading(false);

    if (res?.data?.url) {
      clearCart();
      window.location.href = res.data.url;
    } else {
      toast.error('Erreur lors de la création du paiement.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,16,8,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{ background: 'var(--creme)', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', padding: 24, paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 2 }}>Mon panier</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700 }}>
              {items.length} livre{items.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--bordeaux)' }}>✕</button>
        </div>

        {/* Liste des articles */}
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: 'IM Fell English, serif', fontStyle: 'italic', color: 'rgba(26,16,8,0.4)', fontSize: 14 }}>
            Votre panier est vide.
          </div>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.cartId} style={{
                background: 'var(--papier)', border: '1.5px solid rgba(26,16,8,0.2)',
                padding: '12px 14px', marginBottom: 10,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 13 }}>{item.book.title}</div>
                  <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.5)', marginTop: 2 }}>
                    {item.book.author}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1, border: '1px solid rgba(26,16,8,0.3)', padding: '1px 6px' }}>
                      Forfait {item.forfait}
                    </span>
                    <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1, border: '1px solid rgba(26,16,8,0.3)', padding: '1px 6px' }}>
                      {item.transit === 'express' ? '✈ Express' : '📦 Collectif'}
                    </span>
                    {item.adresse && (
                      <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1, color: 'rgba(26,16,8,0.5)', padding: '1px 6px' }}>
                        📍 {item.adresse}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16, color: 'var(--bordeaux)' }}>
                    {item.prixVal.toFixed(2)} €
                  </div>
                  <button
                    onClick={() => removeItem(item.cartId)}
                    style={{ marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1, color: '#b41414', textDecoration: 'underline' }}
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))}

            {/* Séparateur */}
            <div style={{ height: 1, background: 'repeating-linear-gradient(90deg, rgba(26,16,8,0.15) 0, rgba(26,16,8,0.15) 4px, transparent 4px, transparent 8px)', margin: '16px 0' }} />

            {/* Code de parrainage */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.55)', marginBottom: 6 }}>
                Code de parrainage / réduction
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value)}
                  placeholder="BIENVENUE…"
                  disabled={couponApplied}
                  onKeyDown={e => e.key === 'Enter' && !couponApplied && applyCoupon()}
                  style={{
                    flex: 1, background: 'var(--creme)', border: couponApplied ? '1.5px solid #2d6a2d' : '1.5px solid rgba(26,16,8,0.3)',
                    padding: '8px 12px', fontFamily: 'Special Elite, monospace', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1,
                    outline: 'none', color: couponApplied ? '#2d6a2d' : 'var(--encre)',
                  }}
                />
                {!couponApplied ? (
                  <button
                    onClick={applyCoupon}
                    style={{
                      background: 'var(--encre)', color: 'var(--creme)', border: 'none', padding: '8px 14px',
                      fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
                    }}
                  >
                    Appliquer
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2d6a2d', fontFamily: 'Special Elite, monospace', fontSize: 11 }}>
                    ✓ −{couponDiscount} €
                  </div>
                )}
              </div>
              {couponApplied && (
                <button onClick={() => { setCouponApplied(false); setCouponDiscount(0); setCoupon(''); }}
                  style={{ marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, fontFamily: 'Special Elite, monospace', letterSpacing: 1, color: 'rgba(26,16,8,0.45)', textDecoration: 'underline' }}>
                  Retirer le code
                </button>
              )}
            </div>

            {/* Total */}
            <div style={{ background: 'var(--encre)', color: 'var(--creme)', padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.6, marginBottom: 4 }}>
                    Total à régler
                  </div>
                  {couponApplied && (
                    <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, opacity: 0.5, marginTop: 2 }}>
                      Sous-total {total.toFixed(2)} € − code {couponDiscount} €
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#f0c040' }}>
                  {totalFinal.toFixed(2)} €
                </div>
              </div>
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 10, opacity: 0.45, marginTop: 4 }}>
                Séquestre libéré à la réception de chaque livre
              </div>
            </div>

            <CouponButton onClick={handlePay} disabled={loading} className="w-full py-4 text-center">
              {loading ? '⟳ Chargement...' : `✦ Valider & Payer ${totalFinal.toFixed(2)} €`}
            </CouponButton>
          </>
        )}
      </motion.div>
    </div>
  );
}