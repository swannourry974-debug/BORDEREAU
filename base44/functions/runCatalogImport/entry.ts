import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { cleanEan, listAwinFeedRows, parsePrice, resolveAwinFeedRow, safeUrl } from '../../shared/catalogUtils.ts';
import { AWIN_RETAILER, csvRowsFromAwinStream, emptyImportStats, emptyRejectionReasons, findCulturaFeedById, productToCatalogRecord, recordImportRejections, upsertBatch } from '../../shared/awinImportCore.ts';
import { buildCatalogRelations, duplicateBookGroups, fetchAll } from '../../shared/catalogAuditUtils.ts';
import { createEntityRateLimiter, isRateLimitError } from '../../shared/entityRateLimiter.ts';

const FEEDS = [
  { feed_id: '101386', feed_name: 'ROMAN', feed_order: 1, expected_lines: 176966 },
  { feed_id: '101388', feed_name: 'ACTUALITE/VIE PRATIQUE/HISTOIRE GEO/SCIENCES HUMAINES', feed_order: 2, expected_lines: 205000 },
  { feed_id: '101439', feed_name: 'LOISIRS NATURE/ART/SCOLAIRE/UNIVERSITAIRE', feed_order: 3, expected_lines: 125957 },
  { feed_id: '101522', feed_name: 'BD/MANGA/COMICS/ADO', feed_order: 4, expected_lines: 76090 },
  { feed_id: '101385', feed_name: 'LITTERATURE', feed_order: 5, expected_lines: 47 },
];

function readSecret(name) { try { return secrets.get(name) || ''; } catch { return ''; } }
function rowsFrom(page) { return page.items || page || []; }
function sum(runs, field) { return runs.reduce((total, run) => total + Number(run[field] || 0), 0); }
function feedMeta(feedId) { return FEEDS.find(feed => feed.feed_id === String(feedId || '').trim()) || null; }
function emptyChecks() { return { ok: true, failed: [], metrics: {}, thresholds: { missing_row_field_rate: 0.05, rejection_rate: 0.4 }, no_deletion: true }; }
function failCheck(checks, key, value, threshold) { checks.ok = false; checks.failed.push(key); checks.metrics[key] = { value, threshold }; }
function buildGlobalChecks(books = [], offers = [], batchStats = {}) {
  const checks = emptyChecks();
  const relations = buildCatalogRelations(books, offers);
  const duplicates = duplicateBookGroups(books);
  const activeBooks = relations.activeBooks.length || 1;
  const activeOffers = relations.activeOffers.length || 1;
  const missingPriceRate = relations.activeOffers.filter(offer => !Number(offer.price || 0)).length / activeOffers;
  const missingImageRate = relations.activeBooks.filter(book => !String(book.image_url || '').trim()).length / activeBooks;
  const missingMerchantUrlRate = relations.activeOffers.filter(offer => !String(offer.merchant_url || offer.affiliate_url || '').trim()).length / activeOffers;
  const batchLines = Math.max(1, Number(batchStats.lines || 0));
  const rejectionRate = Number(batchStats.rows_rejected || 0) / batchLines;
  checks.scan_scope = 'global';
  checks.scope = 'global';
  checks.scanned_total_books = books.length;
  checks.scanned_total_offers = offers.length;
  checks.metrics = {
    orphan_offers: relations.orphanOffers.length + relations.offersWithoutBookId.length,
    books_without_offer: relations.booksWithoutOffer.length,
    duplicate_product_identifiers: duplicates.product_identifier.length,
    duplicate_isbn13: duplicates.isbn13.length,
    duplicate_cultura_offer_pairs: relations.duplicateOfferGroups.filter(group => group.offers.some(offer => offer.retailer_name === AWIN_RETAILER)).length,
    missing_price_rate: missingPriceRate,
    missing_image_rate: missingImageRate,
    missing_merchant_url_rate: missingMerchantUrlRate,
    rejection_rate: rejectionRate,
    write_errors: Number(batchStats.errors || 0),
    scanned_books: books.length,
    scanned_offers: offers.length,
  };
  if (checks.metrics.orphan_offers > 0) failCheck(checks, 'orphan_offers', checks.metrics.orphan_offers, 0);
  if (checks.metrics.books_without_offer > 0) failCheck(checks, 'books_without_offer', checks.metrics.books_without_offer, 0);
  if (checks.metrics.duplicate_product_identifiers > 0) failCheck(checks, 'duplicate_product_identifiers', checks.metrics.duplicate_product_identifiers, 0);
  if (checks.metrics.duplicate_isbn13 > 0) failCheck(checks, 'duplicate_isbn13', checks.metrics.duplicate_isbn13, 0);
  if (checks.metrics.duplicate_cultura_offer_pairs > 0) failCheck(checks, 'duplicate_cultura_offer_pairs', checks.metrics.duplicate_cultura_offer_pairs, 0);
  if (missingPriceRate > 0.05) failCheck(checks, 'missing_price_rate', missingPriceRate, 0.05);
  if (missingImageRate > 0.05) failCheck(checks, 'missing_image_rate', missingImageRate, 0.05);
  if (missingMerchantUrlRate > 0.05) failCheck(checks, 'missing_merchant_url_rate', missingMerchantUrlRate, 0.05);
  if (rejectionRate > 0.4) failCheck(checks, 'rejection_rate', rejectionRate, 0.4);
  if (checks.metrics.write_errors > 0) failCheck(checks, 'write_errors', checks.metrics.write_errors, 0);
  checks.checked_at = new Date().toISOString();
  return checks;
}
function uniqueValues(values = []) { return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))]; }
function chunks(values = [], size = 500) { const output = []; for (let i = 0; i < values.length; i += size) output.push(values.slice(i, i + size)); return output; }
async function limitedList(limiter, label, run) { return limiter ? await limiter.list(run, label) : await run(); }
async function filterInChunks(base44, limiter, entityName, field, values, extraQuery = {}) {
  const output = [];
  for (const chunk of chunks(uniqueValues(values), 500)) {
    const page = await limitedList(limiter, `${entityName}.filter`, () => base44.asServiceRole.entities[entityName].filter({ ...extraQuery, [field]: { $in: chunk } }, { limit: chunk.length }));
    output.push(...rowsFrom(page));
  }
  return output;
}

