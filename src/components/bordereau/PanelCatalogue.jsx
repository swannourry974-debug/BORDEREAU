import React, { useState, useEffect, useRef } from 'react';
import { WelcomeCard, SectionTitle, BtnCoupon } from './shared';
import CommandeForm from './CommandeForm';

const BOOKS = [
  { id: 1, num: '1.', title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry', type: 'Poche', price: '8,90 €', priceVal: '8,90', dispo: '2 voyageurs', coverClass: 'cover-1', coverLabel: 'LE PETIT\nPRINCE' },
  { id: 2, num: '2.', title: "L'Élégance du hérisson", author: 'Muriel Barbery', type: 'Poche', price: '9,50 €', priceVal: '9,50', dispo: '1 voyageur', coverClass: 'cover-2', coverLabel: "L'ÉLÉGANCE\nDU\nHÉRISSON" },
  { id: 3, num: '3.', title: 'Les Misérables', author: 'Victor Hugo', type: 'Broché', price: '28,00 €', priceVal: '28,00', dispo: 'Collecte', coverClass: 'cover-3', coverLabel: 'LES\nMISÉRABLES' },
  { id: 4, num: '4.', title: 'Astérix & Obélix T.1', author: 'Goscinny & Uderzo', type: 'BD', price: '11,50 €', priceVal: '11,50', dispo: '3 voyageurs', coverClass: 'cover-4', coverLabel: 'ASTÉRIX\nT.1' },
];

const coverBgs = {
  'cover-1': 'linear-gradient(135deg, #800020, #5a0015)',
  'cover-2': 'linear-gradient(135deg, #1a3a5c, #0d2240)',
  'cover-3': 'linear-gradient(135deg, #2d5a27, #1a3a18)',
  'cover-4': 'linear-gradient(135deg, #7a4a1a, #4a2a08)',
};

function BookCard({ book, num, onOrder }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        background: 'var(--papier)',
        border: '1.5px solid var(--encre)',
        padding: 14,
        marginBottom: 12,
        position: 'relative',
        boxShadow: hovered ? '4px 4px 0 rgba(26,16,8,0.3)' : '2px 2px 0 rgba(26,16,8,0.2)',
        cursor: 'pointer',
        transform: hovered ? 'translate(-1px,-1px)' : 'none',
        transition: 'all 0.2s',
        animation: 'fadeSlideIn 0.4s ease both',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOrder(book)}
    >
      <div className="font-special" style={{
        position: 'absolute', left: -24, top: '50%', transform: 'translateY(-50%)',
        fontSize: 11, color: 'rgba(26,16,8,0.4)', width: 20, textAlign: 'right',
      }}>{num}</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 48, height: 64,
          background: coverBgs[book.coverClass],
          border: '1px solid rgba(26,16,8,0.3)',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <span className="font-playfair" style={{
            fontSize: 9, color: 'rgba(253,252,240,0.8)',
            textAlign: 'center', padding: 2, lineHeight: 1.2, letterSpacing: 0.5,
            whiteSpace: 'pre-line',
          }}>{book.coverLabel}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div className="font-playfair" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginBottom: 3 }}>{book.title}</div>
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.6)', marginBottom: 8 }}>{book.author}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Tag type="type">{book.type}</Tag>
            <Tag type="price">{book.price}</Tag>
            <Tag type="dispo">{book.dispo}</Tag>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tag({ type, children }) {
  const styles = {
    type: { borderColor: 'var(--encre)', color: 'var(--encre)', background: 'transparent', fontSize: 9, padding: '2px 7px' },
    price: { borderColor: 'var(--bordeaux)', color: 'var(--bordeaux)', background: 'rgba(128,0,32,0.06)', fontWeight: 'bold', fontSize: 11, padding: '2px 9px' },
    dispo: { borderColor: '#2d6a2d', color: '#2d6a2d', background: 'rgba(45,106,45,0.06)', fontSize: 9, padding: '2px 7px' },
  };
  return (
    <span style={{ letterSpacing: 1.5, textTransform: 'uppercase', border: '1px solid', ...styles[type] }}>
      {children}
    </span>
  );
}

export default function PanelCatalogue({ commandeOpen, commandeBook, onOpenCommande, onCloseCommande }) {
  const commandeRef = useRef(null);

  const handleOrder = (book) => {
    onOpenCommande(book);
    setTimeout(() => {
      commandeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div>
      <WelcomeCard
        eyebrow="Bonjour, Lecteur"
        title="Quels livres vous<br>manquent ce soir ?"
        sub="📍 Livraison vers : Miami, FL · USA"
      />

      <SectionTitle>Rechercher un livre</SectionTitle>

      <div style={{
        background: 'var(--papier)',
        border: '1.5px solid var(--encre)',
        padding: '14px 16px',
        marginBottom: 20,
        boxShadow: '3px 3px 0 var(--encre)',
      }}>
        <div className="font-special" style={{ fontSize: 13, color: 'rgba(26,16,8,0.4)', display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>
          🔍 Chercher un titre, auteur, ISBN...
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="font-special"
            placeholder="Le Petit Prince..."
            style={{
              flex: 1,
              background: 'var(--creme)',
              border: '1px solid rgba(26,16,8,0.3)',
              padding: '8px 12px',
              fontSize: 14,
              color: 'var(--encre)',
              outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--bordeaux)'}
            onBlur={e => e.target.style.borderColor = 'rgba(26,16,8,0.3)'}
          />
          <BtnCoupon onClick={() => {}}>Chercher</BtnCoupon>
        </div>
      </div>

      <div>
        <SectionTitle>Disponibles pour Miami</SectionTitle>
        <div style={{ paddingLeft: 28 }}>
          {BOOKS.map((book) => (
            <BookCard key={book.id} book={book} num={book.num} onOrder={handleOrder} />
          ))}
        </div>
      </div>

      <div ref={commandeRef}>
        {commandeOpen && commandeBook && (
          <CommandeForm book={commandeBook} onClose={onCloseCommande} />
        )}
      </div>
    </div>
  );
}