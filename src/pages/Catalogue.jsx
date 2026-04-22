import React, { useState } from 'react';
import WelcomeCard from '@/components/shared/WelcomeCard';
import SectionTitle from '@/components/shared/SectionTitle';
import SearchBlock from '@/components/catalogue/SearchBlock';
import BookCard from '@/components/catalogue/BookCard';
import CommandeForm from '@/components/catalogue/CommandeForm';
import { toast } from 'sonner';

const BOOKS = [
  { id: 1, title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry', type: 'Poche', price: '8,90 €', availability: '2 voyageurs', coverText: 'LE PETIT\nPRINCE' },
  { id: 2, title: "L'Élégance du hérisson", author: 'Muriel Barbery', type: 'Poche', price: '9,50 €', availability: '1 voyageur', coverText: "L'ÉLÉGANCE\nDU\nHÉRISSON" },
  { id: 3, title: 'Les Misérables', author: 'Victor Hugo', type: 'Broché', price: '28,00 €', availability: 'Collecte', coverText: 'LES\nMISÉRABLES' },
  { id: 4, title: 'Astérix & Obélix T.1', author: 'Goscinny & Uderzo', type: 'BD', price: '11,50 €', availability: '3 voyageurs', coverText: 'ASTÉRIX\nT.1' },
];

export default function Catalogue() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = searchQuery
    ? BOOKS.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : BOOKS;

  const handleConfirm = () => {
    setSelectedBook(null);
    toast.success('Commande confirmée ! Votre livre est en séquestre.', {
      description: 'Un voyageur va prendre en charge votre mission.',
    });
  };

  return (
    <div>
      <WelcomeCard
        eyebrow="Bonjour, Lecteur"
        title="Quels livres vous<br>manquent ce soir ?"
        subtitle="📍 Livraison vers : Miami, FL · USA"
      />

      <SectionTitle>Rechercher un livre</SectionTitle>
      <SearchBlock onSearch={setSearchQuery} />

      <CommandeForm
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onConfirm={handleConfirm}
      />

      <SectionTitle>Disponibles pour Miami</SectionTitle>

      <div className="pl-7">
        {filteredBooks.map((book, i) => (
          <BookCard
            key={book.id}
            book={book}
            index={i}
            onClick={() => setSelectedBook(book)}
          />
        ))}
        {filteredBooks.length === 0 && (
          <div className="text-center py-8 text-foreground/40 italic font-fell text-[13px]">
            Aucun livre trouvé pour « {searchQuery} »
          </div>
        )}
      </div>
    </div>
  );
}