function isPresent(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return value !== undefined && value !== null && String(value).trim() !== '';
}

const BOOK_MERGE_SKIP_FIELDS = new Set(['id', 'created_date', 'updated_date', 'created_by', 'created_by_id', 'is_sample', 'merged', 'merged_into', 'merged_at']);

function fillCanonicalFromDuplicates(canonical, duplicates) {
  const update = { id: canonical.id };
  for (const book of duplicates) {
    for (const [key, value] of Object.entries(book)) {
      if (BOOK_MERGE_SKIP_FIELDS.has(key)) continue;
      if (!isPresent(canonical[key]) && isPresent(value)) {
        canonical[key] = value;
        update[key] = value;
      }
    }
  }
  return Object.keys(update).length > 1 ? update : null;
}

function chooseCanonicalBook(group, offersByBook) {
  return [...group].sort((a, b) => {
    const aHasOffer = (offersByBook.get(a.id) || []).some(offer => offer.merged !== true);
    const bHasOffer = (offersByBook.get(b.id) || []).some(offer => offer.merged !== true);
    if (aHasOffer !== bHasOffer) return bHasOffer ? 1 : -1;
    return String(a.created_date || a.updated_date || '').localeCompare(String(b.created_date || b.updated_date || ''));
  })[0];
}

function duplicateComponents(duplicateBooks) {
  const groups = [...duplicateBooks.product_identifier, ...duplicateBooks.isbn13].map(([, group]) => group);
  const byId = new Map();
  const parent = new Map();
  const find = (id) => {
    if (parent.get(id) !== id) parent.set(id, find(parent.get(id)));
    return parent.get(id);
  };
  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootB, rootA);
  };
  for (const group of groups) {
    for (const book of group) {
      byId.set(book.id, book);
      if (!parent.has(book.id)) parent.set(book.id, book.id);
    }
    for (let i = 1; i < group.length; i += 1) union(group[0].id, group[i].id);
  }
  const components = new Map();
  for (const book of byId.values()) {
    const root = find(book.id);
    if (!components.has(root)) components.set(root, []);
    components.get(root).push(book);
  }
  return [...components.values()].filter(group => group.length > 1);
}

