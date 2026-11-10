import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { cleanEan, listAwinFeedRows, parsePrice, resolveAwinFeedRow, safeUrl } from '../../shared/catalogUtils.ts';
import { AWIN_RETAILER, csvRowsFromAwinStream, emptyImportStats, emptyRejectionReasons, findCulturaFeedById, productToCatalogRecord, recordImportRejections, upsertBatch } from '../../shared/awinImportCore.ts';
import { buildCatalogRelations, duplicateBookGroups, fetchAll } from '../../shared/catalogAuditUtils.ts';

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

async function ensureRuns(base44) {
  const existing = rowsFrom(await base44.asServiceRole.entities.ImportRun.filter({}, { sort: 'feed_order', limit: 20 }));
  const byFeed = new Map(existing.map(run => [run.feed_id, run]));
  const missing = FEEDS.filter(feed => !byFeed.has(feed.feed_id)).map(feed => ({ ...feed, checkpoint_line: 0, status: 'pending', lines_processed: 0, books_created: 0, books_updated: 0, offers_created: 0, offers_updated: 0, rows_rejected: 0, errors: 0, checks_json: emptyChecks() }));
  if (missing.length) await base44.asServiceRole.entities.ImportRun.bulkCreate(missing);
  return rowsFrom(await base44.asServiceRole.entities.ImportRun.filter({}, { sort: 'feed_order', limit: 20 })).filter(run => FEEDS.some(feed => feed.feed_id === run.feed_id));
}

async function resolveFeed(feedUrl, token, feedId) {
  const { rows } = await listAwinFeedRows(feedUrl, token, { timeoutMs: 90000 });
  const selected = findCulturaFeedById(rows, feedId);
  if (!selected) throw new Error(`Flux Cultura ${feedId} introuvable dans la liste Awin`);
  return selected;
}

