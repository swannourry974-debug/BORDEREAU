import React, { useState, useEffect } from 'react';
import WelcomeCard from '@/components/shared/WelcomeCard';
import SectionTitle from '@/components/shared/SectionTitle';
import SearchBlock from '@/components/catalogue/SearchBlock';
import BookCard from '@/components/catalogue/BookCard';
import AddToCartForm from '@/components/catalogue/AddToCartForm';
import BookOrders from '@/components/catalogue/BookOrders';
import ISBNScanner from '@/components/catalogue/ISBNScanner';
import BookValidation from '@/components/catalogue/BookValidation';
import PullToRefresh from '@/components/shared/PullToRefresh';
import PanierCheckout from '@/components/catalogue/PanierCheckout';
import ConfirmationBordereau from '@/components/catalogue/ConfirmationBordereau';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useCart } from '@/lib/CartContext';
import { toast } from 'sonner';
import CityPicker from '@/components/catalogue/CityPicker';
import { getZoneById } from '@/lib/tarifsConfig';

const DEFAULT_BOOKS_BASE = [
  { id: 1, title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry', type: 'Poche', price: '8,90 €', availability: '2 voyageurs', coverText: 'LE PETIT\nPRINCE' },
  { id: 2, title: "L'Élégance du hérisson", author: 'Muriel Barbery', type: 'Poche', price: '9,50 €', availability: '1 voyageur', coverText: "L'ÉLÉGANCE\nDU\nHÉRISSON" },
  { id: 3, title: 'Les Misérables', author: 'Victor Hugo', type: 'Broché', price: '28,00 €', availability: 'Collecte', coverText: 'LES\nMISÉRABLES' },
  { id: 4, title: 'Astérix & Obélix T.1', author: 'Goscinny & Uderzo', type: 'BD', price: '11,50 €', availability: '3 voyageurs', coverText: 'ASTÉRIX\nT.1' },
];

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

export default function PanelCatalogue({ commandeOpen, commandeBook, onOpenCommande, onCloseCommande }) {
  const { results, loading, error, search, searchDebounced, reset } = useBookSearch();
  const { items } = useCart();
  const [hasSearched, setHasSearched] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedBook, setScannedBook] = useState(null);
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [orderingBook, setOrderingBook] = useState(null);
  const [panierOpen, setPanierOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [defaultBooks, setDefaultBooks] = useState(DEFAULT_BOOKS_BASE);
  const [selectedCity, setSelectedCity] = useState({ label: 'Miami, FL — USA', emoji: '🇺🇸', zone_id: 'international' });
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  // Enrichir les livres par défaut avec les couvertures via Google Books
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

  const handleSearch = (query) => {
    if (!query || query.trim().length < 2) {
      reset();
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
    searchDebounced(query, 350);
  };

  const handleISBNResult = async (isbn) => {
    setScannerOpen(false);

    const isISBN = /^[0-9X]{10,13}$/.test(isbn);
    if (isISBN) {
      setIsbnLoading(true);
      try {
        let formatted = null;

        // 1) Open Library en priorité (fiable, sans quota, couverture mondiale)
        try {
          const olRes = await fetch(
            `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
          );
          const olData = await olRes.json();
          const book = olData[`ISBN:${isbn}`];
          if (book) {
            const pages = book.number_of_pages || null;
            formatted = {
              id: isbn,
              title: book.title,
              author: book.authors?.[0]?.name || 'Auteur inconnu',
              isbn,
              coverId: null,
              coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
              pages,
              type: pages > 400 ? 'Broché' : 'Poche',
              priceVal: pages > 400 ? 24.0 : 9.9,
            };
          }
        } catch {}

        // 2) Google Books en fallback (si quota disponible)
        if (!formatted) {
          try {
            const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
            const gbData = await gbRes.json();
            const item = gbData?.items?.[0]?.volumeInfo;
            if (item) {
              const pages = item.pageCount || null;
              formatted = {
                id: isbn,
                title: item.title,
                author: item.authors?.[0] || 'Auteur inconnu',
                isbn,
                coverId: null,
                coverUrl: item.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
                pages,
                type: pages > 400 ? 'Broché' : 'Poche',
                priceVal: pages > 400 ? 24.0 : 9.9,
              };
            }
          } catch {}
        }

        if (formatted) {
          setScannedBook(formatted);
        } else {
          // ISBN non trouvé nulle part → formulaire manuel
          setScannedBook({ id: isbn, title: '', author: '', isbn, coverUrl: null, pages: null, type: 'Poche', priceVal: '' });
          toast('ISBN non trouvé — veuillez compléter les informations manuellement.');
        }
      } finally {
        setIsbnLoading(false);
      }
    } else {
      // C'est un titre ou auteur → recherche normale
      setHasSearched(true);
      search(isbn); // pas de debounce ici car déjà soumis manuellement
    }
  };

  const handleValidationConfirm = ({ book, total, commandeId }) => {
    setScannedBook(null);
    setConfirmation({ commandeId, bookTitle: book.title });
    toast.success(`"${book.title}" ajouté à votre liste !`, {
      description: `Total séquestre : ${total} €`,
    });
  };

  const displayBooks = hasSearched ? results : defaultBooks;

  const handleRefresh = async () => {
    if (hasSearched) { reset(); setHasSearched(false); }
    await new Promise(r => setTimeout(r, 800));
  };

  return (
    <>
      {/* Sélecteur de ville */}
      {cityPickerOpen && (
        <CityPicker
          selected={selectedCity}
          onSelect={setSelectedCity}
          onClose={() => setCityPickerOpen(false)}
        />
      )}

      {/* Scanner plein écran */}
      {scannerOpen && (
        <ISBNScanner
          onResult={handleISBNResult}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* Panier checkout */}
      {panierOpen && <PanierCheckout onClose={() => setPanierOpen(false)} />}

      <PullToRefresh onRefresh={handleRefresh}>
        <div>
          <WelcomeCard
            eyebrow="Bonjour, Lecteur"
            title="Quels livres vous manquent ce soir ?"
            subtitle={
              <span
                onClick={() => setCityPickerOpen(true)}
                style={{ cursor: 'pointer', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}
              >
                📍 Livraison vers : {selectedCity.emoji} {selectedCity.label} ›
              </span>
            }
          />

          <SectionTitle>Rechercher un livre</SectionTitle>
          <SearchBlock onSearch={handleSearch} onScanOpen={() => setScannerOpen(true)} />

          {/* Bouton panier flottant */}
          {items.length > 0 && (
            <button
              onClick={() => setPanierOpen(true)}
              style={{
                position: 'sticky', top: 12, zIndex: 50, width: '100%',
                background: 'var(--bordeaux)', color: 'var(--creme)',
                border: 'none', padding: '11px 16px', cursor: 'pointer',
                fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 14, boxShadow: '3px 3px 0 rgba(90,0,21,0.5)',
              }}
            >
              <span>🛒 Mon panier — {items.length} livre{items.length !== 1 ? 's' : ''}</span>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700 }}>
                {items.reduce((s, i) => s + i.prixVal, 0).toFixed(2)} € →
              </span>
            </button>
          )}

          {/* QR Code confirmation après commande */}
          {confirmation && (
            <ConfirmationBordereau
              commandeId={confirmation.commandeId}
              bookTitle={confirmation.bookTitle}
              onClose={() => setConfirmation(null)}
            />
          )}

          {/* Chargement ISBN */}
          {isbnLoading && (
            <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
              Identification du livre en cours...
            </div>
          )}

          {/* Validation livre scanné */}
          {scannedBook && !isbnLoading && (
            <>
              <SectionTitle>Valider la commande</SectionTitle>
              <BookValidation
                book={scannedBook}
                zone={getZoneById(selectedCity?.zone_id)}
                onConfirm={handleValidationConfirm}
                onCancel={() => setScannedBook(null)}
              />
            </>
          )}

          {/* Commandes des autres pour ce livre */}
          {!scannedBook && selectedBook && !orderingBook && (
            <BookOrders
              book={selectedBook}
              onOrder={() => { setOrderingBook(selectedBook); setSelectedBook(null); }}
              onClose={() => setSelectedBook(null)}
            />
          )}

          {/* Formulaire ajout au panier */}
          {!scannedBook && (
            <AddToCartForm
              book={orderingBook}
              onClose={() => setOrderingBook(null)}
            />
          )}

          <SectionTitle>{hasSearched ? 'Résultats de recherche' : `Disponibles pour ${selectedCity.label.split(',')[0]}`}</SectionTitle>

          {loading && (
            <div className="text-center py-8 text-foreground/40 italic font-fell text-[13px]">
              Recherche en cours...
            </div>
          )}

          {error && (
            <div className="text-center py-4 text-destructive italic font-fell text-[13px]">{error}</div>
          )}

          {!loading && !scannedBook && (
            <div className="pl-7">
              {displayBooks.map((book, i) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={i}
                  onClick={() => { setSelectedBook(book); setOrderingBook(null); }}
                />
              ))}
              {hasSearched && !loading && displayBooks.length === 0 && (
                <div className="text-center py-8 text-foreground/40 italic font-fell text-[13px]">
                  Aucun livre trouvé.
                </div>
              )}
            </div>
          )}
        </div>
      </PullToRefresh>
    </>
  );
}