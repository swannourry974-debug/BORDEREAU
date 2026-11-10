import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildSuggestionsForBook, fetchOffersByBookIds, lightBook, normalizeIsbn, normalizeText, tokenizeTitle } from '../../shared/catalogUtils.ts';

function escapeRegex(value = '') { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function rankBooks(books, tokens, norm) {
  return [...books].sort((a, b) => {
    const at = Array.isArray(a.title_tokens) ? a.title_tokens : tokenizeTitle(a.title || '');
    const bt = Array.isArray(b.title_tokens) ? b.title_tokens : tokenizeTitle(b.title || '');
    const aExact = tokens.every(token => at.includes(token)) ? 0 : 1;
    const bExact = tokens.every(token => bt.includes(token)) ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    const ap = String(a.title_norm || '').indexOf(norm);
    const bp = String(b.title_norm || '').indexOf(norm);
    return (ap < 0 ? 9999 : ap) - (bp < 0 ? 9999 : bp) || String(a.title || '').localeCompare(String(b.title || ''));
  });
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Authentification requise' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || '').trim();
    const pageSize = Math.max(1, Math.min(Number(body.pageSize || body.limit || 20), 50));
    const suggestionCount = Math.max(0, Math.min(Number(body.suggestions ?? 5), 5));
    if (query.length < 2) return Response.json({ items: [], main: null, suggestions: [], next_cursor: null, has_more: false });
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
    } else if (tokens.length) {
      try {
        const pages = await Promise.all(tokens.map(token => base44.asServiceRole.entities.Books.filter({ title_tokens: token }, { sort: 'title_norm', limit: 200 })));
        const counts = new Map();
        const byId = new Map();
        pages.map(page => page.items || page || []).flat().forEach(book => { byId.set(book.id, book); counts.set(book.id, (counts.get(book.id) || 0) + 1); });
        books = [...byId.values()].filter(book => counts.get(book.id) === tokens.length);
      } catch {
        const first = tokens[0];
        const page = await base44.asServiceRole.entities.Books.filter({ title_norm: { $regex: `^${escapeRegex(first)}` } }, { sort: 'title_norm', limit: 200 });
        books = (page.items || page || []).filter(book => { const bookTokens = Array.isArray(book.title_tokens) ? book.title_tokens : tokenizeTitle(book.title || ''); return tokens.every(token => bookTokens.includes(token) || normalizeText(book.title || '').includes(token)); });
      }
      books = rankBooks(books, tokens, norm).slice(0, pageSize);
    }
    const offersMap = await fetchOffersByBookIds(base44, books.map(book => book.id));
    const items = books.map(book => lightBook(book, offersMap.get(book.id) || []));
    const mainBook = books[0] || null;
    const suggestions = mainBook ? await buildSuggestionsForBook(base44, mainBook, suggestionCount) : [];
    return Response.json({ items, main: items[0] || null, suggestions, next_cursor: null, has_more: false });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}