import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { createEntityRateLimiter, isRateLimitError } from '../../shared/entityRateLimiter.ts';
import { normalizeText } from '../../shared/catalogAuditPagination.ts';

function rowsFrom(page) {
  return page?.rows || page?.items || page || [];
}

function uniqueValues(values = []) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
}

function chunks(values = [], size = 500) {
  const output = [];
  for (let i = 0; i < values.length; i += size) output.push(values.slice(i, i + size));
  return output;
}

function groupValue(row = {}, fieldName = '') {
  return String(row[fieldName] || row._id || row.key || '').trim();
}

function rowCount(row = {}) {
  return Number(row.count || row.total || 0);
}

async function limitedFilter(entity, query, options, label, limiter) {
  const run = () => entity.filter(query, options);
  return limiter ? await limiter.list(run, `${label}.filter`) : await run();
}

async function filterInChunks(entity, field, values, extraQuery, label, limiter) {
  const records = [];
  for (const chunk of chunks(uniqueValues(values), 500)) {
    const page = await limitedFilter(entity, { ...extraQuery, [field]: { $in: chunk } }, { limit: chunk.length, sort: 'created_date' }, label, limiter);
    records.push(...rowsFrom(page));
  }
  return records;
}

async function aggregateDuplicateKeys(entity, fieldName, query, label, limiter) {
  const run = () => entity.aggregate({ query, groupBy: fieldName });
  const result = limiter ? await limiter.list(run, `${label}.aggregate`) : await run();
  return rowsFrom(result)
    .map(row => ({ identifier: groupValue(row, fieldName), count: rowCount(row) }))
    .filter(row => row.identifier && row.count > 1)
    .sort((a, b) => b.count - a.count || a.identifier.localeCompare(b.identifier));
}

function firstMeaningful(values) {
  return values.map(value => String(value || '').trim()).filter(Boolean)[0] || '';
}

function classifyGroup(records) {
  const titles = new Set(records.map(record => normalizeText(record.title || record.title_norm || '')).filter(Boolean));
  const publishers = new Set(records.map(record => normalizeText(record.publisher || '')).filter(Boolean));
  const productTypes = new Set(records.map(record => String(record.product_type || '').trim()).filter(Boolean));
  const classifications = new Set(records.map(record => String(record.classification || '').trim()).filter(Boolean));
  const prices = new Set(records.map(record => Number(record.price || 0)).filter(Boolean));
  const merchantRefs = new Set(records.flatMap(record => (record.offers || []).map(offer => String(offer.retailer_product_id || '').trim()).filter(Boolean)));

  const sameTitle = titles.size <= 1;
  const noEditorialDistinction = publishers.size <= 1 && productTypes.size <= 1 && classifications.size <= 1 && prices.size <= 1;
  const sameMerchantReference = merchantRefs.size <= 1;

  if (sameTitle && (sameMerchantReference || noEditorialDistinction)) return 'doublon_reel';
  if (!sameTitle || publishers.size > 1 || productTypes.size > 1 || classifications.size > 1 || prices.size > 1 || merchantRefs.size > 1) return 'editions_distinctes';
  return 'indetermine';
}

function attachOfferSummary(book, offers) {
  const bookOffers = offers.get(book.id) || [];
  const firstOffer = bookOffers[0] || {};
  return {
    id: book.id,
    product_identifier: book.product_identifier || '',
    isbn13: book.isbn13 || '',
    title: book.title || '',
    author: book.author || '',
    publisher: book.publisher || '',
    category: book.category || '',
    identifier_type: book.identifier_type || '',
    isbn_valid: book.isbn_valid === true,
    product_type: book.product_type || '',
    classification: book.classification || '',
    price: firstOffer.price || 0,
    availability: firstOffer.availability || '',
    created_date: book.created_date || '',
    updated_date: book.updated_date || '',
    source_feed_id: book.source_feed_id || '',
    offers_count: bookOffers.length,
    offers: bookOffers.map(offer => ({
      retailer_name: offer.retailer_name || '',
      retailer_product_id: offer.retailer_product_id || '',
      merchant_url: offer.merchant_url || '',
      last_updated: offer.last_updated || offer.updated_date || '',
    })),
  };
}

function duplicateGroups(books, offersByBookId, keyField) {
  const groups = new Map();
  for (const book of books) {
    const key = String(book[keyField] || '').trim();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(book);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([identifier, group]) => {
      const records = group.map(book => attachOfferSummary(book, offersByBookId));
      const diagnostic = classifyGroup(records);
      return {
        identifier,
        diagnostic,
        records_count: records.length,
        offers_count: records.reduce((total, record) => total + record.offers_count, 0),
        canonical_candidate: firstMeaningful(records.map(record => record.id)),
        records,
      };
    });
}

