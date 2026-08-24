import React from 'react';
import { motion } from 'framer-motion';

export default function BookSpine({ book, index, added, selected, onClick }) {
  const height = 118 + ((book.title?.length || 8) % 4) * 14;
  const width = 56 + (index % 3) * 8;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={added ? { y: 180, rotate: -9, opacity: 0 } : { y: 14, opacity: 0 }}
      animate={{ y: 0, rotate: index % 2 ? 1.5 : -1, opacity: 1 }}
      transition={{ duration: added ? 0.9 : 0.35, delay: added ? 0.05 : index * 0.04, type: 'spring', stiffness: 90 }}
      className="relative flex items-center justify-center px-2 pb-3 pt-4 shadow-lg text-left overflow-hidden"
      style={{ width, height, background: book.color, color: '#F5E6CC', border: selected ? '2px solid #C8A165' : '1px solid rgba(245,230,204,0.22)' }}
    >
      <span className="absolute inset-y-2 left-2 w-[1px] bg-white/18" />
      <span className="absolute inset-x-2 top-2 h-[1px] bg-[#C8A165]/45" />
      <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-bold leading-tight tracking-[0.5px] line-clamp-6">{book.title}</span>
      <span className="absolute bottom-2 left-2 right-2 h-[3px] bg-[#C8A165]/75" />
    </motion.button>
  );
}