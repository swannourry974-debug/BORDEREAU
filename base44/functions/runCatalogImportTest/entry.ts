import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { listAwinFeedRows, resolveAwinFeedRow } from '../../shared/catalogUtils.ts';
import { AWIN_MAX_TEST_LIMIT, AWIN_RETAILER, AWIN_ROMAN_FEED_ID, csvRowsFromAwinStream, emptyImportStats, emptyRejectionReasons, findRomanFeed, productToCatalogRecord, upsertBatch, writeImportProgress } from '../../shared/awinImportCore.ts';

function readSecret(name) {
  try {
    return secrets.get(name) || '';
  } catch {
    return '';
  }
}

export default async function(req) {
  const startedAt = new Date().toISOString();
  let log = null;
  try {
    const body = await req.json().catch(() => ({}));
    const mode = String(body.mode || 'test').trim();
    const limit = Number(body.limit || AWIN_MAX_TEST_LIMIT);

    if (mode === 'full') return Response.json({ error: 'Mode full refusé pour cette fonction temporaire' }, { status: 400 });
    if (!Number.isFinite(limit) || limit < 1) return Response.json({ error: 'limit doit être compris entre 1 et 1000' }, { status: 400 });
    if (limit > AWIN_MAX_TEST_LIMIT) return Response.json({ error: 'limit supérieur à 1000 refusé' }, { status: 400 });

    const feedUrl = readSecret('AWIN_CULTURA_FEED_URL') || readSecret('AWIN_FEED_URL');
    const token = readSecret('AWIN_API_TOKEN');
    if (!feedUrl || !token) return Response.json({ error: 'Secrets Awin manquants' }, { status: 500 });

    const base44 = createClientFromRequest(req);
    const importedAt = new Date().toISOString();
    const stats = emptyImportStats();
    const rejectionReasons = emptyRejectionReasons();
    const examples = [];
    const seenGlobal = new Set();
    let acceptedForWrite = 0;

    log = await base44.asServiceRole.entities.ImportLog.create({
      started_at: startedAt,
      import_mode: 'test',
      feed_id: AWIN_ROMAN_FEED_ID,
      feed_name: 'LIVRE > ROMAN',
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
      source_retailer: AWIN_RETAILER,
      test_limit: limit,
      control_report: { temporary_function: true, purpose: 'Validation écriture catalogue Cultura, à retirer après validation' },
    });

    const { rows } = await listAwinFeedRows(feedUrl, token, { timeoutMs: 90000 });
    const romanFeed = findRomanFeed(rows);
    if (!romanFeed) throw new Error('Flux 101386 LIVRE > ROMAN introuvable');

    const resolved = await resolveAwinFeedRow(feedUrl, romanFeed, token, { timeoutMs: 240000 });
    let batch = [];
    for await (const { row, lineNumber } of csvRowsFromAwinStream(resolved.stream, resolved.gzip.is_gzip)) {
      if (acceptedForWrite >= limit) break;
      stats.productsProcessed += 1;
      stats.lineCheckpoint = lineNumber;

      const record = productToCatalogRecord(row, importedAt);
      if (record.error) {
        stats.rowsRejected += 1;
        rejectionReasons[record.error] = (rejectionReasons[record.error] || 0) + 1;
        continue;
      }

      batch.push(record);
      acceptedForWrite += 1;
      if (batch.length >= 300) {
        const result = await upsertBatch(base44, batch, seenGlobal, examples);
        stats.booksCreated += result.booksCreated;
        stats.booksUpdated += result.booksUpdated;
        stats.offersCreated += result.offersCreated;
        stats.offersUpdated += result.offersUpdated;
        stats.duplicatesCrossFeed += result.duplicatesCrossFeed;
        batch = [];
        await writeImportProgress(base44, log.id, stats);
      }
    }

    if (batch.length) {
      const result = await upsertBatch(base44, batch, seenGlobal, examples);
      stats.booksCreated += result.booksCreated;
      stats.booksUpdated += result.booksUpdated;
      stats.offersCreated += result.offersCreated;
      stats.offersUpdated += result.offersUpdated;
      stats.duplicatesCrossFeed += result.duplicatesCrossFeed;
    }

    const [bookCount, culturaOfferCount] = await Promise.all([
      base44.asServiceRole.entities.Books.count({}),
      base44.asServiceRole.entities.BookOffers.count({ retailer_name: AWIN_RETAILER }),
    ]);

    const controlReport = {
      temporary_function: true,
      remove_after_validation: true,
      feed_id: AWIN_ROMAN_FEED_ID,
      feed_name: 'LIVRE > ROMAN',
      limit,
      counters: stats,
      rejection_reasons: rejectionReasons,
      examples_written: examples,
      totals_after_execution: { books: bookCount, cultura_offers: culturaOfferCount },
      no_deletion: true,
      no_secret_or_datafeed_url_exposed: true,
    };

    await base44.asServiceRole.entities.ImportLog.update(log.id, {
      finished_at: new Date().toISOString(),
      products_processed: stats.productsProcessed,
      rows_rejected: stats.rowsRejected,
      books_created: stats.booksCreated,
      books_updated: stats.booksUpdated,
      offers_created: stats.offersCreated,
      offers_updated: stats.offersUpdated,
      duplicates: stats.duplicatesCrossFeed,
      duplicates_cross_feed: stats.duplicatesCrossFeed,
      errors: stats.errors,
      line_checkpoint: stats.lineCheckpoint,
      status: 'success',
      control_report: controlReport,
    });

    return Response.json({
      ok: true,
      temporary_function: true,
      remove_after_validation: true,
      feed_id: AWIN_ROMAN_FEED_ID,
      feed_name: 'LIVRE > ROMAN',
      limit,
      ...stats,
      rejection_reasons: rejectionReasons,
      examples_written: examples,
      totals_after_execution: { books: bookCount, cultura_offers: culturaOfferCount },
    });
  } catch (error) {
    try {
      if (log?.id) {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.ImportLog.update(log.id, { finished_at: new Date().toISOString(), status: 'failed', errors: 1, error_message: error.message });
      }
    } catch {}
    return Response.json({ error: error.message, temporary_function: true }, { status: 500 });
  }
}