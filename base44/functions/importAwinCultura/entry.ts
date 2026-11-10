import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { isTruthyStock, listAwinFeedRows, normalizeAwinHeader, normalizeIsbn, normalizeText, parseCsvLine, parsePrice, resolveAwinFeedRow, safeUrl } from '../../shared/catalogUtils.ts';

const RETAILER = 'Cultura';
const BATCH_SIZE = 300;
const MAX_TEST_LIMIT = 1000;
const MAX_RUNTIME_MS = 260000;
const PRIORITY_FEED_IDS = ['101388', '101386', '101439', '101522', '101385'];
const OPTIONAL_ENFANT_FEED_ID = '101437';

function readSecret(name) {
  try {
    return secrets.get(name) || '';
  } catch {
    return '';
  }
}

function countProducts(value = '') {
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

function mergeBook(existing = {}, incoming = {}) {
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

async function* csvRowsFromAwinStream(stream, isGzip) {
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

function productToCatalogRecord(row, importedAt) {
  const title = String(row.product_name || '').trim();
  if (!title) return { error: 'titre_manquant' };

  const isbn = classifyIsbn(row.ean || '');
  if (!isbn.isbn13) return { error: isbn.reason };

  const price = parsePrice(row.search_price);
  if (!price) return { error: 'prix_invalide' };

  const merchantUrl = safeUrl(row.merchant_deep_link || '');
  const affiliateUrl = safeUrl(row.aw_deep_link || '');
  const imageUrl = safeUrl(row.merchant_image_url || row.aw_image_url || '');
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
      image_url: imageUrl,
      category,
      category_norm: normalizeText(category),
      language: 'fr',
      publisher: String(row.brand_name || '').trim(),
    },
    offer: {
      retailer_name: RETAILER,
      retailer_product_id: String(row.aw_product_id || '').trim() || isbn.isbn13,
      price,
      original_price: parsePrice(row.original_price || row.rrp_price || row.search_price) || price,
      currency: 'EUR',
      availability: isTruthyStock(row.stock_status) ? 'en_stock' : String(row.stock_status || 'indisponible').trim() || 'indisponible',
      stock_quantity: Number(row.stock_quantity || 0) || 0,
      merchant_url: merchantUrl,
      affiliate_url: affiliateUrl,
      last_updated: importedAt,
    },
  };
}

function selectCulturaBookFeeds(rows, includeUniversEnfant) {
  const byId = new Map();
  for (const row of rows) {
    const advertiser = normalizeText(row.advertiser_name);
    if (!advertiser.includes('cultura')) continue;
    const feedId = String(row.feed_id || row.data_feed_id || row.fid || '').trim();
    const feedNameNorm = normalizeText(row.feed_name);
    const isPriority = PRIORITY_FEED_IDS.includes(feedId);
    const isDynamicBook = feedNameNorm.includes('livre');
    const isOptionalEnfant = includeUniversEnfant && (feedId === OPTIONAL_ENFANT_FEED_ID || feedNameNorm.includes('univers enfant'));
    if (!isPriority && !isDynamicBook && !isOptionalEnfant) continue;
    byId.set(feedId || row.feed_name, row);
  }
  return [...byId.values()].sort((a, b) => countProducts(b.no_of_products) - countProducts(a.no_of_products));
}

async function latestCheckpoint(base44, feedId) {
  const page = await base44.asServiceRole.entities.ImportLog.filter({ source_retailer: RETAILER, feed_id: feedId }, { sort: '-started_at', limit: 1 });
  const latest = (page.items || page || [])[0];
  if (!latest || latest.status === 'success') return 0;
  return Number(latest.line_checkpoint || 0) || 0;
}

async function upsertBatch(base44, records, seenGlobal, examples) {
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
    ? await base44.asServiceRole.entities.BookOffers.filter({ book_id: { $in: bookIds }, retailer_name: RETAILER }, { limit: Math.min(500, bookIds.length) })
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

  return {
    booksCreated: booksToCreate.length,
    booksUpdated: booksToUpdate.length,
    offersCreated: offersToCreate.length,
    offersUpdated: offersToUpdate.length,
    duplicatesCrossFeed,
  };
}

async function writeProgress(base44, logId, stats, status = 'running', extra = {}) {
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

export default async function(req) {
  const runStarted = Date.now();
  const startedAt = new Date().toISOString();
  let executionLog = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Authentification requise' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Accès administrateur requis' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === 'test' || (body.limit && body.mode !== 'full') ? 'test' : 'full';
    const testLimit = mode === 'test' ? Math.max(1, Math.min(Number(body.limit || MAX_TEST_LIMIT), MAX_TEST_LIMIT)) : null;
    const includeUniversEnfant = body.include_univers_enfant === true;
    const resume = body.resume === true || mode === 'full';
    const importedAt = new Date().toISOString();

    const feedUrl = readSecret('AWIN_CULTURA_FEED_URL') || readSecret('AWIN_FEED_URL');
    const token = readSecret('AWIN_API_TOKEN');
    if (!feedUrl || !token) return Response.json({ error: 'Secrets Awin manquants : AWIN_CULTURA_FEED_URL et AWIN_API_TOKEN' }, { status: 500 });

    executionLog = await base44.asServiceRole.entities.ImportLog.create({
      started_at: startedAt,
      import_mode: mode === 'test' ? 'test' : 'execution',
      products_processed: 0,
      rows_rejected: 0,
      books_created: 0,
      books_updated: 0,
      offers_created: 0,
      offers_updated: 0,
      duplicates: 0,
      duplicates_cross_feed: 0,
      errors: 0,
      status: 'running',
      source_retailer: RETAILER,
      test_limit: testLimit || undefined,
    });

    const { rows: feedRows } = await listAwinFeedRows(feedUrl, token, { timeoutMs: 90000 });
    const feeds = selectCulturaBookFeeds(feedRows, includeUniversEnfant);
    if (!feeds.length) throw new Error('Aucun flux livre Cultura FR détecté');

    const totals = {
      productsProcessed: 0,
      rowsRejected: 0,
      booksCreated: 0,
      booksUpdated: 0,
      offersCreated: 0,
      offersUpdated: 0,
      duplicatesCrossFeed: 0,
      errors: 0,
      lineCheckpoint: 0,
    };
    const rejectionReasons = { ean_non_isbn: 0, isbn_invalide: 0, prix_invalide: 0, titre_manquant: 0 };
    const writtenExamples = [];
    const feedReports = [];
    const seenGlobal = new Set();
    const observedUniqueIsbn = new Set();
    let acceptedForWrite = 0;
    let stoppedForLimit = false;
    let stoppedForRuntime = false;

    for (const feed of feeds) {
      if (testLimit && acceptedForWrite >= testLimit) break;
      if (Date.now() - runStarted > MAX_RUNTIME_MS) { stoppedForRuntime = true; break; }

      const feedId = String(feed.feed_id || feed.data_feed_id || feed.fid || '').trim();
      const feedName = String(feed.feed_name || '').trim();
      const resumeFromLine = resume ? await latestCheckpoint(base44, feedId) : 0;
      const feedStats = { productsProcessed: 0, rowsRejected: 0, booksCreated: 0, booksUpdated: 0, offersCreated: 0, offersUpdated: 0, duplicatesCrossFeed: 0, errors: 0, lineCheckpoint: resumeFromLine };
      const feedLog = await base44.asServiceRole.entities.ImportLog.create({
        started_at: new Date().toISOString(),
        import_mode: mode === 'test' ? 'test' : 'feed',
        feed_id: feedId,
        feed_name: feedName,
        products_processed: 0,
        rows_rejected: 0,
        books_created: 0,
        books_updated: 0,
        offers_created: 0,
        offers_updated: 0,
        duplicates: 0,
        duplicates_cross_feed: 0,
        errors: 0,
        status: 'running',
        source_retailer: RETAILER,
        resume_from_line: resumeFromLine,
        test_limit: testLimit || undefined,
      });

      try {
        const resolved = await resolveAwinFeedRow(feedUrl, feed, token, { timeoutMs: 240000 });
        let batch = [];
        for await (const { row, lineNumber } of csvRowsFromAwinStream(resolved.stream, resolved.gzip.is_gzip)) {
          if (lineNumber <= resumeFromLine) continue;
          if (Date.now() - runStarted > MAX_RUNTIME_MS) { stoppedForRuntime = true; break; }
          feedStats.productsProcessed += 1;
          feedStats.lineCheckpoint = lineNumber;
          totals.productsProcessed += 1;
          totals.lineCheckpoint = lineNumber;

          const record = productToCatalogRecord(row, importedAt);
          if (record.error) {
            feedStats.rowsRejected += 1;
            totals.rowsRejected += 1;
            rejectionReasons[record.error] = (rejectionReasons[record.error] || 0) + 1;
            continue;
          }

          observedUniqueIsbn.add(record.isbn13);
          if (testLimit && acceptedForWrite >= testLimit) { stoppedForLimit = true; break; }
          batch.push(record);
          acceptedForWrite += 1;

          if (batch.length >= BATCH_SIZE) {
            const result = await upsertBatch(base44, batch, seenGlobal, writtenExamples);
            feedStats.booksCreated += result.booksCreated;
            feedStats.booksUpdated += result.booksUpdated;
            feedStats.offersCreated += result.offersCreated;
            feedStats.offersUpdated += result.offersUpdated;
            feedStats.duplicatesCrossFeed += result.duplicatesCrossFeed;
            totals.booksCreated += result.booksCreated;
            totals.booksUpdated += result.booksUpdated;
            totals.offersCreated += result.offersCreated;
            totals.offersUpdated += result.offersUpdated;
            totals.duplicatesCrossFeed += result.duplicatesCrossFeed;
            batch = [];
            await writeProgress(base44, feedLog.id, feedStats);
            await base44.asServiceRole.entities.ImportLog.update(executionLog.id, { current_feed_id: feedId, products_processed: totals.productsProcessed, rows_rejected: totals.rowsRejected, books_created: totals.booksCreated, books_updated: totals.booksUpdated, offers_created: totals.offersCreated, offers_updated: totals.offersUpdated, duplicates_cross_feed: totals.duplicatesCrossFeed, duplicates: totals.duplicatesCrossFeed, line_checkpoint: totals.lineCheckpoint });
          }
        }

        if (batch.length) {
          const result = await upsertBatch(base44, batch, seenGlobal, writtenExamples);
          feedStats.booksCreated += result.booksCreated;
          feedStats.booksUpdated += result.booksUpdated;
          feedStats.offersCreated += result.offersCreated;
          feedStats.offersUpdated += result.offersUpdated;
          feedStats.duplicatesCrossFeed += result.duplicatesCrossFeed;
          totals.booksCreated += result.booksCreated;
          totals.booksUpdated += result.booksUpdated;
          totals.offersCreated += result.offersCreated;
          totals.offersUpdated += result.offersUpdated;
          totals.duplicatesCrossFeed += result.duplicatesCrossFeed;
        }

        const feedStatus = stoppedForRuntime || stoppedForLimit ? 'partial' : (feedStats.rowsRejected || feedStats.errors ? 'partial' : 'success');
        await writeProgress(base44, feedLog.id, feedStats, feedStatus, { finished_at: new Date().toISOString(), feed_size_bytes: Number(resolved.http.content_length || 0) || undefined });
        feedReports.push({ feed_id: feedId, feed_name: feedName, status: feedStatus, ...feedStats });
      } catch (error) {
        feedStats.errors += 1;
        totals.errors += 1;
        await writeProgress(base44, feedLog.id, feedStats, 'failed', { finished_at: new Date().toISOString(), error_message: error.message });
        feedReports.push({ feed_id: feedId, feed_name: feedName, status: 'failed', error: error.message, ...feedStats });
      }

      if (stoppedForLimit || stoppedForRuntime) break;
    }

    const [bookCount, culturaOfferCount] = await Promise.all([
      base44.asServiceRole.entities.Books.count({}),
      base44.asServiceRole.entities.BookOffers.count({ retailer_name: RETAILER }),
    ]);
    const expectedProducts = feeds.reduce((sum, feed) => sum + countProducts(feed.no_of_products), 0);
    const observedValid = acceptedForWrite || observedUniqueIsbn.size;
    const uniqueRatio = observedValid ? observedUniqueIsbn.size / observedValid : 0;
    const estimatedUniqueReferences = uniqueRatio ? Math.round(expectedProducts * uniqueRatio) : 0;

    const status = totals.errors || stoppedForRuntime || stoppedForLimit || totals.rowsRejected ? 'partial' : 'success';
    const controlReport = {
      mode,
      test_limit: testLimit,
      feeds_selected: feeds.map(feed => ({ feed_id: String(feed.feed_id || feed.data_feed_id || feed.fid || '').trim(), feed_name: String(feed.feed_name || '').trim(), no_of_products: countProducts(feed.no_of_products) })),
      rejection_reasons: rejectionReasons,
      duplicates_cross_feed: totals.duplicatesCrossFeed,
      examples_written: writtenExamples,
      current_totals: { books: bookCount, cultura_offers: culturaOfferCount },
      expected_unique_references_estimate: {
        expected_products: expectedProducts,
        observed_unique_isbn: observedUniqueIsbn.size,
        observed_valid_isbn: observedValid,
        estimated_unique_references: estimatedUniqueReferences,
      },
      stopped_for_limit: stoppedForLimit,
      stopped_for_runtime: stoppedForRuntime,
      feed_reports: feedReports,
      no_catalog_deletion: true,
      other_retailer_offers_untouched: true,
    };

    await base44.asServiceRole.entities.ImportLog.update(executionLog.id, {
      finished_at: new Date().toISOString(),
      current_feed_id: feedReports[feedReports.length - 1]?.feed_id || '',
      products_processed: totals.productsProcessed,
      rows_rejected: totals.rowsRejected,
      books_created: totals.booksCreated,
      books_updated: totals.booksUpdated,
      offers_created: totals.offersCreated,
      offers_updated: totals.offersUpdated,
      duplicates_cross_feed: totals.duplicatesCrossFeed,
      duplicates: totals.duplicatesCrossFeed,
      errors: totals.errors,
      status,
      line_checkpoint: totals.lineCheckpoint,
      control_report: controlReport,
    });

    return Response.json({ ok: true, status, ...totals, rejection_reasons: rejectionReasons, examples_written: writtenExamples, current_totals: controlReport.current_totals, expected_unique_references_estimate: controlReport.expected_unique_references_estimate, feed_reports: feedReports });
  } catch (error) {
    try {
      if (executionLog?.id) {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.ImportLog.update(executionLog.id, { finished_at: new Date().toISOString(), status: 'failed', error_message: error.message });
      }
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
}