function uniqueUpdatesById(updates) {
  return [...new Map(updates.map(update => [update.id, update])).values()];
}

function newestOffer(offers = []) {
  return [...offers].sort((a, b) => String(b.last_updated || b.updated_date || b.created_date || '').localeCompare(String(a.last_updated || a.updated_date || a.created_date || '')))[0] || null;
}

async function applyBulkUpdate(entity, updates, limiter, label) {
  for (let i = 0; i < updates.length; i += 500) {
    await limiter.write(() => entity.bulkUpdate(updates.slice(i, i + 500)), label);
  }
}

async function ensureRuns(base44, limiter = null) {
  const existing = rowsFrom(await limitedList(limiter, 'ImportRun.filter', () => base44.asServiceRole.entities.ImportRun.filter({}, { sort: 'feed_order', limit: 20 })));
  const byFeed = new Map(existing.map(run => [run.feed_id, run]));
  const missing = FEEDS.filter(feed => !byFeed.has(feed.feed_id)).map(feed => ({ ...feed, checkpoint_line: 0, status: 'pending', lines_processed: 0, books_created: 0, books_updated: 0, offers_created: 0, offers_updated: 0, rows_rejected: 0, errors: 0, checks_json: emptyChecks() }));
  if (missing.length) await base44.asServiceRole.entities.ImportRun.bulkCreate(missing);
  return rowsFrom(await limitedList(limiter, 'ImportRun.filter', () => base44.asServiceRole.entities.ImportRun.filter({}, { sort: 'feed_order', limit: 20 }))).filter(run => FEEDS.some(feed => feed.feed_id === run.feed_id));
}

async function resolveFeed(feedUrl, token, feedId) {
  const { rows } = await listAwinFeedRows(feedUrl, token, { timeoutMs: 90000 });
  const selected = findCulturaFeedById(rows, feedId);
  if (!selected) throw new Error(`Flux Cultura ${feedId} introuvable dans la liste Awin`);
  return selected;
}

async function runControls(base44, batchStats = {}, limiter = null) {
  const books = await fetchAll(base44.asServiceRole.entities.Books, {}, { sort: '-updated_date', maxPages: 80, limiter, label: 'Books.filter' });
  const offers = await fetchAll(base44.asServiceRole.entities.BookOffers, {}, { sort: '-updated_date', maxPages: 80, limiter, label: 'BookOffers.filter' });
  return buildGlobalChecks(books, offers, batchStats);
}

function statusPayload(runs, checks) {
  const expectedTotal = FEEDS.reduce((total, feed) => total + feed.expected_lines, 0);
  const processedTotal = sum(runs, 'lines_processed');
  const next = runs.find(run => run.status === 'running') || runs.find((run, index) => run.status === 'pending' && (index === 0 || runs[index - 1]?.status === 'completed')) || null;
  return {
    ok: true,
    runs,
    totals: {
      lines_processed: processedTotal,
      books_created: sum(runs, 'books_created'),
      books_updated: sum(runs, 'books_updated'),
      offers_created: sum(runs, 'offers_created'),
      offers_updated: sum(runs, 'offers_updated'),
      rows_rejected: sum(runs, 'rows_rejected'),
      errors: sum(runs, 'errors'),
    },
    next_feed: next ? { feed_id: next.feed_id, feed_name: next.feed_name, feed_order: next.feed_order, status: next.status } : null,
    progress_percent: expectedTotal ? Math.round((processedTotal / expectedTotal) * 10000) / 100 : 0,
    last_checks: checks || runs.find(run => run.checks_json)?.checks_json || null,
    no_secret_or_datafeed_url_exposed: true,
  };
}

