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
    <aside className="fixed inset-y-0 right-0 z-[220] w-full max-w-sm p-5 shadow-2xl overflow-y-auto" style={{ background: LIBRARY_COLORS.leather, color: LIBRARY_COLORS.cream }}>
      <button type="button" onClick={onClose} className="absolute right-4 top-4 text-2xl text-[#C8A165]">×</button>
      <div className="text-[10px] uppercase tracking-[3px] text-[#C8A165] mb-3">Livre sélectionné</div>
      <h2 className="text-2xl font-bold pr-8">{book.title}</h2>
      <p className="text-sm opacity-70 mt-1">{book.author}</p>
      <p className="text-sm mt-4 border-y border-[#C8A165]/25 py-3">Prix payé : <strong>{formatMoney(book.price)}</strong></p>
      <div className="mt-4 space-y-2">
        {actions.map(action => (
          <button key={action.label} type="button" onClick={action.fn} disabled={action.disabled} className="w-full flex justify-between items-center border px-4 py-3 text-left text-sm disabled:opacity-40" style={{ borderColor: 'rgba(200,161,101,0.34)' }}>
            <span>{action.label}</span><span>{action.disabled ? 'Bientôt' : '›'}</span>
          </button>
        ))}
      </div>
      {receiptOpen && <ReceiptCard book={book} />}
    </aside>
  );
}