import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildCatalogRelations, duplicateBookGroups, fetchAll, newestOffer } from '../../shared/catalogAuditUtils.ts';

function chooseCanonical(group, offersByBook) {
  return [...group].sort((a, b) => {
    const aOffers = (offersByBook.get(a.id) || []).length;
    const bOffers = (offersByBook.get(b.id) || []).length;
    if (aOffers !== bOffers) return bOffers - aOffers;
    return String(b.updated_date || b.created_date || '').localeCompare(String(a.updated_date || a.created_date || ''));
  })[0];
}

function uniqueUpdatesById(updates) {
  return [...new Map(updates.map((update) => [update.id, update])).values()];
}

async function applyBulk(entity, updates) {
  for (let i = 0; i < updates.length; i += 500) {
    await entity.bulkUpdate(updates.slice(i, i + 500));
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false;
    const maxGroups = Math.max(1, Math.min(Number(body.max_groups || 50), 200));
    const maxUpdates = Math.max(1, Math.min(Number(body.max_updates || 500), 1000));
    const now = new Date().toISOString();

    const [books, offers] = await Promise.all([
      fetchAll(base44.asServiceRole.entities.Books, {}, { sort: '-updated_date' }),
      fetchAll(base44.asServiceRole.entities.BookOffers, {}, { sort: '-updated_date' }),
    ]);
    const relations = buildCatalogRelations(books, offers);
    const duplicateBooks = duplicateBookGroups(books);
    const duplicateGroups = [...duplicateBooks.product_identifier, ...duplicateBooks.isbn13].slice(0, maxGroups);

    const bookUpdates = [];
    const offerReassignments = [];
    const processedBookIds = new Set();
    const simulatedOffers = offers.map((offer) => ({ ...offer }));

    for (const [, group] of duplicateGroups) {
      const activeGroup = group.filter((book) => !processedBookIds.has(book.id));
      if (activeGroup.length < 2) continue;
      const canonical = chooseCanonical(activeGroup, relations.offersByBook);
      for (const book of activeGroup) {
        processedBookIds.add(book.id);
        if (book.id === canonical.id) continue;
        const bookOffers = simulatedOffers.filter((offer) => offer.book_id === book.id && offer.merged !== true);
        for (const offer of bookOffers) {
          offer.book_id = canonical.id;
          offerReassignments.push({ id: offer.id, book_id: canonical.id });
        }
        bookUpdates.push({ id: book.id, merged: true, merged_into: canonical.id, merged_at: now });
        if (bookUpdates.length + offerReassignments.length >= maxUpdates) break;
      }
      if (bookUpdates.length + offerReassignments.length >= maxUpdates) break;
    }

    const afterReassignRelations = buildCatalogRelations(books.map((book) => {
      const update = bookUpdates.find((item) => item.id === book.id);
      return update ? { ...book, ...update } : book;
    }), simulatedOffers);

    const offerMergeUpdates = [];
    for (const group of afterReassignRelations.duplicateOfferGroups) {
      const keep = newestOffer(group.offers);
      for (const offer of group.offers) {
        if (!keep || offer.id === keep.id) continue;
        offerMergeUpdates.push({ id: offer.id, merged: true, merged_into: keep.id, merged_at: now });
        if (bookUpdates.length + offerReassignments.length + offerMergeUpdates.length >= maxUpdates) break;
      }
      if (bookUpdates.length + offerReassignments.length + offerMergeUpdates.length >= maxUpdates) break;
    }

    const finalBookUpdates = uniqueUpdatesById(bookUpdates).slice(0, maxUpdates);
    const finalOfferReassignments = uniqueUpdatesById(offerReassignments).slice(0, Math.max(0, maxUpdates - finalBookUpdates.length));
    const finalOfferMergeUpdates = uniqueUpdatesById(offerMergeUpdates).slice(0, Math.max(0, maxUpdates - finalBookUpdates.length - finalOfferReassignments.length));

    if (!dryRun) {
      if (finalOfferReassignments.length) await applyBulk(base44.asServiceRole.entities.BookOffers, finalOfferReassignments);
      if (finalBookUpdates.length) await applyBulk(base44.asServiceRole.entities.Books, finalBookUpdates);
      if (finalOfferMergeUpdates.length) await applyBulk(base44.asServiceRole.entities.BookOffers, finalOfferMergeUpdates);
    }

    return Response.json({
      ok: true,
      dry_run: dryRun,
      bounded: true,
      max_groups: maxGroups,
      max_updates: maxUpdates,
      offers_reassigned: finalOfferReassignments.length,
      books_marked_merged: finalBookUpdates.length,
      offers_marked_merged: finalOfferMergeUpdates.length,
      books_remaining_without_offer: afterReassignRelations.booksWithoutOffer.length,
      books_without_offer_sample: afterReassignRelations.booksWithoutOffer.slice(0, 50).map((book) => ({ product_identifier: book.product_identifier || '', title: book.title || '', category: book.category || '', created_date: book.created_date || '' })),
      no_offer_created: true,
      no_deletion: true,
      no_secret_or_datafeed_url_exposed: true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}