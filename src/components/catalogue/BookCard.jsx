import React from 'react';
import { motion } from 'framer-motion';
import BookSavingsBadge from '@/components/catalogue/BookSavingsBadge';
import PriceBreakdownLine from '@/components/catalogue/PriceBreakdownLine';

const COVER_COLORS = [
  'bg-gradient-to-br from-bordeaux to-bordeaux-dark',
  'bg-gradient-to-br from-[#1a3a5c] to-[#0d2240]',
  'bg-gradient-to-br from-[#2d5a27] to-[#1a3a18]',
  'bg-gradient-to-br from-[#7a4a1a] to-[#4a2a08]',
];

export default function BookCard({ book, index, onClick, destination, deliveryPrice = 0, showSavings = false }) {
  const coverClass = COVER_COLORS[index % COVER_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      onClick={onClick}
      className="mb-3 flex cursor-pointer items-center gap-4 p-4 transition-transform hover:-translate-y-[1px]"
      style={{
        background: 'var(--bordero-surface-strong)',
        border: '1px solid var(--bordero-line)',
        borderRadius: 'var(--bordero-radius-md)',
        boxShadow: 'var(--bordero-shadow-paper)',
      }}
    >
      <div
        className={`flex h-[80px] w-[56px] shrink-0 items-end justify-center overflow-hidden ${book.coverUrl ? '' : coverClass}`}
        style={{ borderRadius: 8 }}
      >
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <span className="font-ui px-1 pb-2 text-[8px] uppercase tracking-[1px] text-creme/80">
            {book.coverText}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-heading line-clamp-2 text-[18px] font-bold leading-tight" style={{ color: 'var(--encre)' }}>
          {book.title}
        </div>
        <div className="font-ui mt-0.5 text-[12px]" style={{ color: 'var(--encre-douce)' }}>
          {book.author}
        </div>
        {(book.isbn || book.pages) && (
          <div className="font-ui mt-1 text-[9px] uppercase tracking-[1px]" style={{ color: 'var(--encre-douce)' }}>
            {book.isbn ? `ISBN ${book.isbn}` : ''}{book.isbn && book.pages ? ' · ' : ''}{book.pages ? `${book.pages} pages` : ''}
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {book.type && (
            <span
              className="font-ui text-[9px] uppercase tracking-[1.2px]"
              style={{ padding: '3px 8px', borderRadius: 999, border: '1px solid var(--bordero-line)', color: 'var(--encre-douce)' }}
            >
              {book.type}
            </span>
          )}
          <span
            className="font-ui text-[11px] font-bold uppercase tracking-[1.2px]"
            style={{ padding: '3px 9px', borderRadius: 999, border: '1px solid var(--bordero-line-strong)', color: 'var(--bordeaux)' }}
          >
            {book.price}
          </span>
          {!showSavings && book.availability && (
            <span className="font-ui text-[9px] uppercase tracking-[1.2px]" style={{ color: '#3F6B4A' }}>
              {book.availability}
            </span>
          )}
        </div>
        <PriceBreakdownLine
          book={book}
          deliveryPrice={deliveryPrice}
          destination={destination}
          className="font-ui mt-2 text-[10px] uppercase tracking-[0.8px]"
        />
        {showSavings && <BookSavingsBadge destination={destination} price={deliveryPrice} />}
      </div>
    </motion.div>
  );
}
