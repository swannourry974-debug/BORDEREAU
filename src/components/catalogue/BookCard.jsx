import React from 'react';
import { motion } from 'framer-motion';

const COVER_COLORS = [
  'bg-gradient-to-br from-bordeaux to-bordeaux-dark',
  'bg-gradient-to-br from-[#1a3a5c] to-[#0d2240]',
  'bg-gradient-to-br from-[#2d5a27] to-[#1a3a18]',
  'bg-gradient-to-br from-[#7a4a1a] to-[#4a2a08]',
];

export default function BookCard({ book, index, onClick }) {
  const coverClass = COVER_COLORS[index % COVER_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onClick={onClick}
      className="relative bg-papier border-[1.5px] border-encre p-[14px] mb-3 shadow-[2px_2px_0_rgba(26,16,8,0.2)] cursor-pointer transition-all hover:shadow-[4px_4px_0_rgba(26,16,8,0.3)] hover:-translate-x-[1px] hover:-translate-y-[1px]"
    >
      {/* Number */}
      <span className="absolute -left-6 top-1/2 -translate-y-1/2 font-typewriter text-[11px] text-foreground/40 w-5 text-right">
        {index + 1}.
      </span>

      <div className="flex gap-3 items-start">
        {/* Cover */}
        <div className={`w-12 h-16 border border-foreground/30 flex-shrink-0 flex items-center justify-center overflow-hidden ${coverClass}`}>
          <span className="font-serif text-[9px] text-creme/80 text-center px-[2px] leading-tight tracking-[0.5px]">
            {book.coverText}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-serif text-[15px] font-bold leading-tight mb-[3px]">{book.title}</div>
          <div className="font-fell italic text-[12px] text-foreground/60 mb-2">{book.author}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] tracking-[1.5px] uppercase px-[7px] py-[2px] border border-encre">
              {book.type}
            </span>
            <span className="text-[11px] tracking-[1.5px] uppercase px-[9px] py-[2px] border border-bordeaux text-bordeaux bg-bordeaux/5 font-bold">
              {book.price}
            </span>
            <span className="text-[9px] tracking-[1.5px] uppercase px-[7px] py-[2px] border border-[#2d6a2d] text-[#2d6a2d] bg-[#2d6a2d]/5">
              {book.availability}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}