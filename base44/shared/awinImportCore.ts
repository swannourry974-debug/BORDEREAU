import { cleanAuthorList, cleanEan, cleanPublisher, inferAuthor, inferProductType, isEditorialProduct, isStationeryProduct, isValidIsbn13, normalizeAvailability, normalizeAwinHeader, normalizeIsbn, normalizeText, parseCsvLine, parsePrice, safeUrl, tokenizeTitle } from './catalogUtils.ts';
import { classifyCatalogRecord } from './catalogClassification.ts';

export const AWIN_RETAILER = 'Cultura';
export const AWIN_BATCH_SIZE = 300;
export const AWIN_MAX_TEST_LIMIT = 1000;
export const AWIN_PRIORITY_FEED_IDS = ['101388', '101386', '101439', '101522', '101385'];
export const AWIN_ROMAN_FEED_ID = '101386';
export const AWIN_OPTIONAL_ENFANT_FEED_ID = '101437';
export const AWIN_FEED_RAYONS = { '101386': 'Roman', '101388': 'Vie pratique, histoire et sciences humaines', '101439': 'Loisirs, art, scolaire et universitaire', '101522': 'BD, manga et comics', '101385': 'Littérature' };

export function countProducts(value = '') { return Number(String(value || '').replace(/[^0-9]/g, '')) || 0; }
function cleanDigits(value = '') { return String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase(); }
function cleanAwProductId(row = {}) { return String(row.aw_product_id || row.product_id || row.merchant_product_id || '').trim(); }
function feedIdOf(feed = {}) { return String(feed.feed_id || feed.data_feed_id || feed.fid || feed.feedId || '').trim(); }

function classifyIdentifier(row = {}, feed = {}) {
  const rawEan = cleanDigits(row.ean || '');
  const awProductId = cleanAwProductId(row);
  const isbn13 = normalizeIsbn(rawEan);
  if (isbn13 && isValidIsbn13(isbn13)) return { product_identifier: isbn13, identifier_type: 'isbn13', isbn_valid: true, isbn13, ean: rawEan || isbn13 };
  const ean = cleanEan(rawEan);
  if (ean) return { product_identifier: `EAN:${ean}`, identifier_type: 'ean', isbn_valid: false, isbn13: '', ean };
  if (awProductId) return { product_identifier: `MERCHANT:${AWIN_RETAILER}:${feedIdOf(feed)}:${awProductId}`, identifier_type: 'merchant_id', isbn_valid: false, isbn13: '', ean: rawEan };
  return null;
}

function betterImage(existing = '', incoming = '') {
  const next = safeUrl(incoming || '');
  if (!next) return existing || '';
  const current = safeUrl(existing || '');
  if (!current) return next;
  const score = (url) => { const text = normalizeText(url); let value = url.length; if (text.includes('large') || text.includes('zoom') || text.includes('1200')) value += 80; if (text.includes('800') || text.includes('1000')) value += 50; if (text.includes('thumb') || text.includes('small')) value -= 60; return value; };
  return score(next) > score(current) ? next : current;
}

function mergeCategory(existing = '', incoming = '', existingSource = '', incomingSource = '') {
  const next = String(incoming || '').trim();
  if (!next) return { category: existing || '', source: existingSource || undefined };
  const current = String(existing || '').trim();
  if (!current) return { category: next, source: incomingSource || existingSource || undefined };
  if (incomingSource === 'feed_field' && existingSource !== 'feed_field') return { category: next, source: incomingSource };
  return { category: current, source: existingSource || incomingSource || undefined };
}

