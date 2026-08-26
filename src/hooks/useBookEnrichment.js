import { useEffect, useState } from 'react';

function formatGooglePrice(price) {
  if (!price?.amount || !price?.currencyCode) return null;
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: price.currencyCode,
    }).format(price.amount);
  } catch {
    return `${price.amount} ${price.currencyCode}`;
  }
}

function availabilityLabel(value) {
  const labels = {
    FOR_SALE: 'Neuf disponible',
    NOT_FOR_SALE: 'Non vendu neuf',
    FREE: 'Gratuit',
    FOR_PREORDER: 'Précommande',
  };
  return labels[value] || null;
}

function normalizeVolume(item) {
  if (!item) return null;
  const saleInfo = item.saleInfo || {};
  const volumeInfo = item.volumeInfo || {};
  return {
    priceLabel: formatGooglePrice(saleInfo.retailPrice || saleInfo.listPrice),
    availability: availabilityLabel(saleInfo.saleability),
    buyLink: saleInfo.buyLink || null,
    publisher: volumeInfo.publisher || null,
    description: volumeInfo.description || null,
    categories: volumeInfo.categories || [],
  };
}

function buildQueries(book) {
  const queries = [];
  if (book?.isbn) queries.push(`isbn:${book.isbn}`);
  if (book?.title) {
    const title = `intitle:${book.title}`;
    const author = book.author ? `+inauthor:${book.author}` : '';
    queries.push(`${title}${author}`);
  }
  return queries;
}

export function useBookEnrichment(book) {
  const [enrichment, setEnrichment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const queries = buildQueries(book);
    if (!queries.length) {
      setEnrichment(null);
      return;
    }

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      setEnrichment(null);

      try {
        for (const query of queries) {
          const res = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&langRestrict=fr`,
            { signal: controller.signal }
          );
          const data = await res.json();
          const normalized = normalizeVolume(data.items?.[0]);
          if (normalized) {
            setEnrichment(normalized);
            return;
          }
        }
      } catch (e) {
        if (e.name !== 'AbortError') setError('Données enrichies indisponibles');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [book?.isbn, book?.title, book?.author]);

  return { enrichment, loading, error };
}