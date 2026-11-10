import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildSuggestionsForBook, fetchOffersByBookIds, lightBook, normalizeIsbn, normalizeText } from '../../shared/catalogUtils.ts';

async function enrichAuthorFromOpenLibrary(isbn13) {
  const work = await fetch(`https://openlibrary.org/isbn/${isbn13}.json`, { signal: AbortSignal.timeout(8000) }).then(res => res.ok ? res.json() : null).catch(() => null);
  const authorKeys = Array.isArray(work?.authors) ? work.authors.map(author => author.key).filter(Boolean).slice(0, 4) : [];
  if (!authorKeys.length) return '';
  const names = await Promise.all(authorKeys.map(key => fetch(`https://openlibrary.org${key}.json`, { signal: AbortSignal.timeout(8000) }).then(res => res.ok ? res.json() : null).then(data => data?.name || '').catch(() => '')));
  return names.filter(Boolean).join(', ');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Authentification requise' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '').trim();
    const productIdentifier = String(body.product_identifier || '').trim();
    const isbn13 = normalizeIsbn(body.isbn13 || body.ean || '');
    if (!id && !isbn13 && !productIdentifier) return Response.json({ error: 'id, product_identifier ou isbn13 requis' }, { status: 400 });
    let book = null;
    if (id) book = await base44.asServiceRole.entities.Books.get(id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    else {
      const page = await base44.asServiceRole.entities.Books.filter(productIdentifier ? { product_identifier: productIdentifier } : { isbn13 }, { limit: 1 });
      book = (page.items || page || [])[0] || null;
    }
    if (!book) return Response.json({ error: 'Livre introuvable' }, { status: 404 });
    if (!String(book.author || '').trim() && book.isbn13 && !book.author_enriched_at) {
      const author = await enrichAuthorFromOpenLibrary(book.isbn13);
      const patch = author ? { author, author_norm: normalizeText(author), author_source: 'openlibrary', author_enriched_at: new Date().toISOString() } : { author: '', author_norm: '', author_source: 'none', author_enriched_at: new Date().toISOString() };
      book = await base44.asServiceRole.entities.Books.update(book.id, patch);
    }
    const offersMap = await fetchOffersByBookIds(base44, [book.id]);
    const suggestions = await buildSuggestionsForBook(base44, book, Math.min(Number(body.suggestions ?? 5), 5));
    return Response.json({ book: lightBook(book, offersMap.get(book.id) || []), suggestions });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}