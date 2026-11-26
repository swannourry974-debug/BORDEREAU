import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CouponButton from '@/components/shared/CouponButton';
import { toast } from 'sonner';

export default function MissionCard({ mission, index }) {
  const [accepted, setAccepted] = useState(mission.engaged);
  const [accepting, setAccepting] = useState(false);

  const handleAccept = () => {
    setAccepting(true);
    setTimeout(() => {
      setAccepted(true);
      setAccepting(false);
      toast.success('Mission acceptée !', {
        description: 'Scannez votre ticket de caisse pour confirmer l\'achat.',
      });
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: accepted ? 0.75 : 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="bordero-surface relative mb-3 p-4"
    >
      {/* Coin corné */}
      <span
        className="absolute right-0 top-0 h-0 w-0"
        style={{ borderStyle: 'solid', borderWidth: '0 32px 32px 0', borderColor: 'transparent var(--sepia) transparent transparent' }}
      />

      <div className="bordero-ui mb-1 text-[18px] uppercase tracking-[3px]" style={{ color: 'var(--bordeaux)' }}>{mission.city}</div>
      <div className="bordero-copy mb-3 text-[12px] italic">
        {accepted ? 'Ticket scanné · Achat confirmé' : mission.date}
      </div>
      <div className="text-[12px]" style={{ color: 'var(--encre-douce)' }}>
        <span>📚</span> <em className="bordero-copy">{mission.bookTitle}</em> · {mission.bookType} · {mission.weight}
      </div>

      <div className="mt-2 flex items-center justify-between pt-[10px]" style={{ borderTop: '1px dashed var(--bordero-line)' }}>
        <div>
          <span className="bordero-title text-[22px]" style={{ color: accepted ? 'var(--encre-douce)' : 'var(--bordeaux)' }}>
            {mission.commission}
          </span>
          <span className="bordero-ui -mt-[2px] block text-[9px] tracking-[1px]" style={{ color: 'var(--encre-douce)' }}>
            {accepted ? 'En séquestre' : 'Commission'}
          </span>
        </div>
        {accepted ? (
          <CouponButton secondary disabled className="cursor-not-allowed opacity-50">
            ENGAGÉ
          </CouponButton>
        ) : (
          <CouponButton onClick={handleAccept} disabled={accepting}>
            {accepting ? '⟳ …' : 'Accepter'}
          </CouponButton>
        )}
      </div>

      {/* Tampon */}
      {accepted && (
        <div
          className="bordero-ui pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 -rotate-12 px-2 py-1 text-[9px] uppercase tracking-[2px]"
          style={{
            border: '3px solid var(--statut-transit)',
            color: 'var(--statut-transit)',
            opacity: 0.7,
            animation: !mission.engaged ? 'stampIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards' : undefined,
          }}
        >
          ENGAGÉ
        </div>
      )}
    </motion.div>
  );
}
