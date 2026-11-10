import { inferAuthor, isBookCategory, normalizeAvailability, normalizeAwinHeader, normalizeIsbn, normalizeText, parseCsvLine, parsePrice, safeUrl, tokenizeTitle } from './catalogUtils.ts';

export const AWIN_RETAILER = 'Cultura';
export const AWIN_BATCH_SIZE = 300;
export const AWIN_MAX_TEST_LIMIT = 1000;
export const AWIN_PRIORITY_FEED_IDS = ['101388', '101386', '101439', '101522', '101385'];
export const AWIN_ROMAN_FEED_ID = '101386';
export const AWIN_OPTIONAL_ENFANT_FEED_ID = '101437';

export const AWIN_FEED_RAYONS = {
  '101386': 'Roman',
  '101388': 'Vie pratique, histoire et sciences humaines',
  '101439': 'Loisirs, art, scolaire et universitaire',
  '101522': 'BD, manga et comics',
  '101385': 'Littérature',
};

export function countProducts(value = '') {
  return Number(String(value || '').replace(/[^0-9]/g, '')) || 0;
}

function cleanDigits(value = '') {
  return String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
}

function classifyIsbn(value = '') {
  const clean = cleanDigits(value);
  if (!clean) return { isbn13: null, reason: 'ean_not_isbn' };
  if (/^\d{13}$/.test(clean) && !/^97[89]/.test(clean)) return { isbn13: null, reason: 'ean_not_isbn' };
  const isbn13 = normalizeIsbn(clean);
  if (!isbn13) return { isbn13: null, reason: /^97[89]\d{10}$/.test(clean) ? 'invalid_isbn' : 'ean_not_isbn' };
  return { isbn13, reason: '' };
}

function betterImage(existing = '', incoming = '') {
  const next = safeUrl(incoming || '');
  if (!next) return existing || '';
  const current = safeUrl(existing || '');
  if (!current) return next;
  const score = (url) => {
    const text = normalizeText(url);
    let value = url.length;
    if (text.includes('large') || text.includes('zoom') || text.includes('1200')) value += 80;
    if (text.includes('800') || text.includes('1000')) value += 50;
    if (text.includes('thumb') || text.includes('small')) value -= 60;
    return value;
  };
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
  const incomingHasAuthor = Boolean(String(incoming.author || '').trim());
  const existingHasAuthor = Boolean(String(existing.author || '').trim());
  const author = existingHasAuthor ? existing.author : (incoming.author || '');
  return {
    isbn13: existing.isbn13 || incoming.isbn13,
    ean: existing.ean || incoming.ean,
    title: existing.title || incoming.title,
    title_norm: existing.title_norm || incoming.title_norm,
    title_tokens: Array.isArray(existing.title_tokens) && existing.title_tokens.length ? existing.title_tokens : (incoming.title_tokens || tokenizeTitle(existing.title || incoming.title || '')),
    author,
    author_norm: existingHasAuthor ? existing.author_norm : (incoming.author_norm || ''),
    author_source: existingHasAuthor ? (existing.author_source || 'feed') : (incomingHasAuthor ? (incoming.author_source || 'feed') : 'none'),
    author_enriched_at: existing.author_enriched_at || incoming.author_enriched_at || undefined,
    description: description || '',
    image_url: betterImage(existing.image_url, incoming.image_url),
    category: categoryMerge.category,
    category_source: categoryMerge.source,
    category_norm: normalizeText(categoryMerge.category),
    language: existing.language || incoming.language || 'fr',
    publisher: existing.publisher || incoming.publisher || '',
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
      if (!headers) {
        headers = cells.map(normalizeAwinHeader);
        continue;
      }
      const row = {};
      headers.forEach((header, index) => { row[header] = cells[index] || ''; });
      yield { row, lineNumber };
    }
  }
  if (buffer.trim() && headers) {
    lineNumber += 1;
    const cells = parseCsvLine(buffer);
    const row = {};
    headers.forEach((header, index) => { row[header] = cells[index] || ''; });
    yield { row, lineNumber };
  }
}

