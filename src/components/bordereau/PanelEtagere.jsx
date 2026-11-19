import React, { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import BibliothequeHeroStats from '@/components/bibliotheque/BibliothequeHeroStats';
import WoodenShelf from '@/components/bibliotheque/WoodenShelf';
import BookActionPanel from '@/components/bibliotheque/BookActionPanel';
import WishlistPanel from '@/components/bibliotheque/WishlistPanel';
import BadgeProgressPanel from '@/components/bibliotheque/BadgeProgressPanel';
import AddedBookToast from '@/components/bibliotheque/AddedBookToast';
import LibrarySegmentedTabs from '@/components/bibliotheque/LibrarySegmentedTabs';
import { bookFromCommande, getReaderLevel } from '@/components/bibliotheque/libraryUtils';

function EmptyReaderState({ title, text, cta }) {
  return (
    <div className="border p-8 text-center" style={{ background: 'linear-gradient(145deg, #FFF8EA, #F7EEDC)', borderColor: 'rgba(110,30,46,0.18)' }}>
      <div className="mx-auto mb-4 flex h-20 w-16 items-center justify-center border shadow-[0_12px_24px_rgba(59,42,35,0.12)]" style={{ background: '#6E1E2E', color: '#F3E8D2', borderColor: 'rgba(199,161,90,0.55)' }}>
        <span className="font-heading text-3xl">B</span>
      </div>
      <div className="font-heading text-2xl font-bold" style={{ color: '#6E1E2E' }}>{title}</div>
      <p className="mx-auto mt-2 max-w-sm font-body text-[16px] italic leading-relaxed text-[#3B2A23]/62">{text}</p>
      {cta && (
        <a href="/catalogue" className="mt-5 inline-flex min-h-[44px] items-center justify-center px-5 py-3 font-ui text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ background: '#C2410C', color: '#FDFCF0', textDecoration: 'none' }}>
          {cta}
        </a>
      )}
    </div>
  );
}

export default function PanelEtagere({ initialTab = 'bibliotheque' }) {
  const [user, setUser] = useState(null);
  const [commandes, setCommandes] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [tab, setTab] = useState(initialTab);
  const [favorites, setFavorites] = useState([]);
  const [addedBookId, setAddedBookId] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const previousCount = useRef(null);

  useEffect(() => setTab(initialTab), [initialTab]);

  const loadCommandes = async () => {
    const u = user || await base44.auth.me();
    setUser(u);
    const data = await base44.entities.Commande.filter({
      $or: [{ lecteur_email: u.email }, { created_by_id: u.id }, { created_by: u.email }],
    }, '-created_date', 100);
    if (previousCount.current !== null && data.length > previousCount.current) {
      setAddedBookId(data[0]?.id);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2600);
    }
    previousCount.current = data.length;
    setCommandes(data || []);
    setLoading(false);
  };

  const loadWishlist = async (u = user) => {
    if (!u) return;
    const data = await base44.entities.WishlistItem.filter({ user_email: u.email }, '-created_date', 100);
    setWishlist(data || []);
  };

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const saved = localStorage.getItem(`bordero_favorites_${u.email}`);
      setFavorites(saved ? JSON.parse(saved) : []);
      await Promise.all([loadCommandes(), loadWishlist(u)]);
    }).catch(() => setLoading(false));
    const unsubscribe = base44.entities.Commande.subscribe(() => loadCommandes().catch(() => {}));
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem(`bordero_favorites_${user.email}`, JSON.stringify(favorites));
  }, [favorites, user]);

  const books = useMemo(() => commandes.map((commande, index) => bookFromCommande(commande, index)), [commandes]);
  const favoriteBooks = books.filter(book => favorites.includes(book.id));
  const readCount = commandes.filter(c => ['livree', 'au_relais'].includes(c.statut)).length;
  const level = getReaderLevel(books.length);

  const toggleFavorite = (bookId) => {
    setFavorites(prev => prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]);
  };

  const addWishlist = async (item) => {
    const created = await base44.entities.WishlistItem.create({ ...item, user_email: user.email });
    setWishlist(prev => [created, ...prev]);
  };

  const deleteWishlist = async (item) => {
    await base44.entities.WishlistItem.delete(item.id);
    setWishlist(prev => prev.filter(w => w.id !== item.id));
  };

  const importWishlist = async (items) => {
    const created = await base44.entities.Commande.bulkCreate(items.map(item => ({
      lecteur_email: user.email,
      livre_titre: item.title,
      livre_auteur: item.author || '',
      livre_type: 'Poche',
      zone_nom: 'Bibliothèque Vivante',
      mode_livraison: 'express',
      montant_paye: item.price || 0,
      statut: 'payee',
      suivi_facturation_mode: 'application',
      suivi_active: true,
      facture_reference: `BORD-${Date.now()}-${item.id.slice(0, 4)}`,
      facture_emise_le: new Date().toISOString(),
    })));
    await Promise.all(items.map(item => base44.entities.WishlistItem.delete(item.id)));
    setWishlist([]);
    setCommandes(prev => [...created, ...prev]);
    setAddedBookId(created?.[0]?.id);
    setToastVisible(true);
    setTab('bibliotheque');
    setTimeout(() => setToastVisible(false), 2600);
  };

  if (loading) return <div className="bordero-empty-state font-body italic">Chargement de votre bibliothèque…</div>;

  const visibleBooks = tab === 'favoris' ? favoriteBooks : books;

  return (
    <div className="space-y-4">
      <AddedBookToast visible={toastVisible} />
      {selectedBook && <BookActionPanel book={selectedBook} favorite={favorites.includes(selectedBook.id)} onToggleFavorite={() => toggleFavorite(selectedBook.id)} onClose={() => setSelectedBook(null)} />}
      <BibliothequeHeroStats owned={books.length} read={readCount} favorites={favorites.length} level={level.current} />
      <LibrarySegmentedTabs active={tab} onChange={setTab} />
      {tab === 'wishlist' ? (
        <WishlistPanel items={wishlist} onAdd={addWishlist} onDelete={deleteWishlist} onImport={importWishlist} />
      ) : books.length === 0 && tab === 'bibliotheque' ? (
        <EmptyReaderState title="Votre étagère est vide" text="Commandez votre premier livre depuis Paris. Un voyageur l’apportera jusqu’à vous." cta="Parcourir le catalogue" />
      ) : tab === 'favoris' && favoriteBooks.length === 0 ? (
        <EmptyReaderState title="Aucun favori pour l’instant" text="Ouvrez un livre de votre bibliothèque et marquez-le en favori pour le retrouver ici." />
      ) : (
        <WoodenShelf books={visibleBooks} selectedId={selectedBook?.id} addedBookId={addedBookId} onSelect={setSelectedBook} />
      )}
      <BadgeProgressPanel count={books.length} />
    </div>
  );
}