export function mergeBook(existing = {}, incoming = {}) {
  const description = String(incoming.description || '').length > String(existing.description || '').length ? incoming.description : existing.description;
  const categoryMerge = mergeCategory(existing.category, incoming.category, existing.category_source, incoming.category_source);
  const existingAuthor = cleanAuthorList(existing.author || '');
  const incomingAuthor = cleanAuthorList(incoming.author || '');
  const incomingHasAuthor = Boolean(incomingAuthor) && normalizeText(incomingAuthor) !== 'pas de marque';
  const existingHasAuthor = Boolean(existingAuthor) && normalizeText(existingAuthor) !== 'pas de marque';
  const existingPublisher = cleanPublisher(existing.publisher || '');
  const incomingPublisher = cleanPublisher(incoming.publisher || '');
  const incomingClassification = incoming.classification || existing.classification || existing.product_type || incoming.product_type || 'livre';
  return {
    product_identifier: existing.product_identifier || incoming.product_identifier,
    identifier_type: existing.identifier_type || incoming.identifier_type,
    isbn_valid: existing.isbn_valid === true || incoming.isbn_valid === true,
    product_type: existing.product_type || incoming.product_type || 'livre',
    classification: incomingClassification,
    classification_previous: existing.classification_previous || existing.product_type || incoming.product_type || '',
    classification_updated_at: incoming.classification ? (existing.classification === incoming.classification ? existing.classification_updated_at : incoming.classification_updated_at) : existing.classification_updated_at,
    classification_source: incoming.classification_source || existing.classification_source || undefined,
    source_feed_id: incoming.source_feed_id || existing.source_feed_id,
    source_feed_name: incoming.source_feed_name || existing.source_feed_name,
    isbn13: existing.isbn13 || incoming.isbn13 || '',
    ean: existing.ean || incoming.ean || '',
    title: existing.title || incoming.title,
    title_norm: existing.title_norm || incoming.title_norm,
    title_tokens: Array.isArray(existing.title_tokens) && existing.title_tokens.length ? existing.title_tokens : (incoming.title_tokens || tokenizeTitle(existing.title || incoming.title || '')),
    author: existingHasAuthor ? existingAuthor : (incomingAuthor || ''),
    author_norm: normalizeText(existingHasAuthor ? existingAuthor : (incomingAuthor || '')),
    author_source: existingHasAuthor ? (existing.author_source || 'feed') : (incomingHasAuthor ? (incoming.author_source || 'feed') : 'none'),
    author_enriched_at: existing.author_enriched_at || incoming.author_enriched_at || undefined,
    description: description || '',
    image_url: betterImage(existing.image_url, incoming.image_url),
    category: categoryMerge.category,
    category_source: categoryMerge.source,
    category_norm: normalizeText(categoryMerge.category),
    language: existing.language || incoming.language || 'fr',
    publisher: existingPublisher || incomingPublisher,
    last_seen_in_feed: incoming.last_seen_in_feed || existing.last_seen_in_feed || undefined,
    missing_since: incoming.last_seen_in_feed ? '' : (existing.missing_since || undefined),
  };
}

export async function* csvRowsFromAwinStream(stream, isGzip) {
  const textStream = isGzip ? stream.pipeThrough(new DecompressionStream('gzip')).pipeThrough(new TextDecoderStream()) : stream.pipeThrough(new TextDecoderStream());
  const reader = textStream.getReader();
  let buffer = '';
  let headers = null;
  let lineNumber = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      lineNumber += 1;
      const cells = parseCsvLine(line);
      if (!headers) { headers = cells.map(normalizeAwinHeader); continue; }
      const row = {};
      headers.forEach((header, index) => { row[header] = cells[index] || ''; });
      yield { row, lineNumber };
    }
  }
  if (buffer.trim() && headers) { lineNumber += 1; const cells = parseCsvLine(buffer); const row = {}; headers.forEach((header, index) => { row[header] = cells[index] || ''; }); yield { row, lineNumber }; }
}

function categoryFromRow(row = {}, feedId = '') {
  const fromField = String(row.category_name || '').trim();
  if (fromField) return { category: fromField, source: 'feed_field' };
  const rayon = AWIN_FEED_RAYONS[String(feedId || '').trim()] || '';
  if (rayon) return { category: rayon, source: 'feed_rayon' };
  return { category: '', source: undefined };
}

function rejectionFrom(row = {}, reason = '', feedId = '', importedAt = '', identifier = {}) {
  return { ean_raw: String(row.ean || '').trim(), title: String(row.product_name || '').trim(), category: String(row.category_name || row.merchant_product_category_path || '').trim(), reason, feed_id: String(feedId || '').trim(), product_identifier: identifier.product_identifier || '', identifier_type: identifier.identifier_type || undefined, isbn_valid: identifier.isbn_valid, product_type: identifier.product_type, import_date: importedAt, reviewed: false };
}

