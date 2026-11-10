import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { cleanEan, listAwinFeedRows, normalizeText, resolveAwinFeedRow, tokenizeTitle } from '../../shared/catalogUtils.ts';
import { AWIN_MAX_TEST_LIMIT, AWIN_RETAILER, AWIN_ROMAN_FEED_ID, csvRowsFromAwinStream, emptyImportStats, emptyRejectionReasons, findCulturaFeedById, productToCatalogRecord, recordImportRejections, upsertBatch, writeImportProgress } from '../../shared/awinImportCore.ts';
import { fetchAll } from '../../shared/catalogAuditUtils.ts';

function readSecret(name) { try { return secrets.get(name) || ''; } catch { return ''; } }
function pageItems(page) { return page.items || page || []; }
function bump(map, key, amount = 1) { map[key] = (map[key] || 0) + amount; }
function rejectionKey(rejection = {}) {
  const fromIdentifier = String(rejection.product_identifier || '').replace(/^EAN:/, '').split(':')[0];
  return cleanEan(fromIdentifier || rejection.ean_raw || '');
}

async function backfillTokens(base44, limit) {
  const romanQuery = { $or: [{ source_feed_id: AWIN_ROMAN_FEED_ID }, { category: 'Roman' }, { category_norm: 'roman' }] };
  const romanPage = await base44.asServiceRole.entities.Books.filter(romanQuery, { sort: 'title_norm', limit: Math.min(limit, AWIN_MAX_TEST_LIMIT) });
  const books = pageItems(romanPage);
  const updates = books.map(book => ({
    id: book.id,
    title_norm: normalizeText(book.title || ''),
    title_tokens: tokenizeTitle(book.title || ''),
  }));
  for (let i = 0; i < updates.length; i += 500) {
    await base44.asServiceRole.entities.Books.bulkUpdate(updates.slice(i, i + 500));
  }
  const totalRoman = await base44.asServiceRole.entities.Books.count(romanQuery).catch(() => updates.length);
  const remaining = Math.max(0, totalRoman - updates.length);
  return { ok: true, action: 'backfill_tokens', processed: updates.length, remaining_to_process: remaining, books_created: 0, books_updated: updates.length, offers_created: 0, offers_updated: 0, touched_fields_only: ['title_norm', 'title_tokens'] };
}

