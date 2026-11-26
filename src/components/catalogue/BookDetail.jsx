import React, { useState } from 'react';
import GoogleBooksPreview from './GoogleBooksPreview';
import CouponButton from '@/components/shared/CouponButton';
import { useBookEnrichment } from '@/hooks/useBookEnrichment';
import { getBookPriceInfo } from '@/lib/bookPricing';

function Tag({ type, children }) {
  const styles = {
    type: { border: '1px solid var(--bordero-line)', color: 'var(--encre-douce)', background: 'transparent' },
    price: { border: '1px solid var(--bordeaux)', color: 'var(--bordeaux)', background: 'rgba(110,30,46,0.06)', fontWeight: 700 },
    dispo: { border: '1px solid #3F6B4A', color: '#3F6B4A', background: 'rgba(63,107,74,0.06)' },
  };
  return (
    <span
      className="font-ui"
      style={{
        fontSize: 9,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        padding: '3px 9px',
        borderRadius: 999,
        ...styles[type],
      }}
    >
      {children}
    </span>
  );
}

export default function BookDetail({ book, onOrder, onClose }) {
  const [showPreview, setShowPreview] = useState(false);
  const { enrichment, loading: enrichmentLoading } = useBookEnrichment(book);
  const enrichedBook = enrichment ? {
    ...book,
    price: enrichment.priceLabel,
    priceVal: enrichment.priceValue,
    prixLivreDisponible: enrichment.priceAvailable,
    prixLivreSource: enrichment.priceSource,
  } : book;
  const priceInfo = getBookPriceInfo(enrichedBook);
  const displayedPrice = priceInfo.label;
  const availability = enrichment?.availability || book.dispo;

  const coverUrl = book.coverId
    ? `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`
    : book.coverUrl;

  return (
    <div
      className="mb-4 overflow-hidden"
      style={{
        background: 'var(--bordero-surface-strong)',
        border: '1px solid var(--bordero-line)',
        borderRadius: 'var(--bordero-radius-md)',
        boxShadow: 'var(--bordero-shadow-paper)',
        animation: 'fadeSlideIn 0.3s ease both',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'var(--creme)',
          borderBottom: '1px solid var(--bordero-line)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span className="font-ui" style={{ color: 'var(--bordeaux)', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
          Fiche livre
        </span>
        <button
          onClick={onClose}
          className="font-ui"
          style={{ background: 'transparent', border: 'none', color: 'var(--encre-douce)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0 }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {/* Couverture + infos */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={book.title}
              style={{ width: 64, height: 88, objectFit: 'cover', border: '1px solid var(--bordero-line)', flexShrink: 0, borderRadius: 8 }}
            />
          ) : (
            <div
              style={{
                width: 64, height: 88,
                background: 'linear-gradient(135deg, var(--bordeaux), var(--bordeaux-dark))',
                border: '1px solid var(--bordero-line)',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8,
              }}
            >
              <span className="font-playfair" style={{ fontSize: 8, color: 'rgba(253,252,240,0.8)', textAlign: 'center', padding: 2, lineHeight: 1.2 }}>
                {book.title?.slice(0, 20)}
              </span>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-playfair" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, marginBottom: 4, color: 'var(--encre)' }}>{book.title}</div>
            <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--encre-douce)', marginBottom: 8 }}>{book.author}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              <Tag type="type">{book.type}</Tag>
              <Tag type="price">{enrichmentLoading ? 'Prix neuf…' : displayedPrice}</Tag>
              <Tag type="dispo">{availability}</Tag>
            </div>
            {book.year && (
              <div className="font-ui" style={{ fontSize: 10, color: 'var(--encre-douce)', letterSpacing: 1 }}>{book.year}</div>
            )}
            {enrichment?.publisher && (
              <div className="font-ui" style={{ fontSize: 10, color: 'var(--encre-douce)', letterSpacing: 1 }}>Éditeur : {enrichment.publisher}</div>
            )}
            {book.poidsEstime && (
              <div className="font-ui" style={{ fontSize: 10, color: 'var(--encre-douce)', letterSpacing: 1 }}>⚖ {book.poidsEstime}</div>
            )}
            {book.isbn && (
              <div className="font-ui" style={{ fontSize: 9, color: 'var(--encre-douce)', letterSpacing: 0.5, marginTop: 2, opacity: 0.8 }}>ISBN : {book.isbn}</div>
            )}
          </div>
        </div>

        {/* Bouton aperçu Google Books */}
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => setShowPreview(v => !v)}
            className="font-ui"
            style={{
              background: 'transparent',
              border: '1px dashed var(--bordero-line-strong)',
              color: 'var(--encre-douce)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              padding: '6px 12px',
              cursor: 'pointer',
              width: '100%',
              borderRadius: 10,
            }}
          >
            {showPreview ? '▲ Masquer l\'aperçu' : '📖 Aperçu Google Books'}
          </button>
          {showPreview && (
            <div style={{ marginTop: 10, border: '1px solid var(--bordero-line)', borderRadius: 10, overflow: 'hidden' }}>
              <GoogleBooksPreview isbn={book.isbn} title={book.title} />
            </div>
          )}
          {enrichment?.buyLink && (
            <div style={{ marginTop: 10 }}>
              <CouponButton secondary onClick={() => window.open(enrichment.buyLink, '_blank', 'noopener,noreferrer')}>Acheter neuf</CouponButton>
            </div>
          )}
        </div>

        {/* Action commander */}
        <div style={{ borderTop: '1px dashed var(--bordero-line)', paddingTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          <CouponButton secondary onClick={onClose}>Fermer</CouponButton>
          <CouponButton onClick={() => onOrder(enrichedBook)}>Commander →</CouponButton>
        </div>
      </div>
    </div>
  );
}