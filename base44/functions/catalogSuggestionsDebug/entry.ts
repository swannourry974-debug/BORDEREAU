import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { fetchOffersByBookIds, lightBook, normalizeIsbn, normalizeText, suggestionPoolsForBook, tokenizeTitle } from '../../shared/catalogUtils.ts';

function compact(item) {
  return item ? { product_identifier: item.product_identifier, isbn13: item.isbn13 || '', title: item.title, author: item.author || '', category: item.category || '', availability: item.availability || 'unknown', price: item.price || 0, origin: item.origin } : null;
}

function rankBooks(books, tokens, norm) {
  return [...books].sort((a, b) => {
    const at = Array.isArray(a.title_tokens) ? a.title_tokens : tokenizeTitle(a.title || '');
    const bt = Array.isArray(b.title_tokens) ? b.title_tokens : tokenizeTitle(b.title || '');
    const aExact = tokens.every(token => at.includes(token)) ? 0 : 1;
    const bExact = tokens.every(token => bt.includes(token)) ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || '').trim();
    if (query.length < 2) return Response.json({ error: 'query requis' }, { status: 400 });
    const isbn = normalizeIsbn(query);
    const norm = normalizeText(query);
    const tokens = tokenizeTitle(query);
    let books = [];
    if (isbn) {
      const page = await base44.asServiceRole.entities.Books.filter({ $or: [{ isbn13: isbn }, { product_identifier: isbn }] }, { limit: 1 });
      books = page.items || page || [];
    } else if (/^(EAN|MERCHANT):/i.test(query)) {
      const page = await base44.asServiceRole.entities.Books.filter({ product_identifier: query }, { limit: 1 });
      books = page.items || page || [];
    } else {
      const pages = await Promise.all(tokens.map(token => base44.asServiceRole.entities.Books.filter({ title_tokens: token }, { sort: 'title_norm', limit: 100 }).catch(() => ({ items: [] }))));
      const counts = new Map();
      const byId = new Map();
      pages.map(page => page.items || page || []).flat().forEach(book => { byId.set(book.id, book); counts.set(book.id, (counts.get(book.id) || 0) + 1); });
      books = rankBooks([...byId.values()].filter(book => counts.get(book.id) === tokens.length), tokens, norm);
    }
    const mainBook = books[0] || null;
    if (!mainBook) return Response.json({ main: null, suggestions: [], order_applied: 'same_author puis same_category; chaque groupe trié in_stock, out_of_stock, unknown puis prix', counts: { same_author: 0, same_category: 0 } });
    const offersMap = await fetchOffersByBookIds(base44, [mainBook.id]);
    const main = lightBook(mainBook, offersMap.get(mainBook.id) || []);
    const pools = await suggestionPoolsForBook(base44, mainBook);
    const seen = new Set([mainBook.id, mainBook.product_identifier, mainBook.isbn13].filter(Boolean));
    const suggestions = [];
    for (const pool of [pools.same_author, pools.same_category]) {
      for (const item of pool) {
        if (suggestions.length >= 5) break;
        if (seen.has(item.id) || seen.has(item.product_identifier) || seen.has(item.isbn13)) continue;
        seen.add(item.id); seen.add(item.product_identifier); seen.add(item.isbn13);
        suggestions.push(compact(item));
      }
    }
    return Response.json({ main: compact(main), suggestions, order_applied: 'same_author puis same_category; chaque groupe trié in_stock, out_of_stock, unknown puis prix', counts: { same_author: pools.same_author.length, same_category: pools.same_category.length } });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}