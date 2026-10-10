import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/shared/SectionTitle';
import SearchBlock from '@/components/catalogue/SearchBlock';
import CatalogueSearchIntro from '@/components/catalogue/CatalogueSearchIntro';
import CatalogueOrderStep from '@/components/catalogue/CatalogueOrderStep';
import CatalogueStepDots from '@/components/catalogue/CatalogueStepDots';
import BookCard from '@/components/catalogue/BookCard';
import AddToCartForm from '@/components/catalogue/AddToCartForm';
import ISBNScanner from '@/components/catalogue/ISBNScanner';
import PullToRefresh from '@/components/shared/PullToRefresh';
import PanierCheckout from '@/components/catalogue/PanierCheckout';
import ConfirmationBordero from '@/components/catalogue/ConfirmationBordereau';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useCart } from '@/lib/CartContext';
import { toast } from 'sonner';
import { formatEuro, extractGoogleBookPrice } from '@/lib/bookPricing';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_BOOKS_BASE = [];

async function fetchCoverUrl(title, author) {
  try {
    const q = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&langRestrict=fr`);
    const data = await res.json();
    const thumb = data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
    return thumb ? thumb.replace('http://', 'https://').replace('&edge=curl', '') : null;
  } catch {
    return null;
  }
}

async function fetchGooglePriceByIsbn(isbn) {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1&langRestrict=fr`);
    const data = await res.json();
    const price = extractGoogleBookPrice(data?.items?.[0]?.saleInfo || {});
    return price.available ? price : { value: 0, label: 'Livre remboursé sur justificatif', available: false, source: 'livraison_seule' };
  } catch {
    return { value: 0, label: 'Livre remboursé sur justificatif', available: false, source: 'livraison_seule' };
  }
}

