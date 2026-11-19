import React, { useState } from 'react';
import ReceiptCard from './ReceiptCard';
import { formatMoney, LIBRARY_COLORS } from './libraryUtils';

export default function BookActionPanel({ book, favorite, onToggleFavorite, onClose }) {
  const [receiptOpen, setReceiptOpen] = useState(false);
  const shareBook = async () => {
    const text = `Je te recommande ${book.title} sur Bordero.`;
    if (navigator.share) await navigator.share({ title: book.title, text });
    else await navigator.clipboard.writeText(text);
  };
  const actions = [
    { label: 'Lire le livre', fn: () => setReceiptOpen(false), disabled: true },
    { label: 'Télécharger', fn: () => setReceiptOpen(false), disabled: true },
    { label: 'Voir le reçu', fn: () => setReceiptOpen(v => !v) },
    { label: "Détails de l'achat", fn: () => setReceiptOpen(true) },
    { label: 'Offrir ce livre', fn: shareBook },
    { label: favorite ? 'Retirer des favoris' : 'Ajouter aux favoris', fn: onToggleFavorite },
  ];
  return (
    <aside className="fixed inset-y-0 right-0 z-[220] w-full max-w-sm overflow-y-auto p-5 shadow-2xl" style={{ background: 'linear-gradient(160deg, #FFF8EA, #F3E8D2)', color: LIBRARY_COLORS.ink }}>
      <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center border text-2xl" style={{ background: '#FFF8EA', borderColor: 'rgba(110,30,46,0.18)', color: LIBRARY_COLORS.wine }}>×</button>
      <div className="font-ui text-[10px] font-extrabold uppercase tracking-[0.28em]" style={{ color: LIBRARY_COLORS.gold }}>Livre sélectionné</div>
      <div className="mt-4 overflow-hidden border" style={{ borderColor: 'rgba(110,30,46,0.18)', background: '#FFF8EA' }}>
        <div className="relative h-56" style={{ background: book.color }}>
          {book.coverUrl ? <img src={book.coverUrl} alt={`Couverture de ${book.title}`} className="h-full w-full object-cover" /> : (
            <div className="flex h-full flex-col justify-between p-5 text-[#F3E8D2]"><span className="font-ui text-[9px] uppercase tracking-[0.28em] opacity-70">Bordero</span><div><h2 className="font-heading text-3xl font-bold leading-none">{book.title}</h2><div className="mt-3 h-px w-16 bg-[#C7A15A]" /></div><span className="font-body italic opacity-80">{book.author}</span></div>
          )}
        </div>
        <div className="p-4">
          <h2 className="pr-8 font-heading text-2xl font-bold leading-tight" style={{ color: LIBRARY_COLORS.wine }}>{book.title}</h2>
          <p className="mt-1 font-body text-base italic text-[#3B2A23]/65">{book.author}</p>
          <p className="mt-4 border-y border-[#6E1E2E]/15 py-3 font-ui text-sm">Prix payé : <strong>{formatMoney(book.price)}</strong></p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {actions.map(action => (
          <button key={action.label} type="button" onClick={action.fn} disabled={action.disabled} className="flex w-full items-center justify-between border px-4 py-3 text-left font-ui text-sm font-bold disabled:opacity-40" style={{ background: action.label.includes('favoris') ? 'rgba(110,30,46,0.06)' : '#FFF8EA', borderColor: 'rgba(110,30,46,0.16)', color: LIBRARY_COLORS.leather }}>
            <span>{action.label}</span><span>{action.disabled ? 'Bientôt' : '›'}</span>
          </button>
        ))}
      </div>
      {receiptOpen && <ReceiptCard book={book} />}
    </aside>
  );
}