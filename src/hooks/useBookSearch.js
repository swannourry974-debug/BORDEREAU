import { useState, useCallback, useRef } from 'react';

/**
 * Hook de recherche de livres avec debounce et stratégie Open Library en priorité.
 * Open Library est favorisé car fiable et sans quota. Google Books sert de complément
 * pour les résultats manquants (couvertures françaises additionnelles).
 */
export function useBookSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    // Annuler la requête précédente si encore en vol
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setLoading(true);
    setError(null);

    try {
      const q = encodeURIComponent(query.trim());

      // Open Library en priorité — fiable, sans quota
      const olRes = await fetch(
        `https://openlibrary.org/search.json?q=${q}&limit=8&fields=key,title,author_name,isbn,cover_i,number_of_pages_median,publish_year`,
        { signal }
      );
      const olData = await olRes.json();

      const olBooks = (olData.docs || []).map((doc, i) => {
        const pages = doc.number_of_pages_median || null;
        return {
          id: doc.key || `ol-${i}`,
          title: doc.title,
          author: doc.author_name?.[0] || 'Auteur inconnu',
          isbn: doc.isbn?.[0] || null,
          coverId: doc.cover_i || null,
          coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
          pages,
          year: doc.publish_year?.[0] || null,
          poidsEstime: pages ? `~${Math.round(pages * 1.2)}g` : null,
          type: pages > 400 ? 'Broché' : 'Poche',
          price: pages > 400 ? '24,00 €' : '9,90 €',
          priceVal: pages > 400 ? 24.0 : 9.9,
          dispo: '1 voyageur',
          source: 'openlibrary',
          _score: (doc.cover_i ? 2 : 0) + (pages ? 1 : 0) + (doc.author_name ? 1 : 0),
        };
      });

      // Si Open Library retourne assez de résultats, on s'arrête là (plus rapide)
      if (olBooks.length >= 6) {
        const sorted = olBooks.sort((a, b) => b._score - a._score);
        setResults(sorted);
        setLoading(false);
        return;
      }

      // Complément Google Books si moins de 6 résultats Open Library
      const gbRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=8&langRestrict=fr`,
        { signal }
      );
      const gbData = await gbRes.json();

      const gbBooks = (gbData.items || []).map((item, i) => {
        const info = item.volumeInfo;
        const pages = info.pageCount || null;
        return {
          id: item.id || `gb-${i}`,
          title: info.title,
          author: info.authors?.[0] || 'Auteur inconnu',
          isbn: info.industryIdentifiers?.find(x => x.type === 'ISBN_13')?.identifier
            || info.industryIdentifiers?.find(x => x.type === 'ISBN_10')?.identifier
            || null,
          coverId: null,
          coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://').replace('&edge=curl', '') || null,
          pages,
          year: info.publishedDate?.slice(0, 4) || null,
          poidsEstime: pages ? `~${Math.round(pages * 1.2)}g` : null,
          type: pages > 400 ? 'Broché' : 'Poche',
          price: pages > 400 ? '24,00 €' : '9,90 €',
          priceVal: pages > 400 ? 24.0 : 9.9,
          dispo: '1 voyageur',
          source: 'google',
          _score: (info.imageLinks ? 2 : 0) + (pages ? 1 : 0) + (info.authors ? 1 : 0),
        };
      });

      // Fusionner en dédoublonnant par ISBN
      const merged = [...olBooks];
      const existingIsbns = new Set(olBooks.map(b => b.isbn).filter(Boolean));
      const existingTitles = new Set(olBooks.map(b => b.title?.toLowerCase()));

      for (const b of gbBooks) {
        if (b.isbn && existingIsbns.has(b.isbn)) continue;
        if (existingTitles.has(b.title?.toLowerCase())) continue;
        merged.push(b);
      }

      setResults(merged.sort((a, b) => b._score - a._score).slice(0, 12));
    } catch (e) {
      if (e.name === 'AbortError') return; // requête annulée volontairement
      setError('Erreur de recherche');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recherche avec debounce (évite une requête par touche)
  const searchDebounced = useCallback((query, delay = 400) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => search(query), delay);
  }, [search]);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
    setError(null);
    setLoading(false);
  }, []);

  return { results, loading, error, search, searchDebounced, reset };
}