async function handleStart(base44, limiter) {
  const runs = await ensureRuns(base44, limiter);
  const now = new Date().toISOString();
  const firstRunnable = runs.find((run, index) => ['pending', 'paused'].includes(run.status) && (index === 0 || runs[index - 1]?.status === 'completed'));
  if (firstRunnable) await base44.asServiceRole.entities.ImportRun.update(firstRunnable.id, { status: 'running', paused_reason: '', started_at: firstRunnable.started_at || now, last_batch_at: now });
  return statusPayload(await ensureRuns(base44, limiter), null);
}

async function handleResume(base44, limiter) {
  const runs = await ensureRuns(base44, limiter);
  const now = new Date().toISOString();
  const paused = runs.find(run => run.status === 'paused');
  if (!paused) return { ok: true, resumed: false, reason: 'Aucun flux paused à reprendre', ...(await handleStatus(base44, limiter)) };
  await base44.asServiceRole.entities.ImportRun.update(paused.id, { status: 'running', paused_reason: '', last_batch_at: now, finished_at: null });
  return { ok: true, resumed: true, feed_id: paused.feed_id, feed_name: paused.feed_name, checkpoint_line: Number(paused.checkpoint_line || 0), ...(await handleStatus(base44, limiter)) };
}

async function handlePause(base44, reason, limiter) {
  const runs = await ensureRuns(base44, limiter);
  const now = new Date().toISOString();
  const updates = runs.filter(run => run.status === 'running').map(run => ({ id: run.id, status: 'paused', paused_reason: reason || 'Pause manuelle', last_batch_at: now }));
  if (updates.length) await base44.asServiceRole.entities.ImportRun.bulkUpdate(updates);
  return statusPayload(await ensureRuns(base44, limiter), null);
}

async function handleStatus(base44, limiter) {
  const runs = await ensureRuns(base44, limiter);
  return statusPayload(runs, null);
}

async function handleChecks(base44, limiter) {
  const checks = await runControls(base44, { lines: 1 }, limiter);
  const runs = await ensureRuns(base44, limiter);
  const target = runs.find(run => run.status === 'running') || runs.find(run => run.status === 'paused') || runs[0];
  if (target) await base44.asServiceRole.entities.ImportRun.update(target.id, { checks_json: checks });
  return statusPayload(await ensureRuns(base44, limiter), checks);
}

async function currentRunForStep(base44, limiter) {
  const runs = await ensureRuns(base44, limiter);
  const running = runs.find(run => run.status === 'running');
  if (running) return running;
  const hasStarted = runs.some(run => ['running', 'paused', 'completed', 'failed'].includes(run.status));
  if (!hasStarted) return null;
  const nextPending = runs.find((run, index) => run.status === 'pending' && index > 0 && runs[index - 1]?.status === 'completed');
  if (!nextPending) return null;
  const now = new Date().toISOString();
  await base44.asServiceRole.entities.ImportRun.update(nextPending.id, { status: 'running', started_at: nextPending.started_at || now, paused_reason: '', last_batch_at: now });
  return { ...nextPending, status: 'running' };
}

async function activeImportLogs(base44, limiter, feedId) {
  const page = await limitedList(limiter, 'ImportLog.filter', () => base44.asServiceRole.entities.ImportLog.filter({ source_retailer: AWIN_RETAILER, status: 'running' }, { sort: '-started_at', limit: 10 }));
  const cutoff = Date.now() - 8 * 60 * 1000;
  return rowsFrom(page).filter(log => String(log.feed_id || '') === String(feedId || '') && Date.parse(log.started_at || log.created_date || '') >= cutoff);
}

async function pauseAfterRateLimit(base44, run, log, stats, error, confirmedLine, limiter) {
  const now = new Date().toISOString();
  const message = `Pause rate limit: ${error.message || error}`;
  await base44.asServiceRole.entities.ImportLog.update(log.id, { finished_at: now, status: 'partial', errors: 1, error_message: message, line_checkpoint: confirmedLine, control_report: { rate_limited: true, limiter: limiter.metrics(), checkpoint_preserved: true } });
  await base44.asServiceRole.entities.ImportRun.update(run.id, { status: 'paused', errors: Number(run.errors || 0) + 1, paused_reason: message, last_batch_at: now, checkpoint_line: confirmedLine });
  return { ok: false, action: 'step', paused: true, rate_limited: true, checkpoint_line: confirmedLine, stats, limiter: limiter.metrics(), no_deletion: true, no_secret_or_datafeed_url_exposed: true };
}

