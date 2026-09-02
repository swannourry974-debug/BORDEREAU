export function formatEuro(amount) {
  const value = Number(amount || 0);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

export function extractGoogleBookPrice(saleInfo = {}) {
  const price = saleInfo.retailPrice || saleInfo.listPrice || null;
  const amount = Number(price?.amount || 0);
  const currency = price?.currencyCode || 'EUR';
  const canCharge = Number.isFinite(amount) && amount > 0 && currency === 'EUR';

  return {
    value: canCharge ? amount : 0,
    label: canCharge ? formatEuro(amount) : 'Livre remboursé sur justificatif',
    available: canCharge,
    source: canCharge ? 'google' : 'livraison_seule',
  };
}

export function getBookPriceInfo(book = {}) {
  const value = Number(book.prixLivre ?? book.priceVal ?? 0);
  const available = book.prixLivreDisponible === true || book.prixLivreSource === 'google';

  if (available && Number.isFinite(value) && value > 0) {
    return {
      value,
      label: book.price || book.priceLabel || formatEuro(value),
      available: true,
      source: 'google',
    };
  }

  return {
    value: 0,
    label: 'Livre remboursé sur justificatif',
    available: false,
    source: 'livraison_seule',
  };
}