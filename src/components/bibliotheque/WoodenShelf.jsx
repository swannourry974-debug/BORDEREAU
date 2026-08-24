import React from 'react';
import BookSpine from './BookSpine';
import { chunkBooks, LIBRARY_COLORS } from './libraryUtils';

export default function WoodenShelf({ books, selectedId, addedBookId, onSelect }) {
  const rows = chunkBooks(books, 5);
  return (
    <div className="p-4 shadow-2xl" style={{ background: '#800020', border: '1px solid rgba(200,161,101,0.34)' }}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="relative mb-5 last:mb-0">
          <div className="min-h-[160px] flex items-end gap-3 px-3 pt-4" style={{ background: 'rgba(128,0,32,0.78)' }}>
            {row.length === 0 ? (
              <div className="w-full text-center pb-12 text-sm italic" style={{ color: 'rgba(245,230,204,0.55)' }}>Votre prochaine lecture prendra place ici.</div>
            ) : row.map((book, index) => (
              <BookSpine
                key={book.id}
                book={book}
                index={rowIndex * 5 + index}
                selected={selectedId === book.id}
                added={addedBookId === book.id}
                onClick={() => onSelect(book)}
              />
            ))}
          </div>
          <div className="h-5 shadow-lg" style={{ background: LIBRARY_COLORS.wine, borderTop: '2px solid rgba(200,161,101,0.35)' }} />
        </div>
      ))}
    </div>
  );
}