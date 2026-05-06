import React, { useState } from 'react';
import WelcomeCard from '@/components/shared/WelcomeCard';
import SectionTitle from '@/components/shared/SectionTitle';
import SearchBlock from '@/components/catalogue/SearchBlock';
import BookCard from '@/components/catalogue/BookCard';
import CommandeForm from '@/components/catalogue/CommandeForm';
import ISBNScanner from '@/components/catalogue/ISBNScanner';
import BookValidation from '@/components/catalogue/BookValidation';
import PullToRefresh from '@/components/shared/PullToRefresh';
import { useOpenLibrary } from '@/hooks/useOpenLibrary';
import { toast } from 'sonner';

const DEFAULT_BOOKS = [
  { id: 1, title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry', type: 'Poche', price: '8,90 €', availability: '2 voyageurs', coverText: 'LE PETIT\nPRINCE' },
  { id: 2, title: "L'Élégance du hérisson", author: 'Muriel Barbery', type: 'Poche', price: '9,50 €', availability: '1 voyageur', coverText: "L'ÉLÉGANCE\nDU\nHÉRISSON" },
  { id: 3, title: 'Les Misérables', author: 'Victor Hugo', type: 'Broché', price: '28,00 €', availability: 'Collecte', coverText: 'LES\nMISÉRABLES' },
  { id: 4, title: 'Astérix & Obélix T.1', author: 'Goscinny & Uderzo', type: 'BD', price: '11,50 €', availability: '3 voyageurs', coverText: 'ASTÉRIX\nT.1' },
];

export default function PanelCatalogue({ commandeOpen, commandeBook, onOpenCommande, onCloseCommande }) {
  const { results, loading, error, search, reset, searchByISBN } = useOpenLibrary();
  const [hasSearched, setHasSearched] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedBook, setScannedBook] = useState(null); // livre trouvé via ISBN → validation
  const [isbnLoading, setIsbnLoading] = useState(false);

  const handleSearch = (query) => {
    if (!query || query.trim().length < 2) {
      reset();
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
    search(query);
  };

  const handleISBNResult = async (isbn) => {
    setScannerOpen(false);

    // Si c'est un ISBN (numérique), on fetch directement les métadonnées enrichies
    const isISBN = /^[0-9X]{10,13}$/.test(isbn);
    if (isISBN) {
      setIsbnLoading(true);
      try {
        const res = await fetch(
          `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
        );
        const data = await res.json();
        const key = `ISBN:${isbn}`;
        const book = data[key];
        if (book) {
          const pages = book.number_of_pages || null;
          const formatted = {
            id: isbn,
            title: book.title,
            author: book.authors?.[0]?.name || 'Auteur inconnu',
            isbn,
            coverId: null,
            coverUrl: book.cover?.large || book.cover?.medium || null,
            pages,
            type: pages > 400 ? 'Broché' : 'Poche',
            priceVal: pages > 400 ? 24.0 : 9.9,
          };
          setScannedBook(formatted);
        } else {
          // ISBN inconnu → formulaire manuel vide
          setScannedBook({ id: isbn, title: '', author: '', isbn, coverUrl: null, pages: null, type: 'Poche', priceVal: '' });
          toast('ISBN inconnu — veuillez compléter les informations manuellement.');
        }
      } catch {
        toast.error('Erreur lors de la recherche ISBN.');
      } finally {
        setIsbnLoading(false);
      }
    } else {
      // C'est un titre ou auteur → recherche normale
      setHasSearched(true);
      search(isbn);
    }
  };

  const handleValidationConfirm = ({ book, format, prix, total }) => {
    setScannedBook(null);
    toast.success(`"${book.title}" ajouté à votre liste !`, {
      description: `Total séquestre : ${total} € · Un voyageur prend en charge.`,
    });
  };

  const displayBooks = hasSearched ? results : DEFAULT_BOOKS;

  const handleConfirm = () => {
    onCloseCommande();
    toast.success('Commande confirmée ! Votre livre est en séquestre.', {
      description: 'Un voyageur va prendre en charge votre mission.',
    });
  };

  const handleRefresh = async () => {
    if (hasSearched) { reset(); setHasSearched(false); }
    await new Promise(r => setTimeout(r, 800));
  };

  return (
    <>
      {/* Scanner plein écran */}
      {scannerOpen && (
        <ISBNScanner
          onResult={handleISBNResult}
          onClose={() => setScannerOpen(false)}
        />
      )}

      <PullToRefresh onRefresh={handleRefresh}>
        <div>
          <WelcomeCard
            eyebrow="Bonjour, Lecteur"
            title="Quels livres vous manquent ce soir ?"
            subtitle="📍 Livraison vers : Miami, FL · USA"
          />

          <SectionTitle>Rechercher un livre</SectionTitle>
          <SearchBlock onSearch={handleSearch} onScanOpen={() => setScannerOpen(true)} />

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
                zone={null}
                onConfirm={handleValidationConfirm}
                onCancel={() => setScannedBook(null)}
              />
            </>
          )}

          {/* Formulaire commande classique */}
          {!scannedBook && (
            <CommandeForm
              book={commandeBook}
              onClose={onCloseCommande}
              onConfirm={handleConfirm}
            />
          )}

          <SectionTitle>{hasSearched ? 'Résultats de recherche' : 'Disponibles pour Miami'}</SectionTitle>

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
                  onClick={() => onOpenCommande(book)}
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