export function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function isValidIsbn13(value = '') {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (!/^\d{13}$/.test(digits)) return false;
  const sum = digits.slice(0, 12).split('').reduce((total, char, index) => total + Number(char) * (index % 2 ? 3 : 1), 0);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(digits[12]);
}

export function isValidIsbn10(value = '') {
  const clean = String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
  if (!/^\d{9}[\dX]$/.test(clean)) return false;
  const sum = clean.split('').reduce((total, char, index) => total + (char === 'X' ? 10 : Number(char)) * (10 - index), 0);
  return sum % 11 === 0;
}

export function isbn10To13(value = '') {
  const clean = String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
  if (!isValidIsbn10(clean)) return null;
  const base = `978${clean.slice(0, 9)}`;
  const sum = base.split('').reduce((total, char, index) => total + Number(char) * (index % 2 ? 3 : 1), 0);
  return `${base}${(10 - (sum % 10)) % 10}`;
}

export function normalizeIsbn(value = '') {
  const clean = String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
  if (isValidIsbn13(clean)) return clean;
  if (isValidIsbn10(clean)) return isbn10To13(clean);
  return null;
}

export function parsePrice(value) {
  const price = Number(String(value ?? '').replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(price) && price > 0 ? Math.round(price * 100) / 100 : null;
}

export function safeUrl(value = '') {
  try {
    const url = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

export function parseCsvLine(line = '') {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map(cell => cell.trim());
}

export function isTruthyStock(value) {
  const text = normalizeText(value);
  if (!text) return false;
  return ['1', 'true', 'yes', 'oui', 'y', 'in stock', 'instock', 'en stock', 'available', 'disponible'].some(token => text === token || text.includes(token));
}

export function isBookCategory(category = '', title = '') {
  const text = normalizeText(`${category} ${title}`);
  const excluded = ['papeterie', 'dvd', 'blu ray', 'bluray', 'cd', 'vinyle', 'jeux video', 'jeu video', 'jouet', 'goodies', 'figurine', 'agenda', 'calendrier', 'loisir creatif', 'fourniture'];
  if (excluded.some(word => text.includes(word))) return false;
  const included = ['livre', 'roman', 'poche', 'bd', 'bande dessinee', 'manga', 'litterature', 'jeunesse', 'essai', 'scolaire', 'parascolaire', 'beau livre', 'bibliotheque'];
  return included.some(word => text.includes(word));
}

export function inferBookType(category = '', title = '') {
  const text = normalizeText(`${category} ${title}`);
  if (text.includes('bd') || text.includes('bande dessinee')) return 'BD';
  if (text.includes('beau livre') || text.includes('relie')) return 'Relié';
  if (text.includes('broche')) return 'Broché';
  return 'Poche';
}

export function inferAuthor(row = {}) {
  const direct = row.author || row.auteur || row.creator || row.brand || '';
  if (direct && normalizeText(direct) !== 'cultura') return String(direct).trim();
  const name = String(row.product_name || row.title || '').trim();
  const parts = name.split(/\s[-–—|/]\s/).map(part => part.trim()).filter(Boolean);
  if (parts.length > 1 && parts[parts.length - 1].length < 80) return parts[parts.length - 1];
  return '';
}

export function bestOffer(offers = []) {
  const ranked = [...offers].sort((a, b) => {
    const av = offerAvailable(a) ? 0 : 1;
    const bv = offerAvailable(b) ? 0 : 1;
    if (av !== bv) return av - bv;
    return Number(a.price || 999999) - Number(b.price || 999999);
  });
  return ranked[0] || null;
}

export function offerAvailable(offer = {}) {
  if (Number(offer.stock_quantity || 0) > 0) return true;
  return isTruthyStock(offer.availability);
}

export function lightBook(book = {}, offers = [], origin = undefined) {
  const offer = bestOffer(offers);
  return {
    id: book.id,
    isbn13: book.isbn13,
    ean: book.ean,
    title: book.title,
    author: book.author,
    category: book.category,
    image_url: book.image_url,
    language: book.language,
    publisher: book.publisher,
    price: offer?.price || 0,
    currency: offer?.currency || 'EUR',
    availability: offer?.availability || 'indisponible',
    last_updated: offer?.last_updated || book.updated_date,
    best_offer: offer,
    offers,
    origin,
  };
}

export async function fetchOffersByBookIds(base44, bookIds = []) {
  const ids = [...new Set(bookIds.filter(Boolean))];
  if (!ids.length) return new Map();
  const page = await base44.asServiceRole.entities.BookOffers.filter({ book_id: { $in: ids } }, { limit: Math.min(500, Math.max(1, ids.length * 8)) });
  const offers = page.items || page || [];
  const map = new Map();
  offers.forEach((offer) => {
    if (!map.has(offer.book_id)) map.set(offer.book_id, []);
    map.get(offer.book_id).push(offer);
  });
  return map;
}

function sortAvailableThenPrice(a, b) {
  const av = offerAvailable(a.best_offer) ? 0 : 1;
  const bv = offerAvailable(b.best_offer) ? 0 : 1;
  if (av !== bv) return av - bv;
  return Number(a.price || 999999) - Number(b.price || 999999);
}

export async function buildSuggestionsForBook(base44, book, maxSuggestions = 5) {
  const max = Math.max(0, Math.min(Number(maxSuggestions || 0), 5));
  if (!book || max === 0) return [];
  const seen = new Set([book.id, book.isbn13].filter(Boolean));

  const authorPage = book.author_norm
    ? await base44.asServiceRole.entities.Books.filter({ author_norm: book.author_norm }, { sort: 'title_norm', limit: 30 })
    : { items: [] };
  const authorBooks = (authorPage.items || authorPage || []).filter(candidate => !seen.has(candidate.id) && !seen.has(candidate.isbn13));

  const categoryPage = book.category_norm
    ? await base44.asServiceRole.entities.Books.filter({ category_norm: book.category_norm }, { sort: 'title_norm', limit: 30 })
    : { items: [] };
  const categoryBooks = (categoryPage.items || categoryPage || []).filter(candidate => !seen.has(candidate.id) && !seen.has(candidate.isbn13));

  const allIds = [...authorBooks, ...categoryBooks].map(candidate => candidate.id);
  const offersMap = await fetchOffersByBookIds(base44, allIds);
  const sameAuthor = authorBooks.map(candidate => lightBook(candidate, offersMap.get(candidate.id) || [], 'same_author')).sort(sortAvailableThenPrice);
  const sameCategory = categoryBooks.map(candidate => lightBook(candidate, offersMap.get(candidate.id) || [], 'same_category')).sort(sortAvailableThenPrice);

  const buckets = [
    sameAuthor.filter(item => offerAvailable(item.best_offer)),
    sameCategory.filter(item => offerAvailable(item.best_offer)),
    sameAuthor.filter(item => !offerAvailable(item.best_offer)),
    sameCategory.filter(item => !offerAvailable(item.best_offer)),
  ];

  const suggestions = [];
  for (const bucket of buckets) {
    for (const item of bucket) {
      if (suggestions.length >= max) break;
      if (seen.has(item.id) || seen.has(item.isbn13)) continue;
      seen.add(item.id);
      seen.add(item.isbn13);
      suggestions.push(item);
    }
    if (suggestions.length >= max) break;
  }
  return suggestions;
}