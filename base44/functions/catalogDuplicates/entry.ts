import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

function rowsFrom(page) {
  return page?.items || page || [];
}

async function scanAll(entity, label) {
  const limit = 500;
  let cursor = undefined;
  let pageIndex = 0;
  const output = [];

  while (true) {
    const page = await entity.filter({}, { limit, cursor, sort: 'created_date' });
    const items = rowsFrom(page);
    output.push(...items);
    pageIndex += 1;

    if (!page?.has_more) {
      return {
        label,
        total_scanned: output.length,
        pages_scanned: pageIndex,
        records: output,
        stopped_on_has_more_false: true,
      };
    }

    if (!page.next_cursor) {
      throw new Error(`${label}: pagination incomplète, has_more=true sans next_cursor après ${pageIndex} pages`);
    }

    cursor = page.next_cursor;
  }
}

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
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

    const [booksScan, offersScan, realBooksTotal, realOffersTotal] = await Promise.all([
      scanAll(base44.asServiceRole.entities.Books, 'Books'),
      scanAll(base44.asServiceRole.entities.BookOffers, 'BookOffers'),
      base44.asServiceRole.entities.Books.count(),
      base44.asServiceRole.entities.BookOffers.count(),
    ]);

    const offersByBookId = new Map();
    for (const offer of offersScan.records) {
      const bookId = String(offer.book_id || '').trim();
      if (!bookId) continue;
      if (!offersByBookId.has(bookId)) offersByBookId.set(bookId, []);
      offersByBookId.get(bookId).push(offer);
    }

    const groupsByProductIdentifier = duplicateGroups(booksScan.records, offersByBookId, 'product_identifier');
    const groupsByIsbn13 = duplicateGroups(booksScan.records, offersByBookId, 'isbn13');
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
        books_pages_scanned: booksScan.pages_scanned,
        offers_pages_scanned: offersScan.pages_scanned,
        stopped_on_has_more_false: booksScan.stopped_on_has_more_false && offersScan.stopped_on_has_more_false,
      },
      verification: {
        total_books_scanned: booksScan.total_scanned,
        total_offers_scanned: offersScan.total_scanned,
        real_books_total: realBooksTotal,
        real_offers_total: realOffersTotal,
        total_books_scanned_equals_real_books_total: booksScan.total_scanned === realBooksTotal,
        total_offers_scanned_equals_real_offers_total: offersScan.total_scanned === realOffersTotal,
      },
      totals: {
        groups_by_product_identifier: groupsByProductIdentifier.length,
        groups_by_isbn13: groupsByIsbn13.length,
        groups_by_diagnostic: diagnosticTotals(allGroups),
        records_concerned: uniqueConcernedRecords(allGroups),
        offers_concerned: concernedOffers(allGroups),
        identifiers_concerned: uniqueIdentifiers.size,
        total_books_scanned_equals_real_books_total: booksScan.total_scanned === realBooksTotal,
      },
      groups_by_product_identifier: groupsByProductIdentifier,
      groups_by_isbn13: groupsByIsbn13,
    });
  } catch (error) {
    return Response.json({ error: error.message, read_only: true, no_write: true }, { status: 500 });
  }
}