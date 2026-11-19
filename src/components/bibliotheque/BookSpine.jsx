import React from 'react';
import { motion } from 'framer-motion';
import { formatMoney, LIBRARY_COLORS } from './libraryUtils';

export default function BookSpine({ book, index, added, selected, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={added ? { y: 42, opacity: 0, rotate: -2 } : { y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ duration: added ? 0.55 : 0.28, delay: added ? 0.04 : index * 0.025, ease: 'easeOut' }}
      className="group min-h-[250px] w-full overflow-hidden border text-left shadow-[0_18px_34px_rgba(59,42,35,0.14)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(59,42,35,0.2)]"
      style={{
        background: LIBRARY_COLORS.paper,
        borderColor: selected ? LIBRARY_COLORS.gold : 'rgba(110,30,46,0.2)',
        boxShadow: selected ? '0 0 0 3px rgba(199,161,90,0.24), 0 20px 42px rgba(59,42,35,0.18)' : undefined,
      }}
    >
      <div className="relative h-[166px] overflow-hidden" style={{ background: book.color }}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={`Couverture de ${book.title}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="flex h-full flex-col justify-between p-4 text-[#F3E8D2]">
            <div className="text-[9px] uppercase tracking-[0.28em] opacity-70">Bordero</div>
            <div>
              <div className="font-heading text-[19px] font-bold leading-[1.05] line-clamp-4">{book.title}</div>
              <div className="mt-2 h-px w-12 bg-[#C7A15A]/80" />
            </div>
            <div className="font-body text-[12px] italic opacity-80 line-clamp-2">{book.author}</div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full border border-[#F3E8D2]/45 bg-black/18 px-2 py-1 font-ui text-[8px] font-bold uppercase tracking-[0.16em] text-[#F3E8D2]">
          {book.status || 'livre'}
        </div>
      </div>
      <div className="p-4">
        <div className="font-heading text-[18px] font-bold leading-tight text-[#6E1E2E] line-clamp-2">{book.title}</div>
        <div className="mt-1 font-body text-[14px] italic text-[#3B2A23]/70 line-clamp-1">{book.author}</div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-[#6E1E2E]/20 pt-3">
          <span className="font-ui text-[9px] font-bold uppercase tracking-[0.16em] text-[#3B2A23]/55">{book.destination || book.format || 'Collection'}</span>
          <span className="font-heading text-[16px] font-bold text-[#6E1E2E]">{formatMoney(book.price)}</span>
        </div>
      </div>
    </motion.button>
  );
}