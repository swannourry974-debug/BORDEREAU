import React from 'react';
import { formatEuro, getBookPriceInfo } from '@/lib/bookPricing';
import { getComparativeSavings } from '@/lib/comparativeRates';

export default function PriceBreakdownLine({ book, bookPrice, deliveryPrice = 0, destination, className = '' }) {
  const priceInfo = getBookPriceInfo(book || { prixLivre: bookPrice, prixLivreDisponible: Number(bookPrice) > 0, prixLivreSource: Number(bookPrice) > 0 ? 'google' : 'livraison_seule' });
  const delivery = Number(deliveryPrice || 0);
  const comparative = getComparativeSavings(destination, delivery);
  const bookLabel = priceInfo.available ? formatEuro(priceInfo.value) : 'prix Google indisponible';

  if (delivery <= 0) {
    return (
      <div className={className}>
        Livre {bookLabel} + livraison à choisir après sélection du livre
      </div>
    );
  }

  return (
    <div className={className}>
      Livre {bookLabel} + livraison {formatEuro(delivery)} <span className="text-[#2d6a2d]">(gain livraison estimé {comparative.savings.toFixed(0)} €)</span>
    </div>
  );
}