import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { fetchOffersByBookIds, lightBook, normalizeIsbn, offerAvailable } from '../../shared/catalogUtils.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Authentification requise' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items : [];
    const catalogItems = items.filter(item => item?.book?.source === 'catalog' || item?.book?.isbn13 || item?.book?.isbn);
    if (!catalogItems.length) return Response.json({ ok: true, changes: [] });

    const isbns = [...new Set(catalogItems.map(item => normalizeIsbn(item.book?.isbn13 || item.book?.isbn || item.book?.ean || '')).filter(Boolean))];
    const page = await base44.asServiceRole.entities.Books.filter({ isbn13: { $in: isbns } }, { limit: Math.min(500, isbns.length) });
    const books = page.items || page || [];
    const offersMap = await fetchOffersByBookIds(base44, books.map(book => book.id));
    const byIsbn = new Map(books.map(book => [book.isbn13, lightBook(book, offersMap.get(book.id) || [])]));
    const changes = [];

    for (const item of catalogItems) {
      const isbn13 = normalizeIsbn(item.book?.isbn13 || item.book?.isbn || item.book?.ean || '');
      const current = byIsbn.get(isbn13);
      if (!current) {
        changes.push({ isbn13, title: item.book?.title || 'Livre', reason: 'not_found' });
        continue;
      }
      if (!offerAvailable(current.best_offer)) {
        changes.push({ isbn13, title: current.title, reason: 'unavailable' });
        continue;
      }
      const expected = Number(item.prixLivre ?? item.book?.priceVal ?? 0);
      const currentPrice = Number(current.price || 0);
      if (Number.isFinite(expected) && expected > 0 && Math.abs(currentPrice - expected) > 0.01) {
        changes.push({ isbn13, title: current.title, reason: 'price_changed', previous_price: expected, current_price: currentPrice, currency: current.currency });
      }
    }

    return Response.json({ ok: changes.length === 0, changes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}