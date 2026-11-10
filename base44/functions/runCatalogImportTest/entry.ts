import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { listAwinFeedRows, resolveAwinFeedRow } from '../../shared/catalogUtils.ts';
import { AWIN_MAX_TEST_LIMIT, AWIN_RETAILER, AWIN_ROMAN_FEED_ID, csvRowsFromAwinStream, emptyImportStats, emptyRejectionReasons, findCulturaFeedById, productToCatalogRecord, recordImportRejections, upsertBatch, writeImportProgress } from '../../shared/awinImportCore.ts';

function readSecret(name) {
  try { return secrets.get(name) || ''; } catch { return ''; }
}

export default async function(req) {
  const startedAt = new Date().toISOString();
  let log = null;
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const mode = String(body.mode || 'test').trim();
    const limit = Number(body.limit || AWIN_MAX_TEST_LIMIT);
    const feedId = String(body.feed_id || AWIN_ROMAN_FEED_ID).trim();

    if (mode === 'full') return Response.json({ error: 'Mode full refusé pour cette fonction temporaire' }, { status: 400 });
    if (!Number.isFinite(limit) || limit < 1) return Response.json({ error: 'limit doit être compris entre 1 et 1000' }, { status: 400 });
    if (limit > AWIN_MAX_TEST_LIMIT) return Response.json({ error: 'limit supérieur à 1000 refusé' }, { status: 400 });
    if (!feedId) return Response.json({ error: 'feed_id requis' }, { status: 400 });

    const feedUrl = readSecret('AWIN_CULTURA_FEED_URL') || readSecret('AWIN_FEED_URL');
    const token = readSecret('AWIN_API_TOKEN');
    if (!feedUrl || !token) return Response.json({ error: 'Secrets Awin manquants' }, { status: 500 });

    const importedAt = new Date().toISOString();
    const stats = emptyImportStats();
    const rejectionReasons = emptyRejectionReasons();
    const rejectedExamples = [];
    const rejectionsToWrite = [];
    const examples = [];
    const seenInFeed = new Set();
    let acceptedForWrite = 0;

    const { rows } = await listAwinFeedRows(feedUrl, token, { timeoutMs: 90000 });
    const selectedFeed = findCulturaFeedById(rows, feedId);
    if (!selectedFeed) throw new Error(`Flux ${feedId} introuvable`);
    const feedName = String(selectedFeed.feed_name || '').trim();

    log = await base44.asServiceRole.entities.ImportLog.create({
      started_at: startedAt,
      import_mode: 'test',
      feed_id: feedId,
      feed_name: feedName,
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
      test_limit: limit,
      control_report: { temporary_function: true, purpose: 'Validation écriture catalogue Cultura, à retirer après validation', feed_id: feedId },
    });

    const resolved = await resolveAwinFeedRow(feedUrl, selectedFeed, token, { timeoutMs: 240000 });
    let batch = [];
    for await (const { row, lineNumber } of csvRowsFromAwinStream(resolved.stream, resolved.gzip.is_gzip)) {
      if (acceptedForWrite >= limit) break;
      stats.productsProcessed += 1;
      stats.lineCheckpoint = lineNumber;

      const record = productToCatalogRecord(row, importedAt, selectedFeed);
      if (record.error) {
        stats.rowsRejected += 1;
        rejectionReasons[record.error] = (rejectionReasons[record.error] || 0) + 1;
        if (record.rejection) {
          rejectionsToWrite.push(record.rejection);
          if (rejectedExamples.length < 20) rejectedExamples.push(record.rejection);
        }
        continue;
      }

      if (seenInFeed.has(record.isbn13)) {
        stats.duplicatesInFeed += 1;
        continue;
      }
      seenInFeed.add(record.isbn13);
      batch.push(record);
      acceptedForWrite += 1;

      if (batch.length >= 300) {
        const result = await upsertBatch(base44, batch, examples, 10);
        stats.booksCreated += result.booksCreated;
        stats.booksUpdated += result.booksUpdated;
        stats.offersCreated += result.offersCreated;
        stats.offersUpdated += result.offersUpdated;
        batch = [];
        await writeImportProgress(base44, log.id, stats);
      }
    }

    if (batch.length) {
      const result = await upsertBatch(base44, batch, examples, 10);
      stats.booksCreated += result.booksCreated;
      stats.booksUpdated += result.booksUpdated;
      stats.offersCreated += result.offersCreated;
      stats.offersUpdated += result.offersUpdated;
    }
    await recordImportRejections(base44, rejectionsToWrite);

    const [bookCount, culturaOfferCount, quarantineCount] = await Promise.all([
      base44.asServiceRole.entities.Books.count({}),
      base44.asServiceRole.entities.BookOffers.count({ retailer_name: AWIN_RETAILER }),
      base44.asServiceRole.entities.ImportRejection.count({ reviewed: false }),
    ]);

    const controlReport = {
      temporary_function: true,
      remove_after_validation: true,
      feed_id: feedId,
      feed_name: feedName,
      limit,
      counters: stats,
      rejection_reasons: rejectionReasons,
      rejected_examples: rejectedExamples,
      examples_written: examples,
      totals_after_execution: { books: bookCount, cultura_offers: culturaOfferCount, quarantine: quarantineCount },
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
      duplicates: stats.duplicatesInFeed + stats.duplicatesCrossFeed,
      duplicates_in_feed: stats.duplicatesInFeed,
      duplicates_cross_feed: stats.duplicatesCrossFeed,
      errors: stats.errors,
      line_checkpoint: stats.lineCheckpoint,
      status: stats.errors ? 'partial' : 'success',
      control_report: controlReport,
    });

    return Response.json({ ok: true, temporary_function: true, remove_after_validation: true, feed_id: feedId, feed_name: feedName, limit, ...stats, rejection_reasons: rejectionReasons, rejected_examples: rejectedExamples, examples_written: examples, totals_after_execution: controlReport.totals_after_execution });
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