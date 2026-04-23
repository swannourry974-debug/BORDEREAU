import { useState, useCallback } from 'react';

export function useOpenLibrary() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=key,title,author_name,isbn,cover_i,number_of_pages_median,publish_year,subject`
      );
      const data = await res.json();
      const books = (data.docs || []).map((doc, i) => ({
        id: doc.key || `ol-${i}`,
        title: doc.title,
        author: doc.author_name?.[0] || 'Auteur inconnu',
        isbn: doc.isbn?.[0] || null,
        coverId: doc.cover_i || null,
        pages: doc.number_of_pages_median || null,
        year: doc.publish_year?.[0] || null,
        // Poids estimé basé sur le nombre de pages
        poidsEstime: doc.number_of_pages_median
          ? `~${Math.round(doc.number_of_pages_median * 1.2)}g`
          : null,
        // Type estimé
        type: doc.number_of_pages_median > 400 ? 'Broché' : 'Poche',
        // Prix indicatif
        price: doc.number_of_pages_median > 400 ? '24,00 €' : '9,90 €',
        priceVal: doc.number_of_pages_median > 400 ? 24.0 : 9.9,
        dispo: '1 voyageur',
      }));
      setResults(books);
    } catch (e) {
      setError('Erreur de recherche');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, reset };
}