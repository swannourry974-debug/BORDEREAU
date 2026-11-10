import { isTruthyStock, normalizeAwinHeader, normalizeIsbn, normalizeText, parseCsvLine, parsePrice, safeUrl } from './catalogUtils.ts';

export const AWIN_RETAILER = 'Cultura';
export const AWIN_BATCH_SIZE = 300;
export const AWIN_MAX_TEST_LIMIT = 1000;
export const AWIN_PRIORITY_FEED_IDS = ['101388', '101386', '101439', '101522', '101385'];
export const AWIN_ROMAN_FEED_ID = '101386';
export const AWIN_OPTIONAL_ENFANT_FEED_ID = '101437';

export function countProducts(value = '') {
  return Number(String(value || '').replace(/[^0-9]/g, '')) || 0;
}

function cleanDigits(value = '') {
  return String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
}

function classifyIsbn(value = '') {
  const clean = cleanDigits(value);
  if (!clean) return { isbn13: null, reason: 'ean_non_isbn' };
  if (/^\d{13}$/.test(clean) && !/^97[89]/.test(clean)) return { isbn13: null, reason: 'ean_non_isbn' };
  const isbn13 = normalizeIsbn(clean);
  if (!isbn13) return { isbn13: null, reason: clean.length === 13 ? 'isbn_invalide' : 'ean_non_isbn' };
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

function betterCategory(existing = '', incoming = '') {
  const next = String(incoming || '').trim();
  if (!next) return existing || '';
  const current = String(existing || '').trim();
  if (!current) return next;
  const detail = (value) => String(value || '').split(/[>\/|]/).filter(Boolean).length * 100 + String(value || '').length;
  return detail(next) > detail(current) ? next : current;
}

export function mergeBook(existing = {}, incoming = {}) {
  const description = String(incoming.description || '').length > String(existing.description || '').length ? incoming.description : existing.description;
  const category = betterCategory(existing.category, incoming.category);
  return {
    isbn13: existing.isbn13 || incoming.isbn13,
    ean: existing.ean || incoming.ean,
    title: existing.title || incoming.title,
    title_norm: existing.title_norm || incoming.title_norm,
    author: existing.author || incoming.author,
    author_norm: existing.author_norm || incoming.author_norm,
    description: description || '',
    image_url: betterImage(existing.image_url, incoming.image_url),
    category,
    category_norm: normalizeText(category),
    language: existing.language || incoming.language || 'fr',
    publisher: existing.publisher || incoming.publisher || '',
  };
}

export async function* csvRowsFromAwinStream(stream, isGzip) {
  const textStream = isGzip
    ? stream.pipeThrough(new DecompressionStream('gzip')).pipeThrough(new TextDecoderStream())
    : stream.pipeThrough(new TextDecoderStream());
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

export function productToCatalogRecord(row, importedAt) {
  const title = String(row.product_name || '').trim();
  if (!title) return { error: 'titre_manquant' };
  const isbn = classifyIsbn(row.ean || '');
  if (!isbn.isbn13) return { error: isbn.reason };
  const price = parsePrice(row.search_price);
  if (!price) return { error: 'prix_invalide' };
  const category = String(row.category_name || '').trim();
  const author = String(row.custom_5 || '').trim();
  return {
    isbn13: isbn.isbn13,
    book: {
      isbn13: isbn.isbn13,
      ean: cleanDigits(row.ean || isbn.isbn13),
      title,
      title_norm: normalizeText(title),
      author,
      author_norm: normalizeText(author),
      description: String(row.description || '').trim(),
      image_url: safeUrl(row.merchant_image_url || row.aw_image_url || ''),
      category,
      category_norm: normalizeText(category),
      language: 'fr',
      publisher: String(row.brand_name || '').trim(),
    },
    offer: {
      retailer_name: AWIN_RETAILER,
      retailer_product_id: String(row.aw_product_id || '').trim() || isbn.isbn13,
      price,
      original_price: parsePrice(row.original_price || row.rrp_price || row.search_price) || price,
      currency: 'EUR',
      availability: isTruthyStock(row.stock_status) ? 'en_stock' : String(row.stock_status || 'indisponible').trim() || 'indisponible',
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

export function findRomanFeed(rows) {
  return rows.find(row => String(row.feed_id || row.data_feed_id || row.fid || '').trim() === AWIN_ROMAN_FEED_ID) || null;
}

export async function latestCheckpoint(base44, feedId) {
  const page = await base44.asServiceRole.entities.ImportLog.filter({ source_retailer: AWIN_RETAILER, feed_id: feedId }, { sort: '-started_at', limit: 1 });
  const latest = (page.items || page || [])[0];
  if (!latest || latest.status === 'success') return 0;
  return Number(latest.line_checkpoint || 0) || 0;
}

export async function upsertBatch(base44, records, seenGlobal, examples) {
  const unique = new Map();
  let duplicatesCrossFeed = 0;
  for (const record of records) {
    if (seenGlobal.has(record.isbn13)) duplicatesCrossFeed += 1;
    seenGlobal.add(record.isbn13);
    unique.set(record.isbn13, record);
  }
  const rows = [...unique.values()];
  if (!rows.length) return { booksCreated: 0, booksUpdated: 0, offersCreated: 0, offersUpdated: 0, duplicatesCrossFeed };

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
  const offerPage = bookIds.length
    ? await base44.asServiceRole.entities.BookOffers.filter({ book_id: { $in: bookIds }, retailer_name: AWIN_RETAILER }, { limit: Math.min(500, bookIds.length) })
    : { items: [] };
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
    if (examples.length < 10) {
      examples.push({
        title: record.book.title,
        isbn13: record.isbn13,
        price: record.offer.price,
        currency: 'EUR',
        availability: record.offer.availability,
        image_present: Boolean(record.book.image_url),
        category: record.book.category,
      });
    }
  }

  if (offersToCreate.length) await base44.asServiceRole.entities.BookOffers.bulkCreate(offersToCreate);
  if (offersToUpdate.length) await base44.asServiceRole.entities.BookOffers.bulkUpdate(offersToUpdate);
  return { booksCreated: booksToCreate.length, booksUpdated: booksToUpdate.length, offersCreated: offersToCreate.length, offersUpdated: offersToUpdate.length, duplicatesCrossFeed };
}

export async function writeImportProgress(base44, logId, stats, status = 'running', extra = {}) {
  await base44.asServiceRole.entities.ImportLog.update(logId, {
    products_processed: stats.productsProcessed,
    rows_rejected: stats.rowsRejected,
    books_created: stats.booksCreated,
    books_updated: stats.booksUpdated,
    offers_created: stats.offersCreated,
    offers_updated: stats.offersUpdated,
    duplicates_cross_feed: stats.duplicatesCrossFeed,
    duplicates: stats.duplicatesCrossFeed,
    errors: stats.errors,
    line_checkpoint: stats.lineCheckpoint,
    status,
    ...extra,
  });
}

export function emptyImportStats(lineCheckpoint = 0) {
  return { productsProcessed: 0, rowsRejected: 0, booksCreated: 0, booksUpdated: 0, offersCreated: 0, offersUpdated: 0, duplicatesCrossFeed: 0, errors: 0, lineCheckpoint };
}

export function emptyRejectionReasons() {
  return { ean_non_isbn: 0, isbn_invalide: 0, prix_invalide: 0, titre_manquant: 0 };
}