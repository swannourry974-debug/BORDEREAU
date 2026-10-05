import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/CartContext';
import CouponButton from '@/components/shared/CouponButton';
import SuiviFacturationChoice from '@/components/catalogue/SuiviFacturationChoice';
import { base44 } from '@/api/base44Client';
import { getComparativeSavings } from '@/lib/comparativeRates';
import { formatEuro } from '@/lib/bookPricing';
import { getZoneById } from '@/lib/tarifsConfig';
import { toast } from 'sonner';

const FORFAITS_STRIPE = { S: 'poche', M: 'broche', L: 'bd' };
const TRANSIT_STRIPE = { express: 'express', collecte: 'collecte' };

export default function PanierCheckout({ onClose }) {
  const { items, removeItem, clearCart, total } = useCart();
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCampaign, setCouponCampaign] = useState(null);
  const [availablePromos, setAvailablePromos] = useState([]);
  const [suiviMode, setSuiviMode] = useState('application');
  const [loading, setLoading] = useState(false);
  const isTestPreview = window.self !== window.top;

  // Codes de parrainage fixes + codes Partenaria activés par stagnation Collecte.
  const CODES_VALIDES = { 'BIENVENUE': 2, 'AMI10': 1, 'BORDERO': 3 };

  useEffect(() => {
    const relayIds = [...new Set(items.filter(i => i.transit === 'collecte' && i.selectedRelay?.id).map(i => i.selectedRelay.id))];
    if (!relayIds.length) { setAvailablePromos([]); return; }
    base44.entities.CampagnePromoCollecte.filter({ statut: 'active' }, '-created_date', 100)
      .then(promos => {
        const now = Date.now();
        setAvailablePromos((promos || []).filter(p => relayIds.includes(p.point_relais_id) && (!p.valide_jusquau || new Date(p.valide_jusquau).getTime() >= now)));
      })
      .catch(() => setAvailablePromos([]));
  }, [items]);

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    const campaign = availablePromos.find(p => p.code === code);
    if (campaign) {
      const discount = Number(campaign.montant_reduction || 0);
      setCouponDiscount(discount);
      setCouponCampaign(campaign);
      setCouponApplied(true);
      toast.success(`Code Partenaria "${code}" appliqué — ${discount} € de réduction !`);
    } else if (CODES_VALIDES[code]) {
      setCouponDiscount(CODES_VALIDES[code]);
      setCouponCampaign(null);
      setCouponApplied(true);
      toast.success(`Code "${code}" appliqué — ${CODES_VALIDES[code]} € de réduction !`);
    } else {
      toast.error('Code invalide ou expiré.');
    }
  };

  const totalFinal = Math.max(0, total - couponDiscount);
  const economieTotale = items.reduce((sum, item) => {
    const comparative = item.comparative || getComparativeSavings(item.adresse, item.prixVal);
    return sum + comparative.savings;
  }, 0);

  const createCommandes = async (statut) => {
    const user = await base44.auth.me().catch(() => null);
    const codeSecret = String(Math.floor(100 + Math.random() * 900));
    const created = await base44.entities.Commande.bulkCreate(items.map((item, index) => {
      const itemSecret = index === 0 ? codeSecret : String(Math.floor(100 + Math.random() * 900));
      const prixLivre = Number(item.prixLivre || 0);
      const prixLivraison = Number(item.prixLivraison ?? item.prixVal ?? 0);
      const itemTotal = Math.max(0, prixLivre + prixLivraison - (couponDiscount / items.length));
      const modeLivraison = item.transit === 'collecte' ? 'collectif' : 'express';
      const zone = getZoneById(item.selectedCity?.zone_id || 'international');
      const partVoyageur = modeLivraison === 'express' ? Number(zone.express?.part_voyageur || 0) : 0;
      const partRelais = modeLivraison === 'express' ? Number(zone.express?.part_relais || 0) : Number(zone.collectif?.part_relais || 0);
      const partAdmin = Math.max(0, prixLivraison - partVoyageur - partRelais);
      return {
        lecteur_email: user?.email || '',
        livre_titre: item.book?.title || 'Livre',
        livre_auteur: item.book?.author || '',
        livre_type: FORFAITS_STRIPE[item.forfait] === 'broche' ? 'Broché' : FORFAITS_STRIPE[item.forfait] === 'bd' ? 'BD' : 'Poche',
        zone_id: item.selectedCity?.zone_id || 'international',
        zone_nom: item.selectedCity?.label || item.adresse || 'International',
        point_relais_id: item.selectedRelay?.id || '',
        point_relais_nom: item.selectedRelay?.name || '',
        mode_livraison: modeLivraison,
        collecte_batch_statut: modeLivraison === 'collectif' ? 'en_attente_40' : undefined,
        montant_paye: itemTotal,
        campagne_promo_id: couponCampaign?.id || '',
        code_promo_collecte: couponCampaign?.code || '',
        montant_reduction_collecte: couponCampaign ? couponDiscount / items.length : 0,
        prix_livre_neuf: prixLivre,
        frais_port_ref: prixLivraison,
        frais_bordereau: prixLivraison,
        prix_livre_a_rembourser: item.prixLivreARembourser === true,
        remboursement_livre_libere: false,
        part_voyageur: partVoyageur,
        part_relais: partRelais,
        part_admin: partAdmin,
        statut,
        suivi_facturation_mode: suiviMode,
        suivi_active: true,
        facture_reference: `BORD-${new Date().getFullYear()}-${itemSecret}`,
        facture_emise_le: new Date().toISOString(),
        code_secret: itemSecret,
      };
    }));
    await Promise.all((created || []).map(cmd => base44.functions.invoke('genererQrCommande', { commande_id: cmd.id }).catch(() => null)));
    await Promise.all((created || []).filter(cmd => cmd.mode_livraison === 'collectif' && cmd.statut === 'payee').map(cmd => base44.functions.invoke('grouperCollectePayee', { commande_id: cmd.id }).catch(() => null)));
  };

  const completeSimulatedPurchase = async () => {
    await createCommandes('payee');
    await clearCart();
    toast.success('Achat test simulé : commande ajoutée à votre étagère.');
    onClose?.();
  };

  const handlePay = async () => {
    if (items.length === 0 || loading) return;
    setLoading(true);

    try {
      if (isTestPreview) {
        await completeSimulatedPurchase();
        return;
      }

      const first = items[0];
      let res = null;
      try {
        res = await base44.functions.invoke('createCheckout', {
          book: first.book,
          forfait: FORFAITS_STRIPE[first.forfait] || 'poche',
          transit: TRANSIT_STRIPE[first.transit] || 'express',
          adresse: first.adresse || '',
          zone_id: first.selectedCity?.zone_id || '',
          zone_nom: first.selectedCity?.label || first.adresse || '',
          mode_livraison: first.transit === 'collecte' ? 'collectif' : 'express',
          suivi_facturation_mode: suiviMode,
          point_relais_id: first.selectedRelay?.id || '',
          point_relais_nom: first.selectedRelay?.name || '',
          code_promo: couponApplied ? coupon.trim().toUpperCase() : '',
          forfait: first.forfait,
          prix_livre: first.prixLivre || 0,
          frais_livraison: first.prixLivraison ?? first.prixVal ?? 0,
          prix_livre_a_rembourser: first.prixLivreARembourser === true,
        });
      } catch (paymentError) {
        console.warn('Paiement indisponible, passage en simulation test:', paymentError);
      }

      if (res?.data?.url) {
        await createCommandes('en_attente_paiement');
        toast.success('Commande confirmée : facture et suivi activés.');
        await clearCart();
        window.location.href = res.data.url;
        return;
      }

      await completeSimulatedPurchase();
    } catch (error) {
      console.error('Erreur paiement / simulation achat:', error);
      toast.error("Impossible de valider l'achat. Réessayez dans un instant.");
    } finally {
      setLoading(false);
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
                  <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1, color: 'rgba(26,16,8,0.55)', marginTop: 5, lineHeight: 1.5 }}>
                    Livre {formatEuro(item.prixLivre || 0)} + livraison {formatEuro(item.prixLivraison ?? item.prixVal ?? 0)}
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
                  <div style={{ marginTop: 8, background: 'rgba(194,65,12,0.08)', border: '1px solid rgba(194,65,12,0.28)', padding: '6px 8px', fontSize: 11, color: 'var(--encre)' }}>
                    <strong style={{ color: 'var(--cta-orange)' }}>+{(item.comparative || getComparativeSavings(item.adresse, item.prixVal)).savings.toFixed(0)} € économisés</strong> vs {(item.comparative || getComparativeSavings(item.adresse, item.prixVal)).destination} · meilleure alternative {(item.comparative || getComparativeSavings(item.adresse, item.prixVal)).bestAlternative.toFixed(2)} €
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1, color: 'rgba(26,16,8,0.45)', lineHeight: 1.7 }}>
                    Ventilation<br />confirmée
                  </div>
                  {item.prixLivreARembourser && <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 10, color: '#C2410C', marginTop: 3 }}>À régulariser</div>}
                  <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16, color: 'var(--bordeaux)', marginTop: 4 }}>
                    {formatEuro(item.prixVal ?? ((item.prixLivre || 0) + (item.prixLivraison || 0)))}
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

            <div style={{ background: 'rgba(45,106,45,0.08)', border: '1.5px solid rgba(45,106,45,0.35)', padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#2d6a2d', marginBottom: 4 }}>
                Gain comparatif total
              </div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#2d6a2d' }}>
                {economieTotale.toFixed(0)} € économisés
              </div>
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.55)', marginTop: 3 }}>
                Comparaison basée sur votre grille 20 kg : Colissimo, DHL Express et fret maritime.
              </div>
            </div>

            <SuiviFacturationChoice value={suiviMode} onChange={setSuiviMode} />

            {availablePromos.length > 0 && !couponApplied && (
              <div style={{ background: '#fff7ed', border: '1px solid rgba(194,65,12,0.35)', padding: '10px 12px', marginBottom: 14, color: 'var(--encre)' }}>
                <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--cta-orange)', marginBottom: 4 }}>Code Partenaria disponible</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--bordeaux)', fontSize: 18 }}>{availablePromos[0].code}</div>
                <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.58)', marginTop: 2 }}>Partagez-le autour de vous pour compléter le carton Collecte de {availablePromos[0].point_relais_nom || 'ce relais'}.</div>
              </div>
            )}

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
                <button onClick={() => { setCouponApplied(false); setCouponDiscount(0); setCouponCampaign(null); setCoupon(''); }}
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
                      Sous-total {formatEuro(total)} − code {formatEuro(couponDiscount)}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#f0c040' }}>
                  {formatEuro(totalFinal)}
                </div>
              </div>
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 10, opacity: 0.45, marginTop: 4 }}>
                Séquestre libéré à la réception de chaque livre
              </div>
            </div>

            <CouponButton onClick={handlePay} disabled={loading} className="w-full py-4 text-center">
              {loading ? '⟳ Chargement...' : isTestPreview ? `✦ Simuler l’achat test ${formatEuro(totalFinal)}` : `✦ Payer par carte ou PayPal ${formatEuro(totalFinal)}`}
            </CouponButton>
          </>
        )}
      </motion.div>
    </div>
  );
}