import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

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
      base44.asServiceRole.entities.Books.aggregate({ groupBy: 'product_identifier' }),
      base44.asServiceRole.entities.Books.aggregate({ query: { isbn13: { $ne: '' } }, groupBy: 'isbn13' }),
      base44.asServiceRole.entities.Books.aggregate({ groupBy: 'id' }),
      base44.asServiceRole.entities.BookOffers.aggregate({ groupBy: 'book_id' }),
      base44.asServiceRole.entities.Books.aggregate({ groupBy: 'category' }),
      base44.asServiceRole.entities.ImportRejection.aggregate({ groupBy: 'reason' }),
      base44.asServiceRole.entities.BookOffers.aggregate({ groupBy: 'availability' }),
      base44.asServiceRole.entities.ImportLog.filter({}, { sort: '-started_at', limit: 5 }),
      base44.asServiceRole.entities.Books.count({ author: { $ne: '' } }),
      base44.asServiceRole.entities.Books.count({ $or: [{ author: '' }, { author: { $exists: false } }] }),
      base44.asServiceRole.entities.Books.count({ merged: true }),
      base44.asServiceRole.entities.BookOffers.count({ merged: true }),
      base44.asServiceRole.entities.Books.count({ identifier_type: 'ean', product_type: 'produit_editorial' }),
    ]);

    const bookIds = new Set(rowsFrom(bookIdGroups).map((row) => String(row.id || '').trim()).filter(Boolean));
    const offerBookRows = rowsFrom(offerBookGroups);
    const offerBookIds = new Set(offerBookRows.map((row) => String(row.book_id || '').trim()).filter(Boolean));
    const booksWithoutOffer = rowsFrom(bookIdGroups).filter((row) => !offerBookIds.has(String(row.id || '').trim())).length;
    const offersOrphanCount = offerBookRows.reduce((sum, row) => {
      const bookId = String(row.book_id || '').trim();
      return bookId && !bookIds.has(bookId) ? sum + Number(row.count || 0) : sum;
    }, 0);

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
    return Response.json({ error: error.message }, { status: 500 });
  }
}