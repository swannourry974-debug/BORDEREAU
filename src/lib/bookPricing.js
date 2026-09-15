export function formatEuro(amount) {
  const value = Number(amount || 0);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

export function extractGoogleBookPrice(saleInfo = {}) {
  const info = saleInfo || {};
  const price = info.retailPrice || info.listPrice || null;
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
  const safeBook = book || {};
  const value = Number(safeBook.prixLivre ?? safeBook.priceVal ?? 0);
  const available = safeBook.prixLivreDisponible === true || safeBook.prixLivreSource === 'google';

  if (available && Number.isFinite(value) && value > 0) {
    return {
      value,
      label: safeBook.price || safeBook.priceLabel || formatEuro(value),
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