async function handleStep(base44, batchSize, limiter) {
  const size = Math.max(1, Math.min(Number(batchSize || 500), 2000));
  const run = await currentRunForStep(base44, limiter);
  if (!run) return { ok: true, idle: true, reason: 'Aucun flux running, ou import non démarré', ...(await handleStatus(base44, limiter)) };
  const meta = feedMeta(run.feed_id);
  if (!meta) return Response.json({ error: 'Flux non autorisé' }, { status: 400 });

  const concurrent = await activeImportLogs(base44, limiter, run.feed_id);
  if (concurrent.length) return { ok: false, busy: true, paused: true, reason: 'Un traitement récent est déjà en cours pour ce flux', simultaneous_treatments: concurrent.length, checkpoint_line: Number(run.checkpoint_line || 0), limiter: limiter.metrics() };

  const feedUrl = readSecret('AWIN_CULTURA_FEED_URL') || readSecret('AWIN_FEED_URL');
  const token = readSecret('AWIN_API_TOKEN');
  if (!feedUrl || !token) throw new Error('Secrets Awin manquants');

  const startedAt = new Date().toISOString();
  const selectedFeed = await resolveFeed(feedUrl, token, run.feed_id);
  const resolved = await resolveAwinFeedRow(feedUrl, selectedFeed, token, { timeoutMs: 240000 });
  const confirmedStartLine = Number(run.checkpoint_line || 0);
  const stats = emptyImportStats(confirmedStartLine);
  const rejectionReasons = emptyRejectionReasons();
  const rejections = [];
  const examples = [];
  const seenInLot = new Set();
  const rawQuality = { missing_price: 0, missing_image: 0, missing_merchant_url: 0 };
  let batch = [];
  let scanned = 0;
  let lastLine = confirmedStartLine;
  let confirmedLine = confirmedStartLine;
  let reachedEnd = true;
  let writeDiagnostics = { touched_book_ids: [], product_identifiers: [], isbn13s: [] };

  const log = await base44.asServiceRole.entities.ImportLog.create({
    started_at: startedAt,
    import_mode: 'feed',
    feed_id: run.feed_id,
    feed_name: run.feed_name,
    products_processed: 0,
    rows_rejected: 0,
    books_created: 0,
    books_updated: 0,
    offers_created: 0,
    offers_updated: 0,
    duplicates: 0,
    duplicates_in_feed: 0,
    duplicates_cross_feed: 0,
    errors: 0,
    status: 'running',
    source_retailer: AWIN_RETAILER,
    resume_from_line: confirmedStartLine,
    test_limit: size,
  });

  try {
    for await (const { row, lineNumber } of csvRowsFromAwinStream(resolved.stream, resolved.gzip.is_gzip)) {
      if (lineNumber <= confirmedStartLine) continue;
      if (scanned >= size) { reachedEnd = false; break; }
      scanned += 1;
      stats.productsProcessed += 1;
      stats.lineCheckpoint = lineNumber;
      lastLine = lineNumber;
      if (!parsePrice(row.search_price)) rawQuality.missing_price += 1;
      if (!safeUrl(row.merchant_image_url || row.aw_image_url || '')) rawQuality.missing_image += 1;
      if (!safeUrl(row.merchant_deep_link || '')) rawQuality.missing_merchant_url += 1;
      const record = productToCatalogRecord(row, startedAt, selectedFeed, { allowNonIsbnEditorial: true });
      if (record.error) {
        stats.rowsRejected += 1;
        rejectionReasons[record.error] = (rejectionReasons[record.error] || 0) + 1;
        if (record.rejection) rejections.push(record.rejection);
        continue;
      }
      const duplicateKey = record.product_identifier || cleanEan(record.ean || '');
      if (seenInLot.has(duplicateKey)) { stats.duplicatesInFeed += 1; continue; }
      seenInLot.add(duplicateKey);
      batch.push(record);
    }

    if (batch.length) {
      const result = await upsertBatch(base44, batch, examples, 10, { limiter });
      stats.booksCreated += result.booksCreated;
      stats.booksUpdated += result.booksUpdated;
      stats.offersCreated += result.offersCreated;
      stats.offersUpdated += result.offersUpdated;
      writeDiagnostics = result.diagnostics || writeDiagnostics;
    }
    await recordImportRejections(base44, rejections);
    confirmedLine = lastLine;
  } catch (error) {
    stats.errors += 1;
    if (isRateLimitError(error)) return await pauseAfterRateLimit(base44, run, log, stats, error, confirmedLine, limiter);
    await base44.asServiceRole.entities.ImportLog.update(log.id, { finished_at: new Date().toISOString(), status: 'failed', errors: 1, error_message: error.message, line_checkpoint: confirmedLine });
    await base44.asServiceRole.entities.ImportRun.update(run.id, { status: 'failed', errors: Number(run.errors || 0) + 1, paused_reason: error.message, last_batch_at: new Date().toISOString(), checkpoint_line: confirmedLine });
    throw error;
  }

  const completed = reachedEnd && scanned < size;
  const previousLines = Number(run.lines_processed || 0);
  const nextLines = previousLines + scanned;
  const globalCheckWindow = Math.max(1, size) * 5;
  const shouldRunGlobalChecks = completed || previousLines === 0 || Math.floor(previousLines / globalCheckWindow) !== Math.floor(nextLines / globalCheckWindow);
  let checks = run.checks_json && run.checks_json.scan_scope === 'global' ? run.checks_json : emptyChecks();
  try {
    if (shouldRunGlobalChecks) checks = await runControls(base44, { lines: scanned, rows_rejected: stats.rowsRejected, errors: stats.errors, ...rawQuality }, limiter);
  } catch (error) {
    if (isRateLimitError(error)) return await pauseAfterRateLimit(base44, run, log, stats, error, confirmedLine, limiter);
    throw error;
  }

  const now = new Date().toISOString();
  const paused = shouldRunGlobalChecks && !checks.ok;
  const nextStatus = paused ? 'paused' : (completed ? 'completed' : 'running');
  const pausedReason = paused ? `Contrôle global échoué: ${checks.failed.join(', ')}` : '';
  const diagnostics = { limiter: limiter.metrics(), global_checks_ran: shouldRunGlobalChecks, entity_list_requests_per_lot: limiter.metrics().list_requests, average_list_reads_per_book: batch.length ? Math.round((limiter.metrics().list_requests / batch.length) * 1000) / 1000 : 0, list_reads_per_minute: limiter.metrics().list_requests_per_minute, simultaneous_treatments: 1, rate_limit_retries: limiter.metrics().rate_limit_retries, checkpoint_start: confirmedStartLine, checkpoint_confirmed: confirmedLine, written_before_interruption: stats.booksCreated + stats.booksUpdated + stats.offersCreated + stats.offersUpdated, write_diagnostics: writeDiagnostics };

  await base44.asServiceRole.entities.ImportLog.update(log.id, {
    finished_at: now,
    products_processed: stats.productsProcessed,
    rows_rejected: stats.rowsRejected,
    books_created: stats.booksCreated,
    books_updated: stats.booksUpdated,
    offers_created: stats.offersCreated,
    offers_updated: stats.offersUpdated,
    duplicates: stats.duplicatesInFeed + stats.duplicatesCrossFeed,
    duplicates_in_feed: stats.duplicatesInFeed,
    duplicates_cross_feed: stats.duplicatesCrossFeed,
    errors: stats.errors,
    line_checkpoint: confirmedLine,
    status: paused ? 'partial' : 'success',
    control_report: { checks, diagnostics, rejection_reasons: rejectionReasons, examples_written: examples, no_deletion: true, no_secret_or_datafeed_url_exposed: true },
  });

  await base44.asServiceRole.entities.ImportRun.update(run.id, {
    checkpoint_line: confirmedLine,
    status: nextStatus,
    lines_processed: Number(run.lines_processed || 0) + scanned,
    books_created: Number(run.books_created || 0) + stats.booksCreated,
    books_updated: Number(run.books_updated || 0) + stats.booksUpdated,
    offers_created: Number(run.offers_created || 0) + stats.offersCreated,
    offers_updated: Number(run.offers_updated || 0) + stats.offersUpdated,
    rows_rejected: Number(run.rows_rejected || 0) + stats.rowsRejected,
    errors: Number(run.errors || 0) + stats.errors,
    checks_json: shouldRunGlobalChecks ? { ...checks, diagnostics } : run.checks_json,
    paused_reason: pausedReason,
    last_batch_at: now,
    finished_at: completed ? now : run.finished_at,
  });

  return { ok: checks.ok, action: 'step', feed_id: run.feed_id, feed_name: run.feed_name, scanned_lines: scanned, checkpoint_line: confirmedLine, completed, paused, paused_reason: pausedReason, stats, rejection_reasons: rejectionReasons, checks, diagnostics, examples_written: examples, no_deletion: true, no_secret_or_datafeed_url_exposed: true };
}

