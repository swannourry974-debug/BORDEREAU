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

  const books = useMemo(() => commandes.map(bookFromCommande), [commandes]);
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

  if (loading) return <div className="text-center py-10 italic text-foreground/50">Chargement de votre bibliothèque…</div>;

  const visibleBooks = tab === 'favoris' ? favoriteBooks : books;

  return (
    <div>
      <AddedBookToast visible={toastVisible} />
      {selectedBook && <BookActionPanel book={selectedBook} favorite={favorites.includes(selectedBook.id)} onToggleFavorite={() => toggleFavorite(selectedBook.id)} onClose={() => setSelectedBook(null)} />}
      <BibliothequeHeroStats owned={books.length} read={readCount} favorites={favorites.length} level={level.current} />
      <LibrarySegmentedTabs active={tab} onChange={setTab} />
      {tab === 'wishlist' ? (
        <WishlistPanel items={wishlist} onAdd={addWishlist} onDelete={deleteWishlist} onImport={importWishlist} />
      ) : books.length === 0 && tab === 'bibliotheque' ? (
        /* État vide engageant avec CTA vers le catalogue */
        <div style={{
          background: 'var(--papier)', border: '1.5px dashed rgba(128,0,32,0.3)',
          padding: '40px 24px', textAlign: 'center',
          margin: '8px 0',
        }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📚</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 20, color: 'var(--encre)', marginBottom: 8 }}>
            Votre étagère est vide
          </div>
          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 14, color: 'rgba(26,16,8,0.55)', lineHeight: 1.7, marginBottom: 24 }}>
            Commandez votre premier livre depuis Paris —
            un voyageur l’apportera jusqu’à vous.
          </div>
          <a
            href="/catalogue"
            style={{
              display: 'inline-block',
              background: 'var(--bordeaux)', color: 'var(--creme)',
              padding: '10px 24px',
              fontFamily: 'Special Elite, monospace', fontSize: 11,
              letterSpacing: 2, textTransform: 'uppercase',
              textDecoration: 'none',
              outline: '2px dashed var(--bordeaux)', outlineOffset: 3,
            }}
          >
            Parcourir le catalogue
          </a>
        </div>
      ) : (
        <WoodenShelf books={visibleBooks} selectedId={selectedBook?.id} addedBookId={addedBookId} onSelect={setSelectedBook} />
      )}
      {tab === 'favoris' && favoriteBooks.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '32px 20px',
          fontFamily: 'IM Fell English, serif', fontStyle: 'italic',
          fontSize: 14, color: 'rgba(26,16,8,0.45)', lineHeight: 1.7,
        }}>
          ★ Marquez des livres en favoris pour les retrouver ici.
        </div>
      )}
      <BadgeProgressPanel count={books.length} />
    </div>
  );
}