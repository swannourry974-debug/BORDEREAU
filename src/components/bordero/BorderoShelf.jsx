import React from 'react';
import BorderoBook from './BorderoBook';

export default function BorderoShelf({ books = [], onSelect, selectedId }) {
  return (
    <div className="rounded-[16px] border p-4 shadow-[0_24px_60px_rgba(46,17,17,0.32)]" style={{ background: 'var(--bois-fonce)', borderColor: 'rgba(200,161,101,0.38)' }}>
      <div className="flex min-h-[176px] items-end gap-3 rounded-[14px] px-3 pt-5" style={{ background: 'rgba(46,17,17,0.74)' }}>
        {books.map((book, index) => (
          <BorderoBook key={book.id || book.title} {...book} selected={selectedId === book.id} delay={index * 0.08} onClick={() => onSelect?.(book)} />
        ))}
      </div>
      <div className="h-5 rounded-b-[14px]" style={{ background: 'linear-gradient(180deg,var(--bois-fonce),var(--bordeaux-dark))' }} />
    </div>
  );
}