export function productToCatalogRecord(row, importedAt, feed = {}, options = {}) {
  const feedId = feedIdOf(feed);
  const feedName = String(feed.feed_name || '').trim();
  const title = String(row.product_name || '').trim();
  if (!title) return { error: 'missing_title', rejection: rejectionFrom(row, 'missing_title', feedId, importedAt) };

  const category = categoryFromRow(row, feedId);
  const explicitCategory = String(row.category_name || row.merchant_product_category_path || category.category || '').trim();
  const identifier = classifyIdentifier(row, feed);
  if (!identifier) return { error: 'ean_not_isbn', rejection: rejectionFrom(row, 'ean_not_isbn', feedId, importedAt) };
  if (isStationeryProduct(title)) return { error: 'non_book', rejection: rejectionFrom(row, 'non_book', feedId, importedAt, identifier) };
  const editorial = isEditorialProduct(explicitCategory, title);
  if (!identifier.isbn_valid && (!options.allowNonIsbnEditorial || !editorial)) return { error: 'ean_not_isbn', rejection: rejectionFrom(row, 'ean_not_isbn', feedId, importedAt, identifier) };
  if (explicitCategory && !editorial && !AWIN_FEED_RAYONS[feedId]) return { error: 'non_book', rejection: rejectionFrom(row, 'non_book', feedId, importedAt, identifier) };

  const price = parsePrice(row.search_price);
  if (!price) return { error: 'invalid_price', rejection: rejectionFrom(row, 'invalid_price', feedId, importedAt, identifier) };

  const awProductId = cleanAwProductId(row);
  const author = inferAuthor(row);
  const availabilityRaw = String(row.stock_status || row.in_stock || row.availability || '').trim();
  const productType = inferProductType(category.category || explicitCategory, title, identifier.isbn_valid);
  const publisher = cleanPublisher(row.brand_name || '');
  const classification = classifyCatalogRecord({ title, category: category.category || explicitCategory, product_type: productType, isbn_valid: identifier.isbn_valid, author, publisher });
  return {
    product_identifier: identifier.product_identifier,
    isbn13: identifier.isbn13,
    identifier_type: identifier.identifier_type,
    isbn_valid: identifier.isbn_valid,
    book: {
      product_identifier: identifier.product_identifier,
      identifier_type: identifier.identifier_type,
      isbn_valid: identifier.isbn_valid,
      product_type: productType,
      classification,
      classification_previous: productType,
      classification_updated_at: importedAt,
      classification_source: 'awin_rules_v1',
      source_feed_id: feedId,
      source_feed_name: feedName,
      isbn13: identifier.isbn13,
      ean: identifier.ean,
      title,
      title_norm: normalizeText(title),
      title_tokens: tokenizeTitle(title),
      author,
      author_norm: normalizeText(author),
      author_source: author ? 'feed' : 'none',
      description: String(row.description || '').trim(),
      image_url: safeUrl(row.merchant_image_url || row.aw_image_url || ''),
      category: category.category,
      category_source: category.source,
      category_norm: normalizeText(category.category),
      language: 'fr',
      publisher: cleanPublisher(row.brand_name || ''),
      last_seen_in_feed: importedAt,
      missing_since: '',
    },
    offer: {
      retailer_name: AWIN_RETAILER,
      retailer_product_id: awProductId || identifier.product_identifier,
      price,
      original_price: parsePrice(row.original_price || row.rrp_price || row.search_price) || price,
      currency: 'EUR',
      availability: normalizeAvailability(availabilityRaw),
      availability_raw: availabilityRaw,
      stock_quantity: Number(row.stock_quantity || 0) || 0,
      merchant_url: safeUrl(row.merchant_deep_link || ''),
      affiliate_url: safeUrl(row.aw_deep_link || ''),
      last_updated: importedAt,
      last_seen_in_feed: importedAt,
      missing_since: '',
    },
  };
}

export function selectCulturaBookFeeds(rows, includeUniversEnfant = false) {
  const byId = new Map();
  for (const row of rows) {
    const advertiser = normalizeText(row.advertiser_name);
    if (!advertiser.includes('cultura')) continue;
    const feedId = String(row.feed_id || row.data_feed_id || row.fid || '').trim();
    const feedNameNorm = normalizeText(row.feed_name);
    const isPriority = AWIN_PRIORITY_FEED_IDS.includes(feedId);
    const isDynamicBook = feedNameNorm.includes('livre');
    const isOptionalEnfant = includeUniversEnfant && (feedId === AWIN_OPTIONAL_ENFANT_FEED_ID || feedNameNorm.includes('univers enfant'));
    if (!isPriority && !isDynamicBook && !isOptionalEnfant) continue;
    byId.set(feedId || row.feed_name, row);
  }
  return [...byId.values()].sort((a, b) => countProducts(b.no_of_products) - countProducts(a.no_of_products));
}
export function findCulturaFeedById(rows, feedId) { const expected = String(feedId || '').trim(); return rows.find(row => String(row.feed_id || row.data_feed_id || row.fid || '').trim() === expected) || null; }
export function findRomanFeed(rows) { return findCulturaFeedById(rows, AWIN_ROMAN_FEED_ID); }

