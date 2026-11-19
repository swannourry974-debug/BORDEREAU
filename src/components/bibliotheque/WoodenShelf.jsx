import React from 'react';
import BookSpine from './BookSpine';
import { LIBRARY_COLORS } from './libraryUtils';

export default function WoodenShelf({ books, selectedId, addedBookId, onSelect }) {
  return (
    <section className="relative overflow-hidden border p-4 sm:p-5" style={{ background: 'linear-gradient(145deg, #FFF8EA, #F7EEDC)', borderColor: 'rgba(110,30,46,0.18)' }}>
      <div className="pointer-events-none absolute inset-x-5 top-4 h-px bg-gradient-to-r from-transparent via-[#C7A15A]/60 to-transparent" />
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="font-ui text-[10px] font-extrabold uppercase tracking-[0.24em]" style={{ color: LIBRARY_COLORS.wine }}>Rayonnage personnel</div>
          <p className="mt-1 font-body text-[15px] italic text-[#3B2A23]/62">Chaque couverture ouvre son reçu, ses détails et ses actions.</p>
        </div>
        <div className="hidden rounded-full border px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] sm:block" style={{ borderColor: 'rgba(199,161,90,0.55)', color: LIBRARY_COLORS.leather }}>
          {books.length} livre{books.length > 1 ? 's' : ''}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {books.map((book, index) => (
          <BookSpine
            key={book.id}
            book={book}
            index={index}
            selected={selectedId === book.id}
            added={addedBookId === book.id}
            onClick={() => onSelect(book)}
          />
        ))}
      </div>
    </section>
  );
}