async function reintegrateQuarantine(base44, limit, feedUrl, token) {
  const importedAt = new Date().toISOString();
  const candidates = pageItems(await base44.asServiceRole.entities.ImportRejection.filter({ reason: 'ean_not_isbn', reviewed: false }, { sort: 'created_date', limit }));
  const ignored = {};
  const grouped = new Map();

  for (const rejection of candidates) {
    const key = rejectionKey(rejection);
    if (!key) { bump(ignored, 'invalid_ean'); continue; }
    const feedId = String(rejection.feed_id || '').trim();
    if (!feedId) { bump(ignored, 'missing_feed_id'); continue; }
    const groupKey = `${feedId}|${key}`;
    if (!grouped.has(groupKey)) grouped.set(groupKey, { feedId, ean: key, rejections: [] });
    grouped.get(groupKey).rejections.push(rejection);
  }

  const { rows } = await listAwinFeedRows(feedUrl, token, { timeoutMs: 90000 });
  const groupsByFeed = new Map();
  for (const group of grouped.values()) {
    if (!groupsByFeed.has(group.feedId)) groupsByFeed.set(group.feedId, []);
    groupsByFeed.get(group.feedId).push(group);
  }

  const records = [];
  const reviewedIds = [];
  const matchedKeys = new Set();
  const rejectionReasons = emptyRejectionReasons();

  for (const [feedId, feedGroups] of groupsByFeed.entries()) {
    const selectedFeed = findCulturaFeedById(rows, feedId);
    if (!selectedFeed) { bump(ignored, 'feed_not_found', feedGroups.reduce((sum, group) => sum + group.rejections.length, 0)); continue; }
    const targets = new Map(feedGroups.map(group => [group.ean, group]));
    const resolved = await resolveAwinFeedRow(feedUrl, selectedFeed, token, { timeoutMs: 240000 });
    for await (const { row } of csvRowsFromAwinStream(resolved.stream, resolved.gzip.is_gzip)) {
      const ean = cleanEan(row.ean || '');
      if (!targets.has(ean) || matchedKeys.has(`${feedId}|${ean}`)) continue;
      const group = targets.get(ean);
      const record = productToCatalogRecord(row, importedAt, selectedFeed, { allowNonIsbnEditorial: true });
      if (record.error) {
        bump(ignored, record.error, group.rejections.length);
        rejectionReasons[record.error] = (rejectionReasons[record.error] || 0) + group.rejections.length;
      } else if (record.isbn_valid === true) {
        bump(ignored, 'now_valid_isbn', group.rejections.length);
      } else {
        records.push(record);
        reviewedIds.push(...group.rejections.map(rejection => rejection.id));
      }
      matchedKeys.add(`${feedId}|${ean}`);
      if (matchedKeys.size >= grouped.size) break;
    }
  }

  for (const group of grouped.values()) {
    if (!matchedKeys.has(`${group.feedId}|${group.ean}`)) bump(ignored, 'source_row_not_found', group.rejections.length);
  }

  const examples = [];
  const stats = records.length ? await upsertBatch(base44, records, examples, 10) : { booksCreated: 0, booksUpdated: 0, offersCreated: 0, offersUpdated: 0 };
  for (let i = 0; i < reviewedIds.length; i += 500) {
    await base44.asServiceRole.entities.ImportRejection.bulkUpdate(reviewedIds.slice(i, i + 500).map(id => ({ id, reviewed: true })));
  }

  return {
    ok: true,
    action: 'reintegrate_quarantine',
    limit,
    quarantine_rows_loaded: candidates.length,
    unique_eans_processed: records.length,
    books_created: stats.booksCreated,
    books_updated: stats.booksUpdated,
    offers_created: stats.offersCreated,
    offers_updated: stats.offersUpdated,
    quarantine_rows_reviewed: reviewedIds.length,
    ignored_total: Object.values(ignored).reduce((sum, value) => sum + value, 0),
    ignored_reasons: ignored,
    rejection_reasons: rejectionReasons,
    examples_written: examples,
  };
}

async function countIdentifierLinks(base44, productIdentifier) {
  const books = pageItems(await base44.asServiceRole.entities.Books.filter({ product_identifier: productIdentifier }, { limit: 100 }));
  const bookIds = books.map(book => book.id).filter(Boolean);
  const offers = bookIds.length ? pageItems(await base44.asServiceRole.entities.BookOffers.filter({ book_id: { $in: bookIds }, retailer_name: AWIN_RETAILER }, { limit: 200 })) : [];
  return { books_count: books.length, offers_count: offers.length };
}

async function existingProductIdentifierSet(base44) {
  const books = await fetchAll(base44.asServiceRole.entities.Books, {}, { sort: '-created_date', maxPages: 80 });
  return new Set(books.map(book => String(book.product_identifier || '').trim()).filter(Boolean));
}

async function findAbsentEanRecord(base44, feedUrl, token, selectedFeed, existingIdentifiers) {
  const resolved = await resolveAwinFeedRow(feedUrl, selectedFeed, token, { timeoutMs: 240000 });
  const importedAt = new Date().toISOString();
  for await (const { row } of csvRowsFromAwinStream(resolved.stream, resolved.gzip.is_gzip)) {
    const record = productToCatalogRecord(row, importedAt, selectedFeed, { allowNonIsbnEditorial: true });
    if (record.error || record.identifier_type !== 'ean' || record.isbn_valid !== false) continue;
    if (!existingIdentifiers.has(record.product_identifier)) return record;
  }
  return null;
}

async function runEanCounterStep(base44, label, record) {
  const before = await countIdentifierLinks(base44, record.product_identifier);
  const examples = [];
  const result = await upsertBatch(base44, [record], examples, 3);
  const after = await countIdentifierLinks(base44, record.product_identifier);
  return {
    label,
    product_identifier: record.product_identifier,
    raw_counters: result,
    before,
    after,
  };
}

