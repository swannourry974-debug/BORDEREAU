import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildCatalogRelations, fetchAll } from '../../shared/catalogAuditUtils.ts';
import { createEntityRateLimiter, isRateLimitError } from '../../shared/entityRateLimiter.ts';

const CLASSIFICATIONS = ['livre', 'revue', 'produit_editorial', 'non_eligible'];

function rowsFrom(page) {
  return page?.rows || page?.items || page || [];
}

function normalizeGroupValue(value, fallback = 'unknown') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function countDuplicateGroups(rows, fieldName) {
  return rows.filter((row) => normalizeGroupValue(row[fieldName], '') && Number(row.count || 0) > 1).length;
}

function breakdownFromRows(rows, fieldName, allowed = []) {
  const output = Object.fromEntries(allowed.map((key) => [key, 0]));
  for (const row of rows) {
    const key = normalizeGroupValue(row[fieldName]);
    if (allowed.length && !(key in output)) output.unknown = (output.unknown || 0) + Number(row.count || 0);
    else output[key] = Number(row.count || 0);
  }
  return output;
}

function topCategories(rows, limit = 20) {
  return rows
    .map((row) => ({ category: normalizeGroupValue(row.category, 'Sans catégorie'), count: Number(row.count || 0) }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
    .slice(0, limit);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const limiter = createEntityRateLimiter({ listPerMinute: 105, writePerMinute: 38, maxAttempts: 4 });

    const [
      totalBooks,
      booksIsbn,
      booksEan,
      booksIsbnValidTrue,
      booksIsbnValidFalse,
      productTypeLivre,
      productTypeEditorial,
      totalOffers,
      offersCultura,
      offersOtherRetailers,
      quarantineTotal,
      quarantineUnreviewed,
      productIdentifierGroups,
      isbn13Groups,
      bookIdGroups,
      offerBookGroups,
      categoryGroups,
      rejectionReasonGroups,
      availabilityGroups,
      classificationGroups,
      quarantineClassificationGroups,
      lastImportLogsPage,
      booksWithAuthor,
      booksWithoutAuthor,
      booksMerged,
      offersMerged,
      editorialEanCount,
    ] = await Promise.all([
      base44.asServiceRole.entities.Books.count({}),
      base44.asServiceRole.entities.Books.count({ identifier_type: 'isbn13' }),
      base44.asServiceRole.entities.Books.count({ identifier_type: 'ean' }),
      base44.asServiceRole.entities.Books.count({ isbn_valid: true }),
      base44.asServiceRole.entities.Books.count({ isbn_valid: false }),
      base44.asServiceRole.entities.Books.count({ product_type: 'livre' }),
      base44.asServiceRole.entities.Books.count({ product_type: 'produit_editorial' }),
      base44.asServiceRole.entities.BookOffers.count({}),
      base44.asServiceRole.entities.BookOffers.count({ retailer_name: 'Cultura' }),
      base44.asServiceRole.entities.BookOffers.count({ retailer_name: { $ne: 'Cultura' } }),
      base44.asServiceRole.entities.ImportRejection.count({}),
      base44.asServiceRole.entities.ImportRejection.count({ reviewed: false }),
      base44.asServiceRole.entities.Books.aggregate({ query: { merged: { $ne: true } }, groupBy: 'product_identifier' }),
      base44.asServiceRole.entities.Books.aggregate({ query: { merged: { $ne: true }, isbn13: { $ne: '' } }, groupBy: 'isbn13' }),
      base44.asServiceRole.entities.Books.aggregate({ query: { merged: { $ne: true } }, groupBy: 'id' }),
      base44.asServiceRole.entities.BookOffers.aggregate({ query: { merged: { $ne: true } }, groupBy: 'book_id' }),
      base44.asServiceRole.entities.Books.aggregate({ groupBy: 'category' }),
      base44.asServiceRole.entities.ImportRejection.aggregate({ groupBy: 'reason' }),
      base44.asServiceRole.entities.BookOffers.aggregate({ groupBy: 'availability' }),
      base44.asServiceRole.entities.Books.aggregate({ groupBy: 'classification' }),
      base44.asServiceRole.entities.ImportRejection.aggregate({ query: { reviewed: false }, groupBy: 'classification' }),
      base44.asServiceRole.entities.ImportLog.filter({}, { sort: '-started_at', limit: 5 }),
      base44.asServiceRole.entities.Books.count({ author: { $ne: '' } }),
      base44.asServiceRole.entities.Books.count({ $or: [{ author: '' }, { author: { $exists: false } }] }),
      base44.asServiceRole.entities.Books.count({ merged: true }),
      base44.asServiceRole.entities.BookOffers.count({ merged: true }),
      base44.asServiceRole.entities.Books.count({ identifier_type: 'ean', product_type: 'produit_editorial' }),
    ]);

    const [books, offers] = await Promise.all([
      fetchAll(base44.asServiceRole.entities.Books, {}, { sort: '-created_date', limiter, label: 'Books.filter' }),
      fetchAll(base44.asServiceRole.entities.BookOffers, {}, { sort: '-updated_date', limiter, label: 'BookOffers.filter' }),
    ]);
    const relations = buildCatalogRelations(books, offers);
    const booksWithoutOffer = relations.booksWithoutOffer.length;
    const offersOrphanCount = relations.orphanOffers.length;
    const classificationChangedCount = books.filter((book) => String(book.classification || '') && String(book.classification || '') !== String(book.classification_previous || book.product_type || '')).length;

    const lastImportLogs = rowsFrom(lastImportLogsPage).map((log) => ({
      started_at: log.started_at || log.created_date || '',
      finished_at: log.finished_at || '',
      feed_id: log.feed_id || log.current_feed_id || '',
      feed_name: log.feed_name || '',
      status: log.status || '',
      import_mode: log.import_mode || '',
    }));

    return Response.json({
      read_only: true,
      total_books: totalBooks,
      books_isbn: booksIsbn,
      books_ean: booksEan,
      books_isbn_valid_true: booksIsbnValidTrue,
      books_isbn_valid_false: booksIsbnValidFalse,
      product_type_livre: productTypeLivre,
      product_type_produit_editorial: productTypeEditorial,
      total_by_classification: breakdownFromRows(rowsFrom(classificationGroups), 'classification', CLASSIFICATIONS),
      classification_changed_count: classificationChangedCount,
      total_offers: totalOffers,
      offers_cultura: offersCultura,
      offers_other_retailers: offersOtherRetailers,
      duplicate_product_identifiers: countDuplicateGroups(rowsFrom(productIdentifierGroups), 'product_identifier'),
      duplicate_isbn13: countDuplicateGroups(rowsFrom(isbn13Groups), 'isbn13'),
      books_without_offer: booksWithoutOffer,
      books_without_offer_count: booksWithoutOffer,
      books_by_category: topCategories(rowsFrom(categoryGroups), 20),
      quarantine_total: quarantineTotal,
      quarantine_unreviewed: quarantineUnreviewed,
      quarantine_par_classification: breakdownFromRows(rowsFrom(quarantineClassificationGroups), 'classification', CLASSIFICATIONS),
      quarantine_by_reason: breakdownFromRows(rowsFrom(rejectionReasonGroups), 'reason'),
      availability_breakdown: breakdownFromRows(rowsFrom(availabilityGroups), 'availability', ['in_stock', 'out_of_stock', 'unknown']),
      books_with_author: booksWithAuthor,
      books_without_author: booksWithoutAuthor,
      last_import_log: lastImportLogs,
      books_merged: booksMerged,
      offers_merged: offersMerged,
      distinct_product_identifiers: rowsFrom(productIdentifierGroups).filter((row) => normalizeGroupValue(row.product_identifier, '')).length,
      isbn_count: rowsFrom(isbn13Groups).filter((row) => normalizeGroupValue(row.isbn13, '')).length,
      editorial_ean_count: editorialEanCount,
      offers_orphan_count: offersOrphanCount,
    });
  } catch (error) {
    const status = isRateLimitError(error) ? 429 : 500;
    return Response.json({ error: error.message, rate_limited: isRateLimitError(error), retryable: isRateLimitError(error) }, { status });
  }
}