export async function latestCheckpoint(base44, feedId) {
  const page = await base44.asServiceRole.entities.ImportLog.filter({ source_retailer: AWIN_RETAILER, feed_id: feedId }, { sort: '-started_at', limit: 1 });
  const latest = (page.items || page || [])[0];
  if (!latest || latest.status === 'success') return 0;
  return Number(latest.line_checkpoint || 0) || 0;
}

function uniquifyRecords(records) {
  const seen = new Map();
  const out = [];
  let duplicatesInBatch = 0;
  for (const record of records) {
    let key = record.product_identifier;
    if (seen.has(key)) {
      const suffix = record.offer?.retailer_product_id || `${seen.get(key) + 1}`;
      key = `${key}:${suffix}`;
      record.product_identifier = key;
      record.book.product_identifier = key;
      duplicatesInBatch += 1;
    }
    seen.set(record.product_identifier, (seen.get(record.product_identifier) || 0) + 1);
    out.push(record);
  }
  return { rows: out, duplicatesInBatch };
}

function keepNonEmpty(existingValue, incomingValue) {
  const incoming = typeof incomingValue === 'string' ? incomingValue.trim() : incomingValue;
  if (incoming === '' || incoming === null || incoming === undefined) return existingValue;
  return incomingValue;
}

function mergeOffer(existing = {}, incoming = {}) {
  return {
    ...incoming,
    retailer_product_id: keepNonEmpty(existing.retailer_product_id, incoming.retailer_product_id),
    currency: keepNonEmpty(existing.currency, incoming.currency),
    availability: keepNonEmpty(existing.availability, incoming.availability),
    availability_raw: keepNonEmpty(existing.availability_raw, incoming.availability_raw),
    merchant_url: keepNonEmpty(existing.merchant_url, incoming.merchant_url),
    affiliate_url: keepNonEmpty(existing.affiliate_url, incoming.affiliate_url),
    missing_since: incoming.last_seen_in_feed ? '' : (existing.missing_since || incoming.missing_since || ''),
  };
}

function itemsFrom(page) { return page?.items || page || []; }
function uniqueValues(values = []) { return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))]; }
function chunks(values = [], size = 500) { const output = []; for (let i = 0; i < values.length; i += size) output.push(values.slice(i, i + size)); return output; }
async function limitedFilter(base44, limiter, entityName, query, options = {}) {
  const run = () => base44.asServiceRole.entities[entityName].filter(query, options);
  return limiter ? await limiter.list(run, `${entityName}.filter`) : await run();
}
async function filterInChunks(base44, limiter, entityName, field, values, extraQuery = {}) {
  const output = [];
  for (const chunk of chunks(uniqueValues(values), 500)) {
    const page = await limitedFilter(base44, limiter, entityName, { ...extraQuery, [field]: { $in: chunk } }, { limit: chunk.length });
    output.push(...itemsFrom(page));
  }
  return output;
}