async function runControls(base44, batchStats = {}) {
  const checks = emptyChecks();
  const [books, offers] = await Promise.all([
    fetchAll(base44.asServiceRole.entities.Books, {}, { sort: '-updated_date', maxPages: 160 }),
    fetchAll(base44.asServiceRole.entities.BookOffers, {}, { sort: '-updated_date', maxPages: 160 }),
  ]);
  const relations = buildCatalogRelations(books, offers);
  const duplicates = duplicateBookGroups(books);
  const batchLines = Math.max(1, Number(batchStats.lines || 0));
  const missingPriceRate = Number(batchStats.missing_price || 0) / batchLines;
  const missingImageRate = Number(batchStats.missing_image || 0) / batchLines;
  const missingMerchantUrlRate = Number(batchStats.missing_merchant_url || 0) / batchLines;
  const rejectionRate = Number(batchStats.rows_rejected || 0) / batchLines;

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

async function handleStart(base44) {
  const runs = await ensureRuns(base44);
  const now = new Date().toISOString();
  const firstRunnable = runs.find((run, index) => ['pending', 'paused'].includes(run.status) && (index === 0 || runs[index - 1]?.status === 'completed'));
  if (firstRunnable) await base44.asServiceRole.entities.ImportRun.update(firstRunnable.id, { status: 'running', paused_reason: '', started_at: firstRunnable.started_at || now, last_batch_at: now });
  return statusPayload(await ensureRuns(base44), null);
}

async function handlePause(base44, reason) {
  const runs = await ensureRuns(base44);
  const now = new Date().toISOString();
  const updates = runs.filter(run => run.status === 'running').map(run => ({ id: run.id, status: 'paused', paused_reason: reason || 'Pause manuelle', last_batch_at: now }));
  if (updates.length) await base44.asServiceRole.entities.ImportRun.bulkUpdate(updates);
  return statusPayload(await ensureRuns(base44), null);
}

async function handleStatus(base44) {
  const runs = await ensureRuns(base44);
  return statusPayload(runs, null);
}

async function handleChecks(base44) {
  const checks = await runControls(base44, { lines: 1 });
  const runs = await ensureRuns(base44);
  const target = runs.find(run => run.status === 'running') || runs.find(run => run.status === 'paused') || runs[0];
  if (target) await base44.asServiceRole.entities.ImportRun.update(target.id, { checks_json: checks });
  return statusPayload(await ensureRuns(base44), checks);
}

async function currentRunForStep(base44) {
  const runs = await ensureRuns(base44);
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

async function handleStep(base44, batchSize) {
  const size = Math.max(1, Math.min(Number(batchSize || 500), 2000));
  const run = await currentRunForStep(base44);
  if (!run) return { ok: true, idle: true, reason: 'Aucun flux running, ou import non démarré', ...(await handleStatus(base44)) };
  const meta = feedMeta(run.feed_id);
  if (!meta) return Response.json({ error: 'Flux non autorisé' }, { status: 400 });

  const feedUrl = readSecret('AWIN_CULTURA_FEED_URL') || readSecret('AWIN_FEED_URL');
  const token = readSecret('AWIN_API_TOKEN');
  if (!feedUrl || !token) throw new Error('Secrets Awin manquants');

  const startedAt = new Date().toISOString();
  const selectedFeed = await resolveFeed(feedUrl, token, run.feed_id);
  const resolved = await resolveAwinFeedRow(feedUrl, selectedFeed, token, { timeoutMs: 240000 });
  const stats = emptyImportStats(Number(run.checkpoint_line || 0));
  const rejectionReasons = emptyRejectionReasons();
  const rejections = [];
  const examples = [];
  const seenInLot = new Set();
  const rawQuality = { missing_price: 0, missing_image: 0, missing_merchant_url: 0 };
  let batch = [];
  let scanned = 0;
  let lastLine = Number(run.checkpoint_line || 0);
  let reachedEnd = true;

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
    resume_from_line: Number(run.checkpoint_line || 0),
    test_limit: size,
  });

  try {
    for await (const { row, lineNumber } of csvRowsFromAwinStream(resolved.stream, resolved.gzip.is_gzip)) {
      if (lineNumber <= Number(run.checkpoint_line || 0)) continue;
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
      const result = await upsertBatch(base44, batch, examples, 10);
      stats.booksCreated += result.booksCreated;
      stats.booksUpdated += result.booksUpdated;
      stats.offersCreated += result.offersCreated;
      stats.offersUpdated += result.offersUpdated;
    }
    await recordImportRejections(base44, rejections);
  } catch (error) {
    stats.errors += 1;
    await base44.asServiceRole.entities.ImportLog.update(log.id, { finished_at: new Date().toISOString(), status: 'failed', errors: 1, error_message: error.message, line_checkpoint: lastLine });
    await base44.asServiceRole.entities.ImportRun.update(run.id, { status: 'failed', errors: Number(run.errors || 0) + 1, paused_reason: error.message, last_batch_at: new Date().toISOString(), checkpoint_line: lastLine });
    throw error;
  }

  const checks = await runControls(base44, { lines: scanned, rows_rejected: stats.rowsRejected, errors: stats.errors, ...rawQuality });
  const now = new Date().toISOString();
  const paused = !checks.ok;
  const completed = reachedEnd && scanned < size;
  const nextStatus = paused ? 'paused' : (completed ? 'completed' : 'running');
  const pausedReason = paused ? `Contrôle échoué: ${checks.failed.join(', ')}` : '';

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
    line_checkpoint: lastLine,
    status: paused ? 'partial' : (completed ? 'success' : 'running'),
    control_report: { checks, rejection_reasons: rejectionReasons, examples_written: examples, no_deletion: true, no_secret_or_datafeed_url_exposed: true },
  });

  await base44.asServiceRole.entities.ImportRun.update(run.id, {
    checkpoint_line: lastLine,
    status: nextStatus,
    lines_processed: Number(run.lines_processed || 0) + scanned,
    books_created: Number(run.books_created || 0) + stats.booksCreated,
    books_updated: Number(run.books_updated || 0) + stats.booksUpdated,
    offers_created: Number(run.offers_created || 0) + stats.offersCreated,
    offers_updated: Number(run.offers_updated || 0) + stats.offersUpdated,
    rows_rejected: Number(run.rows_rejected || 0) + stats.rowsRejected,
    errors: Number(run.errors || 0) + stats.errors,
    checks_json: checks,
    paused_reason: pausedReason,
    last_batch_at: now,
    finished_at: completed ? now : run.finished_at,
  });

  return { ok: checks.ok, action: 'step', feed_id: run.feed_id, feed_name: run.feed_name, scanned_lines: scanned, checkpoint_line: lastLine, completed, paused, paused_reason: pausedReason, stats, rejection_reasons: rejectionReasons, checks, examples_written: examples, no_deletion: true, no_secret_or_datafeed_url_exposed: true };
}

async function handleDailySkeleton(base44) {
  const runs = await ensureRuns(base44);
  return { ok: true, action: 'daily_sync_skeleton', ready: true, active: false, feeds: FEEDS, runs, behavior: 'Marquage missing_since prévu sans suppression lors de l’activation de la synchronisation quotidienne.' };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'status').trim();
    await ensureRuns(base44);
    if (action === 'start') return Response.json(await handleStart(base44));
    if (action === 'pause') return Response.json(await handlePause(base44, String(body.reason || '').trim()));
    if (action === 'status') return Response.json(await handleStatus(base44));
    if (action === 'checks') return Response.json(await handleChecks(base44));
    if (action === 'step') return Response.json(await handleStep(base44, body.batch_size));
    if (action === 'daily_sync_skeleton') return Response.json(await handleDailySkeleton(base44));
    return Response.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}