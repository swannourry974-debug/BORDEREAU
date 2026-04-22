import React from 'react';
import { motion } from 'framer-motion';

export default function StockItem({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="bg-papier border border-foreground/20 border-l-4 border-l-sepia p-3 px-[14px] mb-[10px] flex items-center gap-3"
    >
      <span className="text-[20px]">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="font-serif text-[13px] font-bold">{item.title}</div>
        <div className="text-[10px] text-foreground/50">{item.depositor}</div>
      </div>
      <div className="text-[8px] tracking-[1.5px] uppercase px-[7px] py-[2px] border border-sepia text-sepia flex-shrink-0">
        EN ATTENTE
      </div>
    </motion.div>
  );
}