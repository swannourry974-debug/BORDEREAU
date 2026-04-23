import React, { useState } from 'react';
import GoogleBooksPreview from './GoogleBooksPreview';
import { BtnCoupon } from '../bordereau/shared';

function Tag({ type, children }) {
  const styles = {
    type: { borderColor: '#1a1008', color: '#1a1008', background: 'transparent', fontSize: 9, padding: '2px 7px' },
    price: { borderColor: '#800020', color: '#800020', background: 'rgba(128,0,32,0.06)', fontWeight: 'bold', fontSize: 11, padding: '2px 9px' },
    dispo: { borderColor: '#2d6a2d', color: '#2d6a2d', background: 'rgba(45,106,45,0.06)', fontSize: 9, padding: '2px 7px' },
  };
  return (
    <span style={{ letterSpacing: 1.5, textTransform: 'uppercase', border: '1px solid', ...styles[type] }}>
      {children}
    </span>
  );
}

export default function BookDetail({ book, onOrder, onClose }) {
  const [showPreview, setShowPreview] = useState(false);

  const coverUrl = book.coverId
    ? `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`
    : null;

  return (
    <div style={{
      background: 'var(--papier)',
      border: '2px solid var(--encre)',
      boxShadow: '5px 5px 0 rgba(26,16,8,0.2)',
      marginTop: 16,
      animation: 'fadeSlideIn 0.3s ease both',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--bordeaux)',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span className="font-special" style={{ color: 'var(--creme)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
          Fiche livre
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--creme)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
      </div>

      <div style={{ padding: 16 }}>
        {/* Couverture + infos */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={book.title}
              style={{ width: 64, height: 88, objectFit: 'cover', border: '1px solid rgba(26,16,8,0.3)', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 64, height: 88,
              background: 'linear-gradient(135deg, #800020, #5a0015)',
              border: '1px solid rgba(26,16,8,0.3)',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="font-playfair" style={{ fontSize: 8, color: 'rgba(253,252,240,0.8)', textAlign: 'center', padding: 2, lineHeight: 1.2 }}>
                {book.title?.slice(0, 20)}
              </span>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div className="font-playfair" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>{book.title}</div>
            <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.6)', marginBottom: 8 }}>{book.author}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              <Tag type="type">{book.type}</Tag>
              <Tag type="price">{book.price}</Tag>
              <Tag type="dispo">{book.dispo}</Tag>
            </div>
            {book.year && (
              <div style={{ fontSize: 10, color: 'rgba(26,16,8,0.4)', letterSpacing: 1 }}>{book.year}</div>
            )}
            {book.poidsEstime && (
              <div style={{ fontSize: 10, color: 'rgba(26,16,8,0.4)', letterSpacing: 1 }}>⚖ {book.poidsEstime}</div>
            )}
            {book.isbn && (
              <div style={{ fontSize: 9, color: 'rgba(26,16,8,0.35)', letterSpacing: 0.5, marginTop: 2 }}>ISBN : {book.isbn}</div>
            )}
          </div>
        </div>

        {/* Bouton aperçu Google Books */}
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => setShowPreview(v => !v)}
            className="font-special"
            style={{
              background: 'transparent',
              border: '1px dashed rgba(26,16,8,0.4)',
              color: 'rgba(26,16,8,0.6)',
              fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
              padding: '5px 12px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {showPreview ? '▲ Masquer l\'aperçu' : '📖 Aperçu Google Books'}
          </button>
          {showPreview && (
            <div style={{ marginTop: 10, border: '1px solid rgba(26,16,8,0.15)' }}>
              <GoogleBooksPreview isbn={book.isbn} title={book.title} />
            </div>
          )}
        </div>

        {/* Action commander */}
        <div style={{ borderTop: '1px dashed rgba(26,16,8,0.2)', paddingTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="font-special" style={{
            background: 'transparent', border: '1px dashed rgba(26,16,8,0.3)',
            color: 'rgba(26,16,8,0.5)', fontSize: 9, letterSpacing: 2, padding: '6px 14px', cursor: 'pointer',
          }}>Fermer</button>
          <BtnCoupon onClick={() => onOrder(book)}>Commander →</BtnCoupon>
        </div>
      </div>
    </div>
  );
}