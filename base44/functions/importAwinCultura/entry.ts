import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { buildSuggestionsForBook, inferAuthor, inferBookType, isBookCategory, isTruthyStock, normalizeIsbn, normalizeText, parseCsvLine, parsePrice, safeUrl } from '../../shared/catalogUtils.ts';

const RETAILER = 'Cultura';
const BATCH_SIZE = 300;

async function readSecret(name) {
  try {
    return secrets.get(name);
  } catch {
    return '';
  }
}

async function* csvRowsFromGzipStream(stream) {
  const textStream = stream.pipeThrough(new DecompressionStream('gzip')).pipeThrough(new TextDecoderStream());
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
        headers = cells.map(cell => normalizeText(cell).replace(/ /g, '_'));
        continue;
      }
      const row = {};
      headers.forEach((header, index) => { row[header] = cells[index] || ''; });
      yield { row, lineNumber };
    }
  }
  if (buffer.trim()) {
    lineNumber += 1;
    const cells = parseCsvLine(buffer);
    if (!headers) return;
    const row = {};
    headers.forEach((header, index) => { row[header] = cells[index] || ''; });
    yield { row, lineNumber };
  }
}

function productToCatalogRecord(row) {
  const title = String(row.product_name || row.title || '').trim();
  const category = String(row.merchant_product_category_path || row.category || '').trim();
  if (!isBookCategory(category, title)) return { error: 'not_book' };

  const isbn13 = normalizeIsbn(row.ean || row.isbn || row.isbn13 || '');
  if (!isbn13) return { error: 'invalid_ean' };
  const price = parsePrice(row.search_price || row.price);
  if (!price) return { error: 'invalid_price' };
  const currency = String(row.currency || '').trim().toUpperCase();
  if (!currency) return { error: 'missing_currency' };
  const merchantUrl = safeUrl(row.merchant_deep_link || row.merchant_url || row.product_url || '');
  const affiliateUrl = safeUrl(row.aw_deep_link || row.affiliate_url || '');
  if (!merchantUrl && !affiliateUrl) return { error: 'invalid_url' };

  const author = inferAuthor(row);
  const titleNorm = normalizeText(title);
  const authorNorm = normalizeText(author);
  const categoryNorm = normalizeText(category);
  return {
    isbn13,
    book: {
      isbn13,
      ean: String(row.ean || isbn13).replace(/[^0-9]/g, ''),
      title,
      title_norm: titleNorm,
      author,
      author_norm: authorNorm,
      description: String(row.description || '').trim(),
      image_url: safeUrl(row.merchant_image_url || row.image_url || ''),
      category,
      category_norm: categoryNorm,
      language: String(row.language || row.lang || 'fr').trim() || 'fr',
      publisher: String(row.publisher || '').trim(),
    },
    offer: {
      retailer_name: RETAILER,
      retailer_product_id: String(row.retailer_product_id || row.merchant_product_id || row.aw_product_id || row.product_id || isbn13).trim(),
      price,
      original_price: parsePrice(row.original_price || row.rrp_price || row.search_price) || price,
      currency,
      availability: isTruthyStock(row.in_stock || row.availability) ? 'en_stock' : 'indisponible',
      stock_quantity: Number(row.stock_quantity || 0) || 0,
      merchant_url: merchantUrl,
      affiliate_url: affiliateUrl || merchantUrl,
      last_updated: row.last_updated ? new Date(row.last_updated).toISOString() : new Date().toISOString(),
    },
    inferred: { type: inferBookType(category, title) },
  };
}

async function upsertBatch(base44, records) {
  const unique = new Map();
  let duplicates = 0;
  for (const record of records) {
    if (unique.has(record.isbn13)) duplicates += 1;
    unique.set(record.isbn13, record);
  }
  const rows = [...unique.values()];
  if (!rows.length) return { booksCreated: 0, offersUpdated: 0, duplicates, importedBookIds: [] };

  const isbn13s = rows.map(record => record.isbn13);
  const existingPage = await base44.asServiceRole.entities.Books.filter({ isbn13: { $in: isbn13s } }, { limit: Math.min(500, isbn13s.length) });
  const existingBooks = existingPage.items || existingPage || [];
  const byIsbn = new Map(existingBooks.map(book => [book.isbn13, book]));

  const toCreate = [];
  const toUpdate = [];
  for (const record of rows) {
    const existing = byIsbn.get(record.isbn13);
    if (existing) {
      toUpdate.push({ id: existing.id, ...record.book });
      duplicates += 1;
    } else {
      toCreate.push(record.book);
    }
  }

  const created = toCreate.length ? await base44.asServiceRole.entities.Books.bulkCreate(toCreate) : [];
  if (toUpdate.length) await base44.asServiceRole.entities.Books.bulkUpdate(toUpdate);
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
  }

  if (offersToCreate.length) await base44.asServiceRole.entities.BookOffers.bulkCreate(offersToCreate);
  if (offersToUpdate.length) await base44.asServiceRole.entities.BookOffers.bulkUpdate(offersToUpdate);

  return {
    booksCreated: toCreate.length,
    offersUpdated: offersToCreate.length + offersToUpdate.length,
    duplicates,
    importedBookIds: bookIds,
    sampleBook: allBooks[0] || null,
  };
}