export async function upsertBatch(base44, records, examples, exampleLimit = 10, options = {}) {
  const { rows } = uniquifyRecords(records);
  const limiter = options.limiter || null;
  if (!rows.length) return { booksCreated: 0, booksUpdated: 0, offersCreated: 0, offersUpdated: 0, diagnostics: { touched_book_ids: [], product_identifiers: [], isbn13s: [] } };
  const identifiers = uniqueValues(rows.map(record => record.product_identifier));
  const isbn13s = uniqueValues(rows.map(record => record.isbn13));
  const [existingByIdentifier, existingByIsbn] = await Promise.all([
    filterInChunks(base44, limiter, 'Books', 'product_identifier', identifiers),
    filterInChunks(base44, limiter, 'Books', 'isbn13', isbn13s),
  ]);
  const identifierSet = new Set(identifiers);
  const isbnSet = new Set(isbn13s);
  const existingMap = new Map();
  for (const book of [...existingByIdentifier, ...existingByIsbn]) {
    if (book.product_identifier && identifierSet.has(book.product_identifier)) existingMap.set(book.id, book);
    else if (book.isbn13 && isbnSet.has(book.isbn13)) existingMap.set(book.id, book);
  }
  const existingBooks = [...existingMap.values()];
  const byIdentifier = new Map(existingBooks.map(book => [book.product_identifier || book.isbn13, book]));
  const byIsbn = new Map(existingBooks.filter(book => book.isbn13).map(book => [book.isbn13, book]));
  const booksToCreate = [];
  const booksToUpdate = [];
  for (const record of rows) {
    const existing = byIdentifier.get(record.product_identifier) || (record.isbn13 ? byIsbn.get(record.isbn13) : null);
    if (existing) booksToUpdate.push({ id: existing.id, ...mergeBook(existing, record.book) });
    else booksToCreate.push(record.book);
  }
  const created = booksToCreate.length ? await base44.asServiceRole.entities.Books.bulkCreate(booksToCreate) : [];
  if (booksToUpdate.length) await base44.asServiceRole.entities.Books.bulkUpdate(booksToUpdate);
  const allBooks = [...existingBooks, ...(created || [])];
  const bookByIdentifier = new Map(allBooks.map(book => [book.product_identifier || book.isbn13, book]));
  const bookByIsbn = new Map(allBooks.filter(book => book.isbn13).map(book => [book.isbn13, book]));
  const bookIds = uniqueValues(allBooks.map(book => book.id));
  const existingOffers = await filterInChunks(base44, limiter, 'BookOffers', 'book_id', bookIds, { retailer_name: AWIN_RETAILER });
  const offerByBook = new Map(existingOffers.map(offer => [offer.book_id, offer]));
  const offerByRetailerProduct = new Map(existingOffers.map(offer => [String(offer.retailer_product_id || '').trim(), offer]).filter(([key]) => key));
  const offersToCreate = [];
  const offersToUpdate = [];
  for (const record of rows) {
    const book = bookByIdentifier.get(record.product_identifier) || (record.isbn13 ? bookByIsbn.get(record.isbn13) : null);
    if (!book?.id) continue;
    const offer = { ...record.offer, book_id: book.id };
    const merchantKey = String(offer.retailer_product_id || '').trim();
    const existingOffer = (merchantKey ? offerByRetailerProduct.get(merchantKey) : null) || offerByBook.get(book.id);
    if (existingOffer) offersToUpdate.push({ id: existingOffer.id, ...mergeOffer(existingOffer, offer) });
    else offersToCreate.push(offer);
    if (examples.length < exampleLimit) examples.push({ product_identifier: record.book.product_identifier, identifier_type: record.book.identifier_type, isbn_valid: record.book.isbn_valid, product_type: record.book.product_type, classification: record.book.classification, isbn13: record.book.isbn13, title: record.book.title, price: record.offer.price, currency: 'EUR', availability: record.offer.availability, availability_raw: record.offer.availability_raw, author: record.book.author, author_source: record.book.author_source, category: record.book.category, category_source: record.book.category_source });
  }
  if (offersToCreate.length) await base44.asServiceRole.entities.BookOffers.bulkCreate(offersToCreate);
  if (offersToUpdate.length) await base44.asServiceRole.entities.BookOffers.bulkUpdate(offersToUpdate);
  return { booksCreated: booksToCreate.length, booksUpdated: booksToUpdate.length, offersCreated: offersToCreate.length, offersUpdated: offersToUpdate.length, diagnostics: { touched_book_ids: bookIds, product_identifiers: identifiers, isbn13s, existing_books_loaded: existingBooks.length, existing_offers_loaded: existingOffers.length } };
}

export async function recordImportRejections(base44, rejections = []) {
  if (!rejections.length) return;
  for (let i = 0; i < rejections.length; i += 500) await base44.asServiceRole.entities.ImportRejection.bulkCreate(rejections.slice(i, i + 500));
}

export async function writeImportProgress(base44, logId, stats, status = 'running', extra = {}) {
  await base44.asServiceRole.entities.ImportLog.update(logId, { products_processed: stats.productsProcessed, rows_rejected: stats.rowsRejected, books_created: stats.booksCreated, books_updated: stats.booksUpdated, offers_created: stats.offersCreated, offers_updated: stats.offersUpdated, duplicates_in_feed: stats.duplicatesInFeed, duplicates_cross_feed: stats.duplicatesCrossFeed, duplicates: stats.duplicatesInFeed + stats.duplicatesCrossFeed, errors: stats.errors, line_checkpoint: stats.lineCheckpoint, status, ...extra });
}
export function emptyImportStats(lineCheckpoint = 0) { return { productsProcessed: 0, rowsRejected: 0, booksCreated: 0, booksUpdated: 0, offersCreated: 0, offersUpdated: 0, duplicatesInFeed: 0, duplicatesCrossFeed: 0, errors: 0, lineCheckpoint }; }
export function emptyRejectionReasons() { return { non_book: 0, ean_not_isbn: 0, invalid_isbn: 0, invalid_price: 0, missing_title: 0 }; }