function diagnosticTotals(groups) {
  return groups.reduce((totals, group) => {
    totals[group.diagnostic] = (totals[group.diagnostic] || 0) + 1;
    return totals;
  }, { doublon_reel: 0, editions_distinctes: 0, indetermine: 0 });
}

function uniqueConcernedRecords(groups) {
  const ids = new Set();
  groups.forEach(group => group.records.forEach(record => ids.add(record.id)));
  return ids.size;
}

function concernedOffers(groups) {
  return groups.reduce((total, group) => total + group.offers_count, 0);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const maxGroups = Math.max(1, Math.min(Number(body.max_groups || 80), 250));
    const limiter = createEntityRateLimiter({ listPerMinute: 105, writePerMinute: 1, maxAttempts: 4 });
    const activeQuery = { merged: { $ne: true } };

    const [realBooksTotal, realOffersTotal, activeBooksTotal, activeOffersTotal, productKeys, isbnKeys] = await Promise.all([
      base44.asServiceRole.entities.Books.count(),
      base44.asServiceRole.entities.BookOffers.count(),
      base44.asServiceRole.entities.Books.count(activeQuery),
      base44.asServiceRole.entities.BookOffers.count(activeQuery),
      aggregateDuplicateKeys(base44.asServiceRole.entities.Books, 'product_identifier', activeQuery, 'Books.product_identifier', limiter),
      aggregateDuplicateKeys(base44.asServiceRole.entities.Books, 'isbn13', { ...activeQuery, isbn13: { $ne: '' } }, 'Books.isbn13', limiter),
    ]);

    const sampleProductKeys = productKeys.slice(0, maxGroups).map(row => row.identifier);
    const sampleIsbnKeys = isbnKeys.slice(0, maxGroups).map(row => row.identifier);
    const [booksByProductIdentifier, booksByIsbn13] = await Promise.all([
      filterInChunks(base44.asServiceRole.entities.Books, 'product_identifier', sampleProductKeys, activeQuery, 'Books.product_identifier.sample', limiter),
      filterInChunks(base44.asServiceRole.entities.Books, 'isbn13', sampleIsbnKeys, activeQuery, 'Books.isbn13.sample', limiter),
    ]);
    const sampledBooks = [...new Map([...booksByProductIdentifier, ...booksByIsbn13].map(book => [book.id, book])).values()];
    const sampledBookIds = sampledBooks.map(book => book.id);
    const sampledOffers = await filterInChunks(base44.asServiceRole.entities.BookOffers, 'book_id', sampledBookIds, activeQuery, 'BookOffers.sample', limiter);

    const offersByBookId = new Map();
    for (const offer of sampledOffers) {
      const bookId = String(offer.book_id || '').trim();
      if (!bookId) continue;
      if (!offersByBookId.has(bookId)) offersByBookId.set(bookId, []);
      offersByBookId.get(bookId).push(offer);
    }

    const groupsByProductIdentifier = duplicateGroups(booksByProductIdentifier, offersByBookId, 'product_identifier');
    const groupsByIsbn13 = duplicateGroups(booksByIsbn13, offersByBookId, 'isbn13');
    const allGroups = [...groupsByProductIdentifier, ...groupsByIsbn13];
    const uniqueIdentifiers = new Set(allGroups.map(group => group.identifier));

    return Response.json({
      read_only: true,
      no_write: true,
      no_merge: true,
      no_delete: true,
      no_import: true,
      no_secret_exposed: true,
      pagination: {
        scan_mode: 'aggregate_counts_plus_targeted_examples',
        max_groups_per_identifier_type: maxGroups,
        sampled_books: sampledBooks.length,
        sampled_offers: sampledOffers.length,
        limiter: limiter.metrics(),
      },
      verification: {
        real_books_total: realBooksTotal,
        real_offers_total: realOffersTotal,
        duplicate_scope: 'active_records_excluding_merged_true',
        active_books_scanned_by_count: activeBooksTotal,
        active_offers_scanned_by_count: activeOffersTotal,
        groups_returned_are_examples: true,
      },
      totals: {
        groups_by_product_identifier: productKeys.length,
        groups_by_isbn13: isbnKeys.length,
        sampled_groups_by_product_identifier: groupsByProductIdentifier.length,
        sampled_groups_by_isbn13: groupsByIsbn13.length,
        groups_by_diagnostic_sample: diagnosticTotals(allGroups),
        records_concerned_in_sample: uniqueConcernedRecords(allGroups),
        offers_concerned_in_sample: concernedOffers(allGroups),
        identifiers_concerned_in_sample: uniqueIdentifiers.size,
      },
      groups_by_product_identifier: groupsByProductIdentifier,
      groups_by_isbn13: groupsByIsbn13,
    });
  } catch (error) {
    const status = isRateLimitError(error) ? 429 : 500;
    return Response.json({ error: error.message, rate_limited: isRateLimitError(error), retryable: isRateLimitError(error), read_only: true, no_write: true }, { status });
  }
}