export default async function(req) {
  const startedAt = new Date().toISOString();
  let log = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Authentification requise' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Accès administrateur requis' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const limit = body.limit ? Math.max(1, Math.min(Number(body.limit), 600000)) : null;
    const resume = body.resume === true;
    let resumeFromLine = 0;
    if (resume) {
      const previousPage = await base44.asServiceRole.entities.ImportLog.filter({ source_retailer: RETAILER }, { sort: '-started_at', limit: 1 });
      const previous = (previousPage.items || previousPage || [])[0];
      resumeFromLine = Number(previous?.line_checkpoint || 0);
    }

    log = await base44.asServiceRole.entities.ImportLog.create({
      started_at: startedAt,
      products_processed: 0,
      books_created: 0,
      offers_updated: 0,
      duplicates: 0,
      errors: 0,
      status: 'running',
      source_retailer: RETAILER,
      resume_from_line: resumeFromLine,
      test_limit: limit || undefined,
    });

    const feedUrl = await readSecret('AWIN_FEED_URL');
    const token = await readSecret('AWIN_API_TOKEN');
    if (!feedUrl || !token) {
      await base44.asServiceRole.entities.ImportLog.update(log.id, {
        finished_at: new Date().toISOString(),
        status: 'failed',
        error_message: 'Secrets Awin manquants : AWIN_FEED_URL et AWIN_API_TOKEN',
      });
      return Response.json({ error: 'Secrets Awin manquants : AWIN_FEED_URL et AWIN_API_TOKEN' }, { status: 500 });
    }

    const response = await fetch(feedUrl, {
      headers: { Authorization: `Bearer ${token}`, 'x-api-key': token },
      signal: AbortSignal.timeout(240000),
    });
    if (!response.ok || !response.body) throw new Error(`Téléchargement Awin impossible (${response.status})`);

    let batch = [];
    let processed = 0;
    let booksCreated = 0;
    let offersUpdated = 0;
    let duplicates = 0;
    let errors = 0;
    let lineCheckpoint = resumeFromLine;
    let sampleBook = null;

    for await (const { row, lineNumber } of csvRowsFromGzipStream(response.body)) {
      if (lineNumber <= resumeFromLine) continue;
      if (limit && processed >= limit) break;
      processed += 1;
      lineCheckpoint = lineNumber;
      const record = productToCatalogRecord(row);
      if (record.error) {
        errors += 1;
        continue;
      }
      batch.push(record);
      if (batch.length >= BATCH_SIZE) {
        const result = await upsertBatch(base44, batch);
        booksCreated += result.booksCreated;
        offersUpdated += result.offersUpdated;
        duplicates += result.duplicates;
        sampleBook = sampleBook || result.sampleBook;
        batch = [];
        await base44.asServiceRole.entities.ImportLog.update(log.id, { products_processed: processed, books_created: booksCreated, offers_updated: offersUpdated, duplicates, errors, line_checkpoint: lineCheckpoint });
      }
    }

    if (batch.length) {
      const result = await upsertBatch(base44, batch);
      booksCreated += result.booksCreated;
      offersUpdated += result.offersUpdated;
      duplicates += result.duplicates;
      sampleBook = sampleBook || result.sampleBook;
    }

    const suggestions = sampleBook ? await buildSuggestionsForBook(base44, sampleBook, 5) : [];
    const controlReport = {
      test_limit: limit || null,
      books_created: booksCreated,
      cultura_offers_created_or_updated: offersUpdated,
      duplicate_isbn13_detected_or_existing: duplicates,
      other_retailer_offers_untouched: true,
      same_then_category_example: sampleBook ? {
        book: { id: sampleBook.id, isbn13: sampleBook.isbn13, title: sampleBook.title, author: sampleBook.author, category: sampleBook.category },
        suggestions: suggestions.map(item => ({ id: item.id, isbn13: item.isbn13, title: item.title, origin: item.origin, price: item.price, availability: item.availability })),
      } : null,
    };

    const status = errors > 0 ? 'partial' : 'success';
    await base44.asServiceRole.entities.ImportLog.update(log.id, {
      finished_at: new Date().toISOString(),
      products_processed: processed,
      books_created: booksCreated,
      offers_updated: offersUpdated,
      duplicates,
      errors,
      status,
      feed_size_bytes: Number(response.headers.get('content-length') || 0),
      line_checkpoint: lineCheckpoint,
      control_report: controlReport,
    });

    return Response.json({ ok: true, status, products_processed: processed, books_created: booksCreated, offers_updated: offersUpdated, duplicates, errors, control_report: controlReport });
  } catch (error) {
    try {
      if (log?.id) {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.ImportLog.update(log.id, { finished_at: new Date().toISOString(), status: 'failed', error_message: error.message });
      }
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
}