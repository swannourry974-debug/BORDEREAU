import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildSuggestionsForBook, fetchOffersByBookIds, lightBook, normalizeIsbn, normalizeText } from '../../shared/catalogUtils.ts';

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Authentification requise' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = String(body.query || '').trim();
    const pageSize = Math.max(1, Math.min(Number(body.pageSize || body.limit || 20), 50));
    const cursor = body.cursor || undefined;
    const suggestionCount = Math.max(0, Math.min(Number(body.suggestions ?? 5), 5));
    if (query.length < 2) return Response.json({ items: [], main: null, suggestions: [], next_cursor: null, has_more: false });

    const isbn = normalizeIsbn(query);
    const norm = normalizeText(query);
    const filter = isbn
      ? { isbn13: isbn }
      : {
          $or: [
            { title_norm: { $regex: `^${escapeRegex(norm)}` } },
            { author_norm: { $regex: `^${escapeRegex(norm)}` } },
          ],
        };

    const page = await base44.asServiceRole.entities.Books.filter(filter, { sort: 'title_norm', limit: pageSize, cursor });
    const books = page.items || page || [];
    const offersMap = await fetchOffersByBookIds(base44, books.map(book => book.id));
    const items = books.map(book => lightBook(book, offersMap.get(book.id) || []));
    const mainBook = books[0] || null;
    const main = items[0] || null;
    const suggestions = mainBook ? await buildSuggestionsForBook(base44, mainBook, suggestionCount) : [];

    return Response.json({
      items,
      main,
      suggestions,
      next_cursor: page.next_cursor || null,
      has_more: Boolean(page.has_more),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}