export default function PanelCatalogue() {
  const { results, loading, error, search, searchDebounced, reset } = useBookSearch();
  const { items } = useCart();
  const [hasSearched, setHasSearched] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [orderingBook, setOrderingBook] = useState(null);
  const [panierOpen, setPanierOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [defaultBooks, setDefaultBooks] = useState(DEFAULT_BOOKS_BASE);
  const [catalogueStep, setCatalogueStep] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const modalParam = searchParams.get('modal');

  const setModalParam = (modal) => {
    const next = new URLSearchParams(searchParams);
    next.set('modal', modal);
    setSearchParams(next);
  };

  const clearModalParam = (modal) => {
    const next = new URLSearchParams(searchParams);
    if (next.get('modal') === modal) {
      next.delete('modal');
      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      DEFAULT_BOOKS_BASE.map(async (book) => {
        const coverUrl = await fetchCoverUrl(book.title, book.author);
        return { ...book, coverUrl };
      })
    ).then((enriched) => {
      if (!cancelled) setDefaultBooks(enriched);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (modalParam !== 'panier') setPanierOpen(false);
    if (modalParam !== 'add-to-cart') setOrderingBook(null);
  }, [modalParam]);

  const handleSearch = (query) => {
    if (!query || query.trim().length < 2) {
      reset();
      setHasSearched(false);
      return;
    }
    setCatalogueStep(1);
    setHasSearched(true);
    searchDebounced(query, 350);
  };

  const openBookChoice = (book) => {
    setOrderingBook(book);
    setCatalogueStep(2);
    setModalParam('add-to-cart');
  };

  const handleISBNResult = async (isbn) => {
    setScannerOpen(false);

    const isISBN = /^[0-9X]{10,13}$/.test(isbn);
    if (isISBN) {
      setIsbnLoading(true);
      try {
        let formatted = null;

        try {
          const olRes = await fetch(
            `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
          );
          const olData = await olRes.json();
          const book = olData[`ISBN:${isbn}`];
          if (book) {
            const pages = book.number_of_pages || null;
            const type = pages > 400 ? 'Broché' : 'Poche';
            const googlePrice = await fetchGooglePriceByIsbn(isbn);
            formatted = {
              id: isbn,
              title: book.title,
              author: book.authors?.[0]?.name || 'Auteur inconnu',
              isbn,
              coverId: null,
              coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
              pages,
              type,
              price: googlePrice.available ? formatEuro(googlePrice.value) : googlePrice.label,
              priceVal: googlePrice.value,
              prixLivreDisponible: googlePrice.available,
              prixLivreSource: googlePrice.source,
            };
          }
        } catch {}

        if (!formatted) {
          try {
            const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
            const gbData = await gbRes.json();
            const item = gbData?.items?.[0]?.volumeInfo;
            if (item) {
              const pages = item.pageCount || null;
              const type = pages > 400 ? 'Broché' : 'Poche';
              const googlePrice = extractGoogleBookPrice(gbData?.items?.[0]?.saleInfo || {});
              formatted = {
                id: isbn,
                title: item.title,
                author: item.authors?.[0] || 'Auteur inconnu',
                isbn,
                coverId: null,
                coverUrl: item.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
                pages,
                type,
                price: googlePrice.available ? formatEuro(googlePrice.value) : googlePrice.label,
                priceVal: googlePrice.value,
                prixLivreDisponible: googlePrice.available,
                prixLivreSource: googlePrice.source,
              };
            }
          } catch {}
        }

        if (formatted) {
          openBookChoice(formatted);
        } else {
          toast('ISBN non trouvé — recherchez le titre manuellement pour continuer.');
        }
      } finally {
        setIsbnLoading(false);
      }
    } else {
      setHasSearched(true);
      setCatalogueStep(1);
      search(isbn);
    }
  };

  const displayBooks = hasSearched ? results : defaultBooks;

  const handleRefresh = async () => {
    if (hasSearched) { reset(); setHasSearched(false); }
    setCatalogueStep(1);
    await new Promise(r => setTimeout(r, 800));
  };

  return (
    <>
      {scannerOpen && (
        <ISBNScanner
          onResult={handleISBNResult}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {panierOpen && <PanierCheckout onClose={() => { setPanierOpen(false); clearModalParam('panier'); }} />}

      <PullToRefresh onRefresh={handleRefresh}>
        <div>
          <CatalogueStepDots step={catalogueStep} />

          {items.length > 0 && catalogueStep !== 3 && (
            <button
              onClick={() => setCatalogueStep(3)}
              style={{
                position: 'sticky', top: 12, zIndex: 50, width: '100%',
                background: 'var(--bordeaux)', color: 'var(--creme)',
                border: 'none', padding: '11px 16px', cursor: 'pointer',
                fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 14, boxShadow: '3px 3px 0 rgba(90,0,21,0.5)',
              }}
            >
              <span>🛒 Voir résumé — {items.length} livre{items.length !== 1 ? 's' : ''}</span>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700 }}>
                {items.reduce((s, i) => s + i.prixVal, 0).toFixed(2)} € →
              </span>
            </button>
          )}

          {confirmation && (
            <ConfirmationBordero
              commandeId={confirmation.commandeId}
              bookTitle={confirmation.bookTitle}
              onClose={() => setConfirmation(null)}
            />
          )}

          {catalogueStep === 1 && (
            <>
              <CatalogueSearchIntro />
              <SectionTitle>Rechercher un livre</SectionTitle>
              <SearchBlock onSearch={handleSearch} onScanOpen={() => setScannerOpen(true)} onScanResult={handleISBNResult} />

              {isbnLoading && (
                <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                  Identification du livre en cours...
                </div>
              )}

              <SectionTitle>{hasSearched ? 'Résultats de recherche' : 'Découverte catalogue'}</SectionTitle>

              {loading && (
                <div className="text-center py-8 text-foreground/40 italic font-fell text-[13px]">
                  Recherche en cours...
                </div>
              )}

              {error && (
                <div style={{
                  background: 'rgba(180,20,20,0.06)',
                  border: '1px dashed #b41414',
                  padding: '12px 16px',
                  marginBottom: 12,
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                  <div>
                    <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#b41414', marginBottom: 3 }}>Recherche impossible</div>
                    <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.65)', lineHeight: 1.6 }}>{error}</div>
                  </div>
                </div>
              )}

              {!loading && (
                <div className="pl-0 sm:pl-7">
                  {displayBooks.map((book, i) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      index={i}
                      deliveryPrice={0}
                      showSavings={false}
                      onClick={() => openBookChoice(book)}
                    />
                  ))}
                  {!hasSearched && displayBooks.length === 0 && (
                    <div className="text-center py-8 text-foreground/40 italic font-fell text-[13px]">
                      Recherchez un titre, un auteur ou scannez un ISBN pour choisir d'abord votre livre.
                    </div>
                  )}
                  {hasSearched && displayBooks.length === 0 && (
                    <div className="text-center py-8 text-foreground/40 italic font-fell text-[13px]">
                      Aucun livre trouvé.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {catalogueStep === 2 && (
            <AddToCartForm
              book={orderingBook}
              onItemAdded={() => setCatalogueStep(3)}
              onClose={() => { setOrderingBook(null); setCatalogueStep(1); clearModalParam('add-to-cart'); }}
            />
          )}

          {catalogueStep === 3 && (
            <CatalogueOrderStep
              onBack={() => setCatalogueStep(1)}
              onPay={() => { setPanierOpen(true); setModalParam('panier'); }}
            />
          )}
        </div>
      </PullToRefresh>
    </>
  );
}