async function eanCounterTest(base44, feedUrl, token, selectedFeed) {
  const existingIdentifiers = await existingProductIdentifierSet(base44);
  const record = await findAbsentEanRecord(base44, feedUrl, token, selectedFeed, existingIdentifiers);
  if (!record) return { ok: false, action: 'ean_counter_test', error: 'Aucun EAN inédit éligible trouvé dans le flux sélectionné' };
  const step1 = await runEanCounterStep(base44, 'step_1_new_ean_expected_1_create_0_update', record);
  const step2 = await runEanCounterStep(base44, 'step_2_same_ean_expected_0_create_1_update', record);
  const step3 = await runEanCounterStep(base44, 'step_3_existing_ean_with_offer_expected_0_create_1_update_1_offer', record);
  return {
    ok: true,
    action: 'ean_counter_test',
    feed_id: String(selectedFeed.feed_id || selectedFeed.data_feed_id || selectedFeed.fid || '').trim(),
    steps: [step1, step2, step3],
    no_deletion: true,
    no_secret_or_datafeed_url_exposed: true,
  };
}

export default async function(req) {
  const startedAt = new Date().toISOString();
  let log = null;
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '').trim();
    const mode = String(body.mode || 'test').trim();
    const limit = Number(body.limit || AWIN_MAX_TEST_LIMIT);
    const feedId = String(body.feed_id || AWIN_ROMAN_FEED_ID).trim();

    if (!Number.isFinite(limit) || limit < 1) return Response.json({ error: 'limit doit être compris entre 1 et 1000' }, { status: 400 });
    if (limit > AWIN_MAX_TEST_LIMIT) return Response.json({ error: 'limit supérieur à 1000 refusé' }, { status: 400 });
    if (action === 'backfill_tokens') return Response.json(await backfillTokens(base44, limit));
    if (mode === 'full') return Response.json({ error: 'Mode full refusé pour cette fonction temporaire' }, { status: 400 });
    if (!feedId && action !== 'reintegrate_quarantine') return Response.json({ error: 'feed_id requis' }, { status: 400 });

    const feedUrl = readSecret('AWIN_CULTURA_FEED_URL') || readSecret('AWIN_FEED_URL');
    const token = readSecret('AWIN_API_TOKEN');
    if (!feedUrl || !token) return Response.json({ error: 'Secrets Awin manquants' }, { status: 500 });
    if (action === 'reintegrate_quarantine') return Response.json(await reintegrateQuarantine(base44, limit, feedUrl, token));

    const importedAt = new Date().toISOString();
    const stats = emptyImportStats();
    const rejectionReasons = emptyRejectionReasons();
    const ignoredReasons = {};
    const rejectedExamples = [];
    const rejectionsToWrite = [];
    const examples = [];
    const seenInFeed = new Set();
    let acceptedForWrite = 0;

    const { rows } = await listAwinFeedRows(feedUrl, token, { timeoutMs: 90000 });
    const selectedFeed = findCulturaFeedById(rows, feedId);
    if (!selectedFeed) throw new Error(`Flux ${feedId} introuvable`);
    const feedName = String(selectedFeed.feed_name || '').trim();
    if (action === 'ean_counter_test') return Response.json(await eanCounterTest(base44, feedUrl, token, selectedFeed));

    log = await base44.asServiceRole.entities.ImportLog.create({ started_at: startedAt, import_mode: 'test', feed_id: feedId, feed_name: feedName, products_processed: 0, rows_rejected: 0, books_created: 0, books_updated: 0, offers_created: 0, offers_updated: 0, duplicates: 0, duplicates_in_feed: 0, duplicates_cross_feed: 0, errors: 0, status: 'running', source_retailer: AWIN_RETAILER, test_limit: limit, control_report: { temporary_function: true, purpose: 'Validation écriture catalogue Cultura, à retirer après validation', feed_id: feedId, action: action || 'test_import' } });

    const resolved = await resolveAwinFeedRow(feedUrl, selectedFeed, token, { timeoutMs: 240000 });
    let batch = [];
    const importOnlyNonIsbn = action === 'import_non_isbn' || action === 'import_non_isbn_sample';
    for await (const { row, lineNumber } of csvRowsFromAwinStream(resolved.stream, resolved.gzip.is_gzip)) {
      if (acceptedForWrite >= limit) break;
      stats.productsProcessed += 1;
      stats.lineCheckpoint = lineNumber;
      const record = productToCatalogRecord(row, importedAt, selectedFeed, { allowNonIsbnEditorial: true });
      if (record.error) {
        stats.rowsRejected += 1;
        rejectionReasons[record.error] = (rejectionReasons[record.error] || 0) + 1;
        if (record.rejection) { rejectionsToWrite.push(record.rejection); if (rejectedExamples.length < 20) rejectedExamples.push(record.rejection); }
        continue;
      }
      if (importOnlyNonIsbn && record.isbn_valid !== false) { bump(ignoredReasons, 'valid_isbn_skipped'); continue; }
      const duplicateKey = record.product_identifier;
      if (seenInFeed.has(duplicateKey)) { stats.duplicatesInFeed += 1; bump(ignoredReasons, 'duplicate_in_feed'); continue; }
      seenInFeed.add(duplicateKey);
      batch.push(record);
      acceptedForWrite += 1;
      if (batch.length >= 300) {
        const result = await upsertBatch(base44, batch, examples, 10);
        stats.booksCreated += result.booksCreated; stats.booksUpdated += result.booksUpdated; stats.offersCreated += result.offersCreated; stats.offersUpdated += result.offersUpdated;
        batch = [];
        await writeImportProgress(base44, log.id, stats);
      }
    }
    if (batch.length) {
      const result = await upsertBatch(base44, batch, examples, 10);
      stats.booksCreated += result.booksCreated; stats.booksUpdated += result.booksUpdated; stats.offersCreated += result.offersCreated; stats.offersUpdated += result.offersUpdated;
    }
    await recordImportRejections(base44, rejectionsToWrite);
    const [bookCount, culturaOfferCount, quarantineCount] = await Promise.all([base44.asServiceRole.entities.Books.count({}), base44.asServiceRole.entities.BookOffers.count({ retailer_name: AWIN_RETAILER }), base44.asServiceRole.entities.ImportRejection.count({ reviewed: false })]);
    const controlReport = { temporary_function: true, remove_after_validation: true, action: action || 'test_import', feed_id: feedId, feed_name: feedName, limit, counters: stats, ignored_reasons: ignoredReasons, rejection_reasons: rejectionReasons, rejected_examples: rejectedExamples, examples_written: examples, totals_after_execution: { books: bookCount, cultura_offers: culturaOfferCount, quarantine: quarantineCount }, no_deletion: true, no_secret_or_datafeed_url_exposed: true };
    await base44.asServiceRole.entities.ImportLog.update(log.id, { finished_at: new Date().toISOString(), products_processed: stats.productsProcessed, rows_rejected: stats.rowsRejected, books_created: stats.booksCreated, books_updated: stats.booksUpdated, offers_created: stats.offersCreated, offers_updated: stats.offersUpdated, duplicates: stats.duplicatesInFeed + stats.duplicatesCrossFeed, duplicates_in_feed: stats.duplicatesInFeed, duplicates_cross_feed: stats.duplicatesCrossFeed, errors: stats.errors, line_checkpoint: stats.lineCheckpoint, status: stats.errors ? 'partial' : 'success', control_report: controlReport });
    return Response.json({ ok: true, temporary_function: true, remove_after_validation: true, action: action || 'test_import', feed_id: feedId, feed_name: feedName, limit, ...stats, ignored_total: Object.values(ignoredReasons).reduce((sum, value) => sum + value, 0), ignored_reasons: ignoredReasons, rejection_reasons: rejectionReasons, rejected_examples: rejectedExamples, examples_written: examples, totals_after_execution: controlReport.totals_after_execution });
  } catch (error) {
    try { if (log?.id) { const base44 = createClientFromRequest(req); await base44.asServiceRole.entities.ImportLog.update(log.id, { finished_at: new Date().toISOString(), status: 'failed', errors: 1, error_message: error.message }); } } catch {}
    return Response.json({ error: error.message, temporary_function: true }, { status: 500 });
  }
}