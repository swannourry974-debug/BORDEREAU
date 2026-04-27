import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionTitle from '@/components/shared/SectionTitle';
import CouponButton from '@/components/shared/CouponButton';
import ForfaitGrid from './ForfaitGrid';
import TransitOptions from './TransitOptions';
import JaugeBlock from './JaugeBlock';

export default function CommandeForm({ book, onClose, onConfirm }) {
  const [forfait, setForfait] = useState('S');
  const [transit, setTransit] = useState('express');
  const [totalAmount, setTotalAmount] = useState('8,90€');
  const [confirming, setConfirming] = useState(false);

  const handleForfaitSelect = (f) => {
    setForfait(f.id);
    setTotalAmount(f.price);
  };

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      onConfirm();
    }, 1500);
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
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[12px] tracking-[2px] text-foreground/50 uppercase font-typewriter">Commander</div>
                <div className="font-serif text-[16px] font-bold">{book.title}</div>
              </div>
              <button onClick={onClose} className="text-bordeaux text-[18px] leading-none cursor-pointer bg-transparent border-none p-0 hover:opacity-70">
                ✕
              </button>
            </div>

            <SectionTitle>Forfait</SectionTitle>
            <ForfaitGrid selected={forfait} onSelect={handleForfaitSelect} />

            <SectionTitle>Mode de transit</SectionTitle>
            <TransitOptions selected={transit} onSelect={setTransit} />

            <JaugeBlock />

            <div className="mb-[14px]">
              <label className="block text-[9px] tracking-[2px] uppercase text-foreground/55 mb-[5px] font-typewriter">
                Adresse de livraison
              </label>
              <input
                type="text"
                placeholder="Point relais Miami..."
                className="w-full bg-creme border border-foreground/35 px-3 py-[9px] font-typewriter text-[13px] text-foreground outline-none focus:border-bordeaux"
              />
            </div>

            <div className="flex justify-between items-center border-t-[1.5px] border-dashed border-foreground/30 pt-[14px] mt-[14px]">
              <div>
                <div className="text-[11px] tracking-[1.5px] uppercase font-typewriter">Total séquestre</div>
                <div className="text-[9px] text-foreground/40 mt-[2px] italic font-fell">Libéré à la réception</div>
              </div>
              <div className="font-serif text-[28px] font-bold text-bordeaux">{totalAmount}</div>
            </div>

            <div className="mt-4 flex gap-[10px]">
              <CouponButton
                onClick={handleConfirm}
                disabled={confirming}
                className="flex-1 py-3"
              >
                {confirming ? '⟳ Traitement...' : '✦ Confirmer & Payer'}
              </CouponButton>
              <CouponButton secondary onClick={onClose}>Annuler</CouponButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}