import React, { useState } from 'react';
import WelcomeCard from '@/components/shared/WelcomeCard';
import SectionTitle from '@/components/shared/SectionTitle';
import SearchBlock from '@/components/catalogue/SearchBlock';
import BookCard from '@/components/catalogue/BookCard';
import CommandeForm from '@/components/catalogue/CommandeForm';
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
  const { results, loading, error, search, reset } = useOpenLibrary();
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (query) => {
    if (!query || query.trim().length < 2) {
      reset();
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
    search(query);
  };

  const displayBooks = hasSearched ? results : DEFAULT_BOOKS;

  const handleConfirm = () => {
    onCloseCommande();
    toast.success('Commande confirmée ! Votre livre est en séquestre.', {
      description: 'Un voyageur va prendre en charge votre mission.',
    });
  };

  const handleRefresh = async () => {
    if (hasSearched) {
      reset();
      setHasSearched(false);
    }
    await new Promise(r => setTimeout(r, 800));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div>
      <WelcomeCard
        eyebrow="Bonjour, Lecteur"
        title="Quels livres vous manquent ce soir ?"
        subtitle="📍 Livraison vers : Miami, FL · USA"
      />

      <SectionTitle>Rechercher un livre</SectionTitle>
      <SearchBlock onSearch={handleSearch} />

      <CommandeForm
        book={commandeBook}
        onClose={onCloseCommande}
        onConfirm={handleConfirm}
      />

      <SectionTitle>{hasSearched ? 'Résultats de recherche' : 'Disponibles pour Miami'}</SectionTitle>

      {loading && (
        <div className="text-center py-8 text-foreground/40 italic font-fell text-[13px]">
          Recherche en cours...
        </div>
      )}

      {error && (
        <div className="text-center py-4 text-destructive italic font-fell text-[13px]">{error}</div>
      )}

      {!loading && (
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
  );
}