async function handleDedupe(base44, limit, limiter) {
  const startedAt = new Date().toISOString();
  const maxGroups = Math.max(1, Math.min(Number(limit || 500), 500));
  const books = await fetchAll(base44.asServiceRole.entities.Books, {}, { sort: 'created_date', maxPages: 80, limiter, label: 'Books.filter' });
  const offers = await fetchAll(base44.asServiceRole.entities.BookOffers, {}, { sort: 'created_date', maxPages: 80, limiter, label: 'BookOffers.filter' });
  const relations = buildCatalogRelations(books, offers);
  const duplicateBooks = duplicateBookGroups(books);
  const components = duplicateComponents(duplicateBooks).slice(0, maxGroups);
  const now = new Date().toISOString();
  const simulatedBooks = books.map(book => ({ ...book }));
  const simulatedOffers = offers.map(offer => ({ ...offer }));
  const simulatedBookById = new Map(simulatedBooks.map(book => [book.id, book]));
  const bookUpdates = [];
  const canonicalUpdates = [];
  const offerReassignments = [];

  for (const component of components) {
    const activeGroup = component.map(book => simulatedBookById.get(book.id)).filter(book => book && book.merged !== true);
    if (activeGroup.length < 2) continue;
    const canonical = chooseCanonicalBook(activeGroup, relations.offersByBook);
    const duplicateRecords = activeGroup.filter(book => book.id !== canonical.id);
    const canonicalUpdate = fillCanonicalFromDuplicates(canonical, duplicateRecords);
    if (canonicalUpdate) canonicalUpdates.push(canonicalUpdate);
    for (const book of duplicateRecords) {
      const bookOffers = simulatedOffers.filter(offer => offer.book_id === book.id && offer.merged !== true);
      for (const offer of bookOffers) {
        offer.book_id = canonical.id;
        offerReassignments.push({ id: offer.id, book_id: canonical.id });
      }
      book.merged = true;
      book.merged_into = canonical.id;
      book.merged_at = now;
      bookUpdates.push({ id: book.id, merged: true, merged_into: canonical.id, merged_at: now });
    }
  }

  const afterReassignRelations = buildCatalogRelations(simulatedBooks, simulatedOffers);
  const offerMergeUpdates = [];
  for (const group of afterReassignRelations.duplicateOfferGroups) {
    if (!group.offers.some(offer => offer.retailer_name === AWIN_RETAILER)) continue;
    const keep = newestOffer(group.offers);
    for (const offer of group.offers) {
      if (!keep || offer.id === keep.id) continue;
      offer.merged = true;
      offer.merged_into = keep.id;
      offer.merged_at = now;
      offerMergeUpdates.push({ id: offer.id, merged: true, merged_into: keep.id, merged_at: now });
    }
  }

  const finalOfferReassignments = uniqueUpdatesById(offerReassignments);
  const finalCanonicalUpdates = uniqueUpdatesById(canonicalUpdates);
  const finalBookUpdates = uniqueUpdatesById(bookUpdates);
  const finalOfferMergeUpdates = uniqueUpdatesById(offerMergeUpdates);

  if (finalOfferReassignments.length) await applyBulkUpdate(base44.asServiceRole.entities.BookOffers, finalOfferReassignments, limiter, 'BookOffers.bulkUpdate');
  if (finalCanonicalUpdates.length) await applyBulkUpdate(base44.asServiceRole.entities.Books, finalCanonicalUpdates, limiter, 'Books.bulkUpdate');
  if (finalBookUpdates.length) await applyBulkUpdate(base44.asServiceRole.entities.Books, finalBookUpdates, limiter, 'Books.bulkUpdate');
  if (finalOfferMergeUpdates.length) await applyBulkUpdate(base44.asServiceRole.entities.BookOffers, finalOfferMergeUpdates, limiter, 'BookOffers.bulkUpdate');

  const checks = buildGlobalChecks(simulatedBooks, simulatedOffers, { lines: 1 });
  const runs = await ensureRuns(base44, limiter);
  const target = runs.find(run => run.status === 'running') || runs.find(run => run.status === 'paused') || runs[0];
  if (target) await base44.asServiceRole.entities.ImportRun.update(target.id, { checks_json: { ...checks, diagnostics: { limiter: limiter.metrics(), dedupe_checked_at: now } } });
  await base44.asServiceRole.entities.ImportLog.create({
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    import_mode: 'execution',
    feed_id: 'dedupe',
    feed_name: 'Dédoublonnage catalogue',
    products_processed: components.length,
    rows_rejected: 0,
    books_created: 0,
    books_updated: finalCanonicalUpdates.length + finalBookUpdates.length,
    offers_created: 0,
    offers_updated: finalOfferReassignments.length + finalOfferMergeUpdates.length,
    duplicates: components.length,
    errors: 0,
    status: checks.ok ? 'success' : 'partial',
    source_retailer: AWIN_RETAILER,
    control_report: { checks, groups_processed: components.length, offers_reassigned: finalOfferReassignments.length, books_marked_merged: finalBookUpdates.length, canonical_books_completed: finalCanonicalUpdates.length, duplicate_offers_marked_merged: finalOfferMergeUpdates.length, no_deletion: true, no_secret_or_datafeed_url_exposed: true },
  });

  return { ok: checks.ok, action: 'dedupe', limit: maxGroups, groups_processed: components.length, offers_reassigned: finalOfferReassignments.length, books_marked_merged: finalBookUpdates.length, canonical_books_completed: finalCanonicalUpdates.length, duplicate_offers_marked_merged: finalOfferMergeUpdates.length, checks, limiter: limiter.metrics(), no_deletion: true, no_secret_or_datafeed_url_exposed: true };
}

