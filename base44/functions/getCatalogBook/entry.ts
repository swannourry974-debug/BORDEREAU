import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildSuggestionsForBook, fetchOffersByBookIds, lightBook, normalizeIsbn } from '../../shared/catalogUtils.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Authentification requise' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '').trim();
    const isbn13 = normalizeIsbn(body.isbn13 || body.ean || '');
    if (!id && !isbn13) return Response.json({ error: 'id ou isbn13 requis' }, { status: 400 });

    let book = null;
    if (id) {
      book = await base44.asServiceRole.entities.Books.get(id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    } else {
      const page = await base44.asServiceRole.entities.Books.filter({ isbn13 }, { limit: 1 });
      book = (page.items || page || [])[0] || null;
    }
    if (!book) return Response.json({ error: 'Livre introuvable' }, { status: 404 });

    const offersMap = await fetchOffersByBookIds(base44, [book.id]);
    const suggestions = await buildSuggestionsForBook(base44, book, Math.min(Number(body.suggestions ?? 5), 5));
    return Response.json({ book: lightBook(book, offersMap.get(book.id) || []), suggestions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}