function categoryFromRow(row = {}, feedId = '') {
  const fromField = String(row.category_name || '').trim();
  if (fromField) return { category: fromField, source: 'feed_field' };
  const rayon = AWIN_FEED_RAYONS[String(feedId || '').trim()] || '';
  if (rayon) return { category: rayon, source: 'feed_rayon' };
  return { category: '', source: undefined };
}

function rejectionFrom(row = {}, reason = '', feedId = '', importedAt = '') {
  return {
    ean_raw: String(row.ean || '').trim(),
    title: String(row.product_name || '').trim(),
    category: String(row.category_name || row.merchant_product_category_path || '').trim(),
    reason,
    feed_id: String(feedId || '').trim(),
    import_date: importedAt,
    reviewed: false,
  };
}

export function productToCatalogRecord(row, importedAt, feed = {}) {
  const feedId = String(feed.feed_id || feed.data_feed_id || feed.fid || feed.feedId || '').trim();
  const title = String(row.product_name || '').trim();
  if (!title) return { error: 'missing_title', rejection: rejectionFrom(row, 'missing_title', feedId, importedAt) };

  const explicitCategory = String(row.category_name || row.merchant_product_category_path || '').trim();
  if (explicitCategory && !isBookCategory(explicitCategory, title) && !AWIN_FEED_RAYONS[feedId]) {
    return { error: 'non_book', rejection: rejectionFrom(row, 'non_book', feedId, importedAt) };
  }

  const isbn = classifyIsbn(row.ean || '');
  if (!isbn.isbn13) return { error: isbn.reason, rejection: rejectionFrom(row, isbn.reason, feedId, importedAt) };
  const price = parsePrice(row.search_price);
  if (!price) return { error: 'invalid_price', rejection: rejectionFrom(row, 'invalid_price', feedId, importedAt) };

  const category = categoryFromRow(row, feedId);
  const author = inferAuthor(row);
  const availabilityRaw = String(row.stock_status || row.in_stock || row.availability || '').trim();
  return {
    isbn13: isbn.isbn13,
    book: {
      isbn13: isbn.isbn13,
      ean: cleanDigits(row.ean || isbn.isbn13),
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
      publisher: String(row.brand_name || '').trim(),
    },
    offer: {
      retailer_name: AWIN_RETAILER,
      retailer_product_id: String(row.aw_product_id || '').trim() || isbn.isbn13,
      price,
      original_price: parsePrice(row.original_price || row.rrp_price || row.search_price) || price,
      currency: 'EUR',
      availability: normalizeAvailability(availabilityRaw),
      availability_raw: availabilityRaw,
      stock_quantity: Number(row.stock_quantity || 0) || 0,
      merchant_url: safeUrl(row.merchant_deep_link || ''),
      affiliate_url: safeUrl(row.aw_deep_link || ''),
      last_updated: importedAt,
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

export function findCulturaFeedById(rows, feedId) {
  const expected = String(feedId || '').trim();
  return rows.find(row => String(row.feed_id || row.data_feed_id || row.fid || '').trim() === expected) || null;
}

export function findRomanFeed(rows) {
  return findCulturaFeedById(rows, AWIN_ROMAN_FEED_ID);
}

export async function latestCheckpoint(base44, feedId) {
  const page = await base44.asServiceRole.entities.ImportLog.filter({ source_retailer: AWIN_RETAILER, feed_id: feedId }, { sort: '-started_at', limit: 1 });
  const latest = (page.items || page || [])[0];
  if (!latest || latest.status === 'success') return 0;
  return Number(latest.line_checkpoint || 0) || 0;
}

export async function upsertBatch(base44, records, examples, exampleLimit = 10) {
  const unique = new Map();
  for (const record of records) unique.set(record.isbn13, record);
  const rows = [...unique.values()];
  if (!rows.length) return { booksCreated: 0, booksUpdated: 0, offersCreated: 0, offersUpdated: 0 };

  const isbn13s = rows.map(record => record.isbn13);
  const existingPage = await base44.asServiceRole.entities.Books.filter({ isbn13: { $in: isbn13s } }, { limit: Math.min(500, isbn13s.length) });
  const existingBooks = existingPage.items || existingPage || [];
  const byIsbn = new Map(existingBooks.map(book => [book.isbn13, book]));
  const booksToCreate = [];
  const booksToUpdate = [];
  for (const record of rows) {
    const existing = byIsbn.get(record.isbn13);
    if (existing) booksToUpdate.push({ id: existing.id, ...mergeBook(existing, record.book) });
    else booksToCreate.push(record.book);
  }

  const created = booksToCreate.length ? await base44.asServiceRole.entities.Books.bulkCreate(booksToCreate) : [];
  if (booksToUpdate.length) await base44.asServiceRole.entities.Books.bulkUpdate(booksToUpdate);

  const allBooks = [...existingBooks, ...(created || [])];
  const bookByIsbn = new Map(allBooks.map(book => [book.isbn13, book]));
  const bookIds = allBooks.map(book => book.id).filter(Boolean);
  const offerPage = bookIds.length ? await base44.asServiceRole.entities.BookOffers.filter({ book_id: { $in: bookIds }, retailer_name: AWIN_RETAILER }, { limit: Math.min(500, bookIds.length) }) : { items: [] };
  const existingOffers = offerPage.items || offerPage || [];
  const offerByBook = new Map(existingOffers.map(offer => [offer.book_id, offer]));
  const offersToCreate = [];
  const offersToUpdate = [];

  for (const record of rows) {
    const book = bookByIsbn.get(record.isbn13);
    if (!book?.id) continue;
    const offer = { ...record.offer, book_id: book.id };
    const existingOffer = offerByBook.get(book.id);
    if (existingOffer) offersToUpdate.push({ id: existingOffer.id, ...offer });
    else offersToCreate.push(offer);
    if (examples.length < exampleLimit) {
      examples.push({
        title: record.book.title,
        isbn13: record.isbn13,
        price: record.offer.price,
        currency: 'EUR',
        availability: record.offer.availability,
        availability_raw: record.offer.availability_raw,
        author: record.book.author,
        author_source: record.book.author_source,
        category: record.book.category,
        category_source: record.book.category_source,
      });
    }
  }

  if (offersToCreate.length) await base44.asServiceRole.entities.BookOffers.bulkCreate(offersToCreate);
  if (offersToUpdate.length) await base44.asServiceRole.entities.BookOffers.bulkUpdate(offersToUpdate);
  return { booksCreated: booksToCreate.length, booksUpdated: booksToUpdate.length, offersCreated: offersToCreate.length, offersUpdated: offersToUpdate.length };
}

export async function recordImportRejections(base44, rejections = []) {
  if (!rejections.length) return;
  for (let i = 0; i < rejections.length; i += 500) {
    await base44.asServiceRole.entities.ImportRejection.bulkCreate(rejections.slice(i, i + 500));
  }
}

export async function writeImportProgress(base44, logId, stats, status = 'running', extra = {}) {
  await base44.asServiceRole.entities.ImportLog.update(logId, {
    products_processed: stats.productsProcessed,
    rows_rejected: stats.rowsRejected,
    books_created: stats.booksCreated,
    books_updated: stats.booksUpdated,
    offers_created: stats.offersCreated,
    offers_updated: stats.offersUpdated,
    duplicates_in_feed: stats.duplicatesInFeed,
    duplicates_cross_feed: stats.duplicatesCrossFeed,
    duplicates: stats.duplicatesInFeed + stats.duplicatesCrossFeed,
    errors: stats.errors,
    line_checkpoint: stats.lineCheckpoint,
    status,
    ...extra,
  });
}

export function emptyImportStats(lineCheckpoint = 0) {
  return { productsProcessed: 0, rowsRejected: 0, booksCreated: 0, booksUpdated: 0, offersCreated: 0, offersUpdated: 0, duplicatesInFeed: 0, duplicatesCrossFeed: 0, errors: 0, lineCheckpoint };
}

export function emptyRejectionReasons() {
  return { non_book: 0, ean_not_isbn: 0, invalid_isbn: 0, invalid_price: 0, missing_title: 0 };
}