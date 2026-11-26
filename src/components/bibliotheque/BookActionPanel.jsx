import React, { useState } from 'react';
import ReceiptCard from './ReceiptCard';
import { formatMoney } from './libraryUtils';

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
    <aside className="fixed inset-y-0 right-0 z-[220] w-full max-w-sm overflow-y-auto p-5 shadow-2xl" style={{ background: 'var(--bordero-surface-strong)', color: 'var(--encre)', borderLeft: '1px solid var(--bordero-line-strong)' }}>
      <button type="button" onClick={onClose} className="absolute right-4 top-4 text-2xl" style={{ color: '#6E1E2E' }}>×</button>
      <div className="bordero-ui mb-3 text-[10px] uppercase tracking-[3px]" style={{ color: 'var(--sepia)' }}>Livre sélectionné</div>
      <h2 className="bordero-title pr-8 text-2xl" style={{ color: 'var(--bordeaux)' }}>{book.title}</h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--encre-douce)' }}>{book.author}</p>
      <p className="mt-4 border-y py-3 text-sm" style={{ borderColor: 'var(--bordero-line)', color: 'var(--encre)' }}>Prix payé : <strong>{formatMoney(book.price)}</strong></p>
      <div className="mt-4 space-y-2">
        {actions.map(action => (
          <button key={action.label} type="button" onClick={action.fn} disabled={action.disabled} className="flex w-full items-center justify-between border px-4 py-3 text-left text-sm transition-colors disabled:opacity-40" style={{ borderColor: 'var(--bordero-line-strong)', background: 'var(--bordero-surface)', color: 'var(--encre)', borderRadius: 'var(--bordero-radius-md)' }}>
            <span>{action.label}</span><span style={{ color: 'var(--encre-douce)' }}>{action.disabled ? 'Bientôt' : '›'}</span>
          </button>
        ))}
      </div>
      {receiptOpen && <ReceiptCard book={book} />}
    </aside>
  );
}
