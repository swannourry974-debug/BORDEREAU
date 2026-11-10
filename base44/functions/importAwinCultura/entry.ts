import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { listAwinFeedRows, resolveAwinFeedRow } from '../../shared/catalogUtils.ts';
import { AWIN_BATCH_SIZE, AWIN_MAX_TEST_LIMIT, AWIN_RETAILER, countProducts, csvRowsFromAwinStream, emptyImportStats, emptyRejectionReasons, latestCheckpoint, productToCatalogRecord, selectCulturaBookFeeds, upsertBatch, writeImportProgress } from '../../shared/awinImportCore.ts';
import { requireCatalogImportAdmin } from '../../shared/catalogImportAccess.ts';

const MAX_RUNTIME_MS = 260000;

function readSecret(name) {
  try {
    return secrets.get(name) || '';
  } catch {
    return '';
  }
}

export default async function(req) {
  const runStarted = Date.now();
  const startedAt = new Date().toISOString();
  let executionLog = null;
  try {
    const base44 = createClientFromRequest(req);
    const access = await requireCatalogImportAdmin(base44);
    if (access.response) return access.response;

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === 'test' || (body.limit && body.mode !== 'full') ? 'test' : 'full';
    const testLimit = mode === 'test' ? Math.max(1, Math.min(Number(body.limit || AWIN_MAX_TEST_LIMIT), AWIN_MAX_TEST_LIMIT)) : null;
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
      source_retailer: AWIN_RETAILER,
      test_limit: testLimit || undefined,
    });

    const { rows: feedRows } = await listAwinFeedRows(feedUrl, token, { timeoutMs: 90000 });
    const feeds = selectCulturaBookFeeds(feedRows, includeUniversEnfant);
    if (!feeds.length) throw new Error('Aucun flux livre Cultura FR détecté');

    const totals = emptyImportStats();
    const rejectionReasons = emptyRejectionReasons();
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
      const feedStats = emptyImportStats(resumeFromLine);
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
        source_retailer: AWIN_RETAILER,
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

          const record = productToCatalogRecord(row, importedAt, feed);
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

          if (batch.length >= AWIN_BATCH_SIZE) {
            const result = await upsertBatch(base44, batch, writtenExamples, 10);
            feedStats.booksCreated += result.booksCreated;
            feedStats.booksUpdated += result.booksUpdated;
            feedStats.offersCreated += result.offersCreated;
            feedStats.offersUpdated += result.offersUpdated;
            totals.booksCreated += result.booksCreated;
            totals.booksUpdated += result.booksUpdated;
            totals.offersCreated += result.offersCreated;
            totals.offersUpdated += result.offersUpdated;
            batch = [];
            await writeImportProgress(base44, feedLog.id, feedStats);
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
        await writeImportProgress(base44, feedLog.id, feedStats, feedStatus, { finished_at: new Date().toISOString(), feed_size_bytes: Number(resolved.http.content_length || 0) || undefined });
        feedReports.push({ feed_id: feedId, feed_name: feedName, status: feedStatus, ...feedStats });
      } catch (error) {
        feedStats.errors += 1;
        totals.errors += 1;
        await writeImportProgress(base44, feedLog.id, feedStats, 'failed', { finished_at: new Date().toISOString(), error_message: error.message });
        feedReports.push({ feed_id: feedId, feed_name: feedName, status: 'failed', error: error.message, ...feedStats });
      }

      if (stoppedForLimit || stoppedForRuntime) break;
    }

    const [bookCount, culturaOfferCount] = await Promise.all([
      base44.asServiceRole.entities.Books.count({}),
      base44.asServiceRole.entities.BookOffers.count({ retailer_name: AWIN_RETAILER }),
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
      expected_unique_references_estimate: { expected_products: expectedProducts, observed_unique_isbn: observedUniqueIsbn.size, observed_valid_isbn: observedValid, estimated_unique_references: estimatedUniqueReferences },
      stopped_for_limit: stoppedForLimit,
      stopped_for_runtime: stoppedForRuntime,
      feed_reports: feedReports,
      no_catalog_deletion: true,
      other_retailer_offers_untouched: true,
    };

    await base44.asServiceRole.entities.ImportLog.update(executionLog.id, { finished_at: new Date().toISOString(), current_feed_id: feedReports[feedReports.length - 1]?.feed_id || '', products_processed: totals.productsProcessed, rows_rejected: totals.rowsRejected, books_created: totals.booksCreated, books_updated: totals.booksUpdated, offers_created: totals.offersCreated, offers_updated: totals.offersUpdated, duplicates_cross_feed: totals.duplicatesCrossFeed, duplicates: totals.duplicatesCrossFeed, errors: totals.errors, status, line_checkpoint: totals.lineCheckpoint, control_report: controlReport });
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