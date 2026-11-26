import React from 'react';
import BookSpine from './BookSpine';
import { chunkBooks } from './libraryUtils';

export default function WoodenShelf({ books, selectedId, addedBookId, onSelect }) {
  const rows = chunkBooks(books, 5);
  return (
    <div className="p-4 shadow-2xl" style={{ background: 'var(--bois-fonce)', border: '1px solid var(--bordero-line-strong)', borderRadius: 'var(--bordero-radius-md)' }}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="relative mb-5 last:mb-0">
          <div className="min-h-[160px] flex items-end gap-3 px-3 pt-4" style={{ background: 'rgba(59,42,35,0.72)', borderRadius: 'var(--bordero-radius-sm)' }}>
            {row.length === 0 ? (
              <div className="w-full text-center pb-12 text-sm italic" style={{ color: 'rgba(243,232,210,0.62)' }}>Votre prochaine lecture prendra place ici.</div>
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
          <div className="h-5 shadow-lg" style={{ background: 'var(--bois-fonce)', borderTop: '2px solid var(--sepia)', borderRadius: '0 0 var(--bordero-radius-sm) var(--bordero-radius-sm)' }} />
        </div>
      ))}
    </div>
  );
}
