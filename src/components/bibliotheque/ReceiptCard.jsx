import React from 'react';
import { formatDate, formatMoney, LIBRARY_COLORS } from './libraryUtils';

export default function ReceiptCard({ book }) {
  return (
    <div className="mt-4 border p-4" style={{ background: 'rgba(245,230,204,0.06)', borderColor: 'rgba(200,161,101,0.35)' }}>
      <div className="text-center text-[#C8A165] text-3xl mb-2">✓</div>
      <h3 className="text-center font-bold mb-4" style={{ color: LIBRARY_COLORS.cream }}>Reçu d'achat</h3>
      <div className="space-y-2 text-sm" style={{ color: 'rgba(245,230,204,0.78)' }}>
        <div className="flex justify-between gap-3"><span>Date d'achat</span><strong>{formatDate(book.date)}</strong></div>
        <div className="flex justify-between gap-3"><span>Prix payé</span><strong>{formatMoney(book.price)}</strong></div>
        <div className="flex justify-between gap-3"><span>N° commande</span><strong>{book.orderNumber}</strong></div>
        <div className="flex justify-between gap-3"><span>Moyen de paiement</span><strong>{book.paymentMethod}</strong></div>
      </div>
      <button type="button" onClick={() => window.print()} className="w-full mt-4 py-3 text-sm font-bold" style={{ background: LIBRARY_COLORS.gold, color: LIBRARY_COLORS.wine }}>Télécharger le PDF</button>
    </div>
  );
}