async function handleDailySkeleton(base44, limiter) {
  const runs = await ensureRuns(base44, limiter);
  return { ok: true, action: 'daily_sync_skeleton', ready: true, active: false, feeds: FEEDS, runs, behavior: 'Marquage missing_since prévu sans suppression lors de l’activation de la synchronisation quotidienne.' };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'status').trim();
    const limiter = createEntityRateLimiter({ listPerMinute: 105, writePerMinute: 38, maxAttempts: 4 });
    await ensureRuns(base44, limiter);
    if (action === 'start') return Response.json(await handleStart(base44, limiter));
    if (action === 'resume') return Response.json(await handleResume(base44, limiter));
    if (action === 'pause') return Response.json(await handlePause(base44, String(body.reason || '').trim(), limiter));
    if (action === 'status') return Response.json({ ...(await handleStatus(base44, limiter)), diagnostics: { limiter: limiter.metrics() } });
    if (action === 'checks') return Response.json({ ...(await handleChecks(base44, limiter)), diagnostics: { limiter: limiter.metrics() } });
    if (action === 'step') return Response.json(await handleStep(base44, body.batch_size, limiter));
    if (action === 'dedupe') return Response.json(await handleDedupe(base44, body.limit, limiter));
    if (action === 'daily_sync_skeleton') return Response.json(await handleDailySkeleton(base44, limiter));
    return Response.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    const status = isRateLimitError(error) ? 429 : 500;
    return Response.json({ error: error.message, rate_limited: isRateLimitError(error), retryable: isRateLimitError(error) }, { status });
  }
}