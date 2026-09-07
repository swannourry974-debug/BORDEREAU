import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionTitle from '@/components/shared/SectionTitle';
import CouponButton from '@/components/shared/CouponButton';
import ForfaitGrid from './ForfaitGrid';
import TransitOptions from './TransitOptions';
import JaugeBlock from './JaugeBlock';
import { useCart } from '@/lib/CartContext';
import { getComparativeSavings } from '@/lib/comparativeRates';
import { formatEuro, getBookPriceInfo } from '@/lib/bookPricing';
import { toast } from 'sonner';

const FORFAITS_MAP = {
  S: { express: 8.90, collecte: 6.90 },
  M: { express: 12.90, collecte: 9.90 },
  L: { express: 19.90, collecte: 14.90 },
};

export default function AddToCartForm({ book, selectedCity, selectedRelay, initialTransit = 'express', onItemAdded, onClose }) {
  const { addItem, items } = useCart();
  const [forfait, setForfait] = useState('S');
  const [transit, setTransit] = useState(initialTransit);
  const [adresse, setAdresse] = useState('');

  useEffect(() => {
    if (book) setTransit(initialTransit);
  }, [book?.id, initialTransit]);

  const prixLivraison = FORFAITS_MAP[forfait]?.[transit] ?? 8.90;
  const prixLivreInfo = getBookPriceInfo(book);
  const prixLivre = prixLivreInfo.value;
  const prixLivreARembourser = !prixLivreInfo.available;
  const prixVal = prixLivre + prixLivraison;
  const relayLabel = selectedRelay?.name ? `${selectedRelay.name}, ${selectedCity?.label || ''}` : '';
  const destinationLabel = adresse || relayLabel || selectedCity?.label || 'Miami, FL — USA';
  const comparative = getComparativeSavings(destinationLabel, prixLivraison);

  const handleForfaitSelect = (f) => setForfait(f.id);

  const handleAddToCart = async () => {
    await addItem({ book, forfait, transit, adresse: destinationLabel, selectedCity, selectedRelay, prixLivre, prixLivraison, prixLivreARembourser, prixVal, comparative });
    toast.success(`"${book.title}" ajouté au panier !`, {
      description: `${prixLivreARembourser ? 'Livraison seule' : `Livre ${formatEuro(prixLivre)}`} + livraison ${formatEuro(prixLivraison)}`,
    });
    onClose();
    onItemAdded?.();
  };

  return (
    <AnimatePresence>
      {book && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-papier border-2 border-encre p-5 shadow-[5px_5px_0_rgba(26,16,8,0.2)] mb-5 relative">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[12px] tracking-[2px] text-foreground/50 uppercase font-typewriter">Ajouter au panier</div>
                <div className="font-serif text-[16px] font-bold">{book.title}</div>
                {book.author && <div className="font-fell italic text-[12px] text-foreground/55">{book.author}</div>}
              </div>
              <button onClick={onClose} className="text-bordeaux text-[18px] leading-none cursor-pointer bg-transparent border-none p-0 hover:opacity-70">✕</button>
            </div>

            <SectionTitle>Forfait</SectionTitle>
            <ForfaitGrid selected={forfait} onSelect={handleForfaitSelect} transit={transit} />

            <SectionTitle>Mode de transit</SectionTitle>
            <TransitOptions selected={transit} onSelect={setTransit} />

            <JaugeBlock />

            <div className="mb-[14px]">
              <label className="block text-[9px] tracking-[2px] uppercase text-foreground/55 mb-[5px] font-typewriter">
                Adresse de livraison
              </label>
              <input
                type="text"
                value={adresse}
                onChange={e => setAdresse(e.target.value)}
                placeholder={selectedRelay?.name || 'Point relais Miami...'}
                className="w-full bg-creme border border-foreground/35 px-3 py-[9px] font-typewriter text-[13px] text-foreground outline-none focus:border-bordeaux"
              />
            </div>

            {/* Total */}
            <div className="border-t-[1.5px] border-dashed border-foreground/30 pt-[14px] mt-[14px]">
              <div className="space-y-2 font-typewriter text-[11px] tracking-[1.2px]">
                <div className="flex justify-between"><span>Prix du livre Google</span><strong>{prixLivreARembourser ? 'Indisponible' : formatEuro(prixLivre)}</strong></div>
                <div className="flex justify-between"><span>Livraison Bordero <span className="text-[#2d6a2d]">(gain estimé {comparative.savings.toFixed(0)} €)</span></span><strong>{formatEuro(prixLivraison)}</strong></div>
                {prixLivreARembourser && <div className="font-fell italic text-[11px] tracking-normal text-foreground/55">Prix Google indisponible : le livre sera régularisé sur justificatif.</div>}
              </div>
              <div className="flex justify-between items-center mt-[14px]">
                <div>
                  <div className="text-[11px] tracking-[1.5px] uppercase font-typewriter">Total séquestre</div>
                  <div className="text-[9px] text-foreground/40 mt-[2px] italic font-fell">Livre + livraison, libéré selon validation</div>
                </div>
                <div className="font-serif text-[28px] font-bold text-bordeaux">{formatEuro(prixVal)}</div>
              </div>
            </div>

            <div className="mt-3 bg-[#fff7ed] border border-[#C2410C]/40 px-3 py-2 text-[11px] text-encre">
              <div className="font-typewriter uppercase tracking-[1.5px] text-[#C2410C] mb-1">Gain comparatif</div>
              <div className="font-fell italic leading-relaxed">
                Économie estimée de <strong>{comparative.savings.toFixed(0)} €</strong> sur la livraison vs la solution classique la moins chère pour {comparative.destination}.
              </div>
              <div className="font-typewriter text-[9px] text-foreground/45 mt-1">
                Référence lot 20 kg : Colissimo {comparative.colissimo.toFixed(2)} €, DHL dès {comparative.dhlMin} €, fret dès {comparative.fretMin} €.
              </div>
            </div>

            <div className="mt-4 flex gap-[10px]">
              <CouponButton onClick={handleAddToCart} className="flex-1 py-3">
                🛒 Ajouter au panier {items.length > 0 && `(${items.length + 1} articles)`}
              </CouponButton>
              <CouponButton secondary onClick={onClose}>Annuler</CouponButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}