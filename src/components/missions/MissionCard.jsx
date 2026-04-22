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
      className="bg-papier border-[1.5px] border-encre p-4 mb-3 relative shadow-[3px_3px_0_rgba(26,16,8,0.12)]"
    >
      {/* Corner fold */}
      <span className="absolute top-0 right-0 w-0 h-0 border-solid border-t-0 border-r-[32px] border-b-[32px] border-l-0 border-transparent border-r-bordeaux" />

      <div className="font-typewriter text-[18px] tracking-[3px] uppercase mb-1">{mission.city}</div>
      <div className="font-fell italic text-[12px] text-foreground/55 mb-3">
        {accepted ? 'Ticket scanné · Achat confirmé' : mission.date}
      </div>
      <div className="text-[12px] text-foreground/60">
        <span>📚</span> <em className="font-fell">{mission.bookTitle}</em> · {mission.bookType} · {mission.weight}
      </div>

      <div className="flex items-center justify-between border-t border-dashed border-foreground/20 pt-[10px] mt-2">
        <div>
          <span className={`font-serif text-[22px] font-bold ${accepted ? 'text-foreground/40' : 'text-bordeaux'}`}>
            {mission.commission}
          </span>
          <span className="block text-[9px] text-foreground/50 tracking-[1px] -mt-[2px]">
            {accepted ? 'En séquestre' : 'Commission'}
          </span>
        </div>
        {accepted ? (
          <CouponButton secondary disabled className="opacity-50 cursor-not-allowed">
            ENGAGÉ
          </CouponButton>
        ) : (
          <CouponButton onClick={handleAccept} disabled={accepting}>
            {accepting ? '⟳ ...' : 'Accepter'}
          </CouponButton>
        )}
      </div>

      {/* Stamp */}
      {accepted && (
        <div className="absolute right-[14px] top-1/2 -translate-y-1/2 -rotate-12 border-[3px] border-[#1a3a5c] text-[#1a3a5c] font-typewriter text-[9px] tracking-[2px] uppercase px-2 py-1 opacity-70 pointer-events-none"
          style={{ animation: !mission.engaged ? 'stampIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards' : undefined }}
        >
          ENGAGÉ
        </div>
      )}
    </motion.div>
  );
}