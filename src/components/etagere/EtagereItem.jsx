import React from 'react';
import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  enVol: { dotClass: 'bg-[#1a3a5c] animate-[pulse-dot_2s_infinite]', borderColor: 'border-l-[#1a3a5c]', stampColor: 'border-[#1a3a5c] text-[#1a3a5c]' },
  auRelais: { dotClass: 'bg-sepia animate-[pulse-dot_1.5s_infinite]', borderColor: 'border-l-sepia', stampColor: 'border-sepia text-sepia' },
  paye: { dotClass: 'bg-bordeaux', borderColor: 'border-l-bordeaux', stampColor: 'border-bordeaux text-bordeaux' },
  recu: { dotClass: 'bg-[#2d6a2d]', borderColor: 'border-l-[#2d6a2d]', stampColor: 'border-[#2d6a2d] text-[#2d6a2d]' },
};

export default function EtagereItem({ item, index }) {
  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.paye;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`bg-papier border border-foreground/20 border-l-4 ${config.borderColor} p-3 px-[14px] mb-[10px] flex items-center gap-3`}
    >
      <span className={`w-[10px] h-[10px] rounded-full flex-shrink-0 ${config.dotClass}`} />
      <div className="flex-1 min-w-0">
        <div className="font-serif text-[13px] font-bold">{item.title}</div>
        <div className="text-[10px] text-foreground/50 mt-[2px]">{item.detail}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`text-[8px] tracking-[1.5px] uppercase px-[7px] py-[2px] border ${config.stampColor} inline-block`}>
          {item.statusLabel}
        </div>
        <div className="text-[9px] mt-1 text-foreground/40">{item.subDetail}</div>
      </div>
    </motion.div>
  );
}