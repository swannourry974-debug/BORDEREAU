import { useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { extractGoogleBookPrice } from '@/lib/bookPricing';

/**
 * Hook de recherche de livres avec debounce et stratégie Open Library en priorité.
 * Open Library est favorisé car fiable et sans quota. Google Books sert de complément
 * pour les résultats manquants (couvertures françaises additionnelles).
 */
function formatCatalogBook(item) {
  return {
    id: item.id,
    title: item.title,
    author: item.author || 'Auteur inconnu',
    isbn: item.isbn13 || item.ean || null,
    isbn13: item.isbn13 || item.ean || null,
    coverId: null,
    coverUrl: item.image_url || null,
    pages: null,
    year: null,
    poidsEstime: null,
    type: 'Poche',
    price: item.price ? `${Number(item.price).toFixed(2)} €` : 'Prix indisponible',
    priceVal: Number(item.price || 0),
    prixLivreDisponible: Number(item.price || 0) > 0 && !String(item.availability || '').toLowerCase().includes('indisponible'),
    prixLivreSource: 'catalog',
    dispo: item.availability || 'Catalogue Bordero',
    source: 'catalog',
    offers: item.offers || [],
    bestOffer: item.best_offer || null,
    _score: 10,
  };
}

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
      const catalogRes = await base44.functions.invoke('searchCatalog', { query: query.trim(), pageSize: 20, suggestions: 5 });
      const catalogBooks = [
        ...(catalogRes.data?.main ? [catalogRes.data.main] : []),
        ...(catalogRes.data?.suggestions || []),
        ...((catalogRes.data?.items || []).filter(item => item.id !== catalogRes.data?.main?.id)),
      ];
      if (catalogBooks.length > 0) {
        const seen = new Set();
        setResults(catalogBooks.filter(item => {
          const key = item.isbn13 || item.id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).map(formatCatalogBook).slice(0, 12));
        return;
      }

      const q = encodeURIComponent(query.trim());

      // Open Library reste en secours pour préserver le panier existant.
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
          price: 'Livre remboursé sur justificatif',
          priceVal: 0,
          prixLivreDisponible: false,
          prixLivreSource: 'livraison_seule',
          dispo: '1 voyageur',
          source: 'openlibrary',
          _score: (doc.cover_i ? 2 : 0) + (pages ? 1 : 0) + (doc.author_name ? 1 : 0),
        };
      });

      // Complément Google Books pour récupérer prix neuf, disponibilité et couvertures
      // même quand Open Library fournit déjà assez de résultats.
      let gbBooks = [];
      try {
        const gbRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=8&langRestrict=fr`,
          { signal }
        );
        const gbData = await gbRes.json();

        gbBooks = (gbData.items || []).map((item, i) => {
          const info = item.volumeInfo;
          const pages = info.pageCount || null;
          const googlePrice = extractGoogleBookPrice(item.saleInfo || {});
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
            price: googlePrice.label,
            priceVal: googlePrice.value,
            prixLivreDisponible: googlePrice.available,
            prixLivreSource: googlePrice.source,
            dispo: '1 voyageur',
            source: 'google',
            _score: (info.imageLinks ? 2 : 0) + (pages ? 1 : 0) + (info.authors ? 1 : 0),
          };
        });
      } catch (googleError) {
        gbBooks = [];
      }

      const googleByIsbn = new Map(gbBooks.map(b => [b.isbn, b]).filter(([isbn]) => Boolean(isbn)));
      const googleByTitle = new Map(gbBooks.map(b => [b.title?.toLowerCase(), b]).filter(([title]) => Boolean(title)));
      const enrichedOlBooks = olBooks.map(book => {
        const googleMatch = (book.isbn && googleByIsbn.get(book.isbn)) || googleByTitle.get(book.title?.toLowerCase());
        if (!googleMatch?.prixLivreDisponible) return book;
        return {
          ...book,
          price: googleMatch.price,
          priceVal: googleMatch.priceVal,
          prixLivreDisponible: true,
          prixLivreSource: 'google',
          source: `${book.source}+google`,
        };
      });

      // Fusionner en dédoublonnant par ISBN
      const merged = [...enrichedOlBooks];
      const existingIsbns = new Set(enrichedOlBooks.map(b => b.isbn).filter(Boolean));
      const existingTitles = new Set(enrichedOlBooks.map(b => b.title?.toLowerCase()));

      for (const b of gbBooks) {
        if (b.isbn && existingIsbns.has(b.isbn)) continue;
        if (existingTitles.has(b.title?.toLowerCase())) continue;
        merged.push(b);
      }

      setResults(merged.sort((a, b) => b._score - a._score).slice(0, 12));
    } catch (e) {
      if (e?.response?.status === 401) {
        base44.auth.redirectToLogin(window.location.pathname + window.location.search);
        return;
      }
      if (e.name === 'AbortError') return; // requête annulée volontairement
      // Message d'erreur lisible par l'utilisateur selon le type de problème
      if (!navigator.onLine) {
        setError('Pas de connexion internet. Vérifiez votre réseau et réessayez.');
      } else if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
        setError('Impossible d’atteindre le catalogue. Réessayez dans quelques secondes.');
      } else {
        setError('Erreur de recherche — réessayez ou modifiez votre recherche.');
      }
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