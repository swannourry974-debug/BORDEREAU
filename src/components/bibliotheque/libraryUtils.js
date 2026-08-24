export const LIBRARY_COLORS = {
  wine: '#4B1E1E',
  cream: '#F5E6CC',
  gold: '#C8A165',
  leather: '#2A100D',
  wood: '#5A2F1F',
};

export const BADGE_LEVELS = [
  { name: 'Lecteur Curieux', threshold: 10, icon: '✦' },
  { name: 'Bibliophile', threshold: 25, icon: '★' },
  { name: 'Collectionneur', threshold: 50, icon: '♛' },
  { name: 'Maître de la Bibliothèque', threshold: 100, icon: '⚜' },
];

const BOOK_COLORS = ['#1F2F2A', '#6B2B1D', '#1A2B44', '#7A5A2A', '#231716', '#E6D2AE'];

export function getReaderLevel(count) {
  const unlocked = BADGE_LEVELS.filter(level => count >= level.threshold).pop();
  const next = BADGE_LEVELS.find(level => count < level.threshold) || BADGE_LEVELS[BADGE_LEVELS.length - 1];
  const previous = unlocked?.threshold || 0;
  const span = Math.max(1, next.threshold - previous);
  const progress = next.threshold === previous ? 100 : Math.min(100, Math.round(((count - previous) / span) * 100));
  return { current: unlocked?.name || 'Lecteur Curieux', next, progress };
}

export function bookFromCommande(commande, index) {
  return {
    id: commande.id,
    title: commande.livre_titre || 'Livre Bordero',
    author: commande.livre_auteur || 'Auteur inconnu',
    price: commande.montant_paye || 0,
    date: commande.facture_emise_le || commande.created_date,
    orderNumber: commande.facture_reference || `BORD-${commande.id?.slice?.(0, 6) || index + 1}`,
    paymentMethod: commande.stripe_session_id ? 'Carte bancaire' : 'Bordero',
    status: commande.statut,
    color: BOOK_COLORS[index % BOOK_COLORS.length],
    raw: commande,
  };
}

export function chunkBooks(books, size = 5) {
  const rows = [];
  for (let i = 0; i < books.length; i += size) rows.push(books.slice(i, i + size));
  return rows.length ? rows : [[]];
}

export function formatMoney(value) {
  return `${Number(value || 0).toFixed(2).replace('.', ',')} €`;
}

export function formatDate(value) {
  if (!value) return 'Date indisponible';
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}