import React from 'react';
import { motion } from 'framer-motion';

export default function BorderoBook({ title, author, color = 'var(--bordeaux)', selected, onClick, delay = 0 }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ y: 22, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className="relative flex h-40 w-16 items-center justify-center overflow-hidden rounded-[10px] px-2 py-4 shadow-[0_12px_26px_rgba(46,17,17,0.28)]"
      style={{ background: color, color: 'var(--creme)', border: selected ? '2px solid var(--or-clair)' : '1px solid rgba(200,161,101,0.38)' }}
    >
      <span className="absolute inset-y-3 left-2 w-px bg-[#D8B87A]/35" />
      <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-bold leading-tight">{title}</span>
      {author && <span className="absolute bottom-2 left-2 right-2 h-[2px] bg-[#C8A165]/70" />}
    </motion.button>
  );
}