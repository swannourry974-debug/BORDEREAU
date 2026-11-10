import { secrets } from 'base44:runtime';
import { AWIN_PRODUCT_FIELDS, isBookCategory, isTruthyStock, maskAwinUrl, normalizeAwinHeader, normalizeIsbn, parseCsvLine, parsePrice, resolveAwinDatafeed, safeUrl } from '../../shared/catalogUtils.ts';

// TEMPORAIRE — fonction de diagnostic lecture seule pour valider le flux Awin Cultura.
// À retirer après validation du flux. Cette fonction n'écrit jamais dans Books, BookOffers ou ImportLog.

function nowMs() {
  return performance.now();
}

function elapsed(start) {
  return Math.round(performance.now() - start);
}

function getSecret(name) {
  try {
    return secrets.get(name) || '';
  } catch {
    return '';
  }
}

async function* lineIterator(stream, isGzip) {
  const readable = isGzip
    ? stream.pipeThrough(new DecompressionStream('gzip')).pipeThrough(new TextDecoderStream())
    : stream.pipeThrough(new TextDecoderStream());
  const reader = readable.getReader();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.trim()) yield line;
    }
  }
  if (buffer.trim()) yield buffer;
}

function analyseRow(row, seenIsbns) {
  const title = String(row.product_name || '').trim();
  const category = String(row.merchant_product_category_path || row.category_name || row.product_type || row.custom_1 || '').trim();
  const isbn13 = normalizeIsbn(row.ean || '');
  const priceRaw = String(row.search_price ?? '').trim();
  const price = parsePrice(priceRaw);
  const currency = String(row.currency || 'EUR').trim().toUpperCase();
  const imagePresent = Boolean(safeUrl(row.merchant_image_url || row.aw_image_url || ''));
  const deepLinkPresent = Boolean(safeUrl(row.aw_deep_link || row.merchant_deep_link || ''));
  const availabilityRaw = row.in_stock || row.stock_status || row.availability || '';
  const availabilityPresent = String(availabilityRaw).trim() !== '';
  const classifiedBook = isBookCategory(category, title);
  const reasons = [];

  if (!classifiedBook) reasons.push('non_livre');
  if (!isbn13) reasons.push('ean_invalide');
  if (!title) reasons.push('titre_manquant');
  if (priceRaw && price === null) reasons.push('prix_non_numerique');
  if (!priceRaw) reasons.push('prix_manquant');
  if (priceRaw && Number(String(priceRaw).replace(',', '.')) <= 0) reasons.push('prix_inferieur_ou_egal_zero');
  if (!currency) reasons.push('devise_manquante');
  if (!deepLinkPresent) reasons.push('lien_profond_manquant');

  const duplicate = Boolean(isbn13 && seenIsbns.has(isbn13));
  if (duplicate) reasons.push('doublon_isbn_echantillon');
  if (isbn13) seenIsbns.add(isbn13);

  return {
    accepted: reasons.length === 0,
    classifiedBook,
    isbn13,
    duplicate,
    title,
    price,
    priceRaw,
    currency,
    imagePresent,
    availabilityPresent,
    deepLinkPresent,
    availability: isTruthyStock(availabilityRaw) ? 'en_stock' : (availabilityPresent ? 'indisponible' : ''),
    category,
    reason: reasons[0] || '',
  };
}

export default async function(req) {
  const totalStart = nowMs();
  const durations = {};
  const body = await req.json().catch(() => ({}));
  const limit = Math.max(1, Math.min(Number(body.limit || 200), 1000));

  const secretStart = nowMs();
  const token = getSecret('AWIN_API_TOKEN');
  const feedUrl = getSecret('AWIN_CULTURA_FEED_URL');
  durations.secrets_ms = elapsed(secretStart);

  const report = {
    diagnostic: 'testAwinFeed',
    temporary_function: true,
    read_only: true,
    limit,
    secrets: {
      awin_api_token_present: Boolean(token),
      feed_url_present: Boolean(feedUrl),
    },
    feed_resolution: {
      method: '',
      selected_feed: null,
      advertisers_detected: [],
    },
    http: {
      status: null,
      content_type: '',
      content_length: '',
      response_time_ms: null,
      redirects: 0,
      final_url_masked: feedUrl ? maskAwinUrl(feedUrl) : '',
      auth_mode: '',
      error_message: '',
    },
    gzip: {
      magic_bytes_gzip: false,
      content_encoding_gzip: false,
      is_gzip: false,
    },
    csv: {
      columns: [],
      expected_fields: Object.fromEntries(AWIN_PRODUCT_FIELDS.map(field => [field, false])),
    },
    validation: {
      rows_read: 0,
      valid_ean: 0,
      invalid_ean: 0,
      missing_title: 0,
      price_not_numeric: 0,
      price_lte_zero: 0,
      missing_image: 0,
      missing_availability: 0,
      missing_deep_link: 0,
      duplicate_isbn_in_sample: 0,
      classified_books: 0,
      classified_non_books: 0,
    },
    examples: {
      accepted_books: [],
      rejected_rows: [],
    },
    durations_ms: durations,
  };

  if (!token || !feedUrl) {
    report.http.error_message = 'Secrets requis manquants';
    report.durations_ms.total_ms = elapsed(totalStart);
    return Response.json(report, { status: 200 });
  }

  try {
    const resolutionStart = nowMs();
    const resolved = await resolveAwinDatafeed(feedUrl, token, { timeoutMs: 90000 });
    durations.feed_resolution_ms = elapsed(resolutionStart);
    report.feed_resolution = resolved.feed_resolution;
    report.http = { ...report.http, ...resolved.http, response_time_ms: durations.feed_resolution_ms, error_message: '' };
    report.gzip = {
      magic_bytes_gzip: resolved.gzip.magic_bytes_gzip,
      content_encoding_gzip: resolved.gzip.content_encoding_gzip,
      is_gzip: resolved.gzip.is_gzip,
    };

    const seenIsbns = new Set();
    const sampleStart = nowMs();
    let headers = null;
    let headerRead = false;

    for await (const line of lineIterator(resolved.stream, resolved.gzip.is_gzip)) {
      if (!headers) {
        const headerStart = nowMs();
        headers = parseCsvLine(line).map(normalizeAwinHeader);
        report.csv.columns = headers;
        report.csv.expected_fields = Object.fromEntries(AWIN_PRODUCT_FIELDS.map(field => [field, headers.includes(field)]));
        durations.header_ms = elapsed(headerStart);
        headerRead = true;
        continue;
      }
      if (report.validation.rows_read >= limit) break;
      const cells = parseCsvLine(line);
      const row = {};
      headers.forEach((header, index) => { row[header] = cells[index] || ''; });
      const analysis = analyseRow(row, seenIsbns);

      report.validation.rows_read += 1;
      if (analysis.isbn13) report.validation.valid_ean += 1;
      else report.validation.invalid_ean += 1;
      if (!analysis.title) report.validation.missing_title += 1;
      if (analysis.priceRaw && analysis.price === null) report.validation.price_not_numeric += 1;
      if (analysis.priceRaw && Number(String(analysis.priceRaw).replace(',', '.')) <= 0) report.validation.price_lte_zero += 1;
      if (!analysis.imagePresent) report.validation.missing_image += 1;
      if (!analysis.availabilityPresent) report.validation.missing_availability += 1;
      if (!analysis.deepLinkPresent) report.validation.missing_deep_link += 1;
      if (analysis.duplicate) report.validation.duplicate_isbn_in_sample += 1;
      if (analysis.classifiedBook) report.validation.classified_books += 1;
      else report.validation.classified_non_books += 1;

      if (analysis.accepted && report.examples.accepted_books.length < 10) {
        report.examples.accepted_books.push({
          title: analysis.title,
          isbn13: analysis.isbn13,
          price: analysis.price,
          currency: analysis.currency,
          availability: analysis.availability,
          image_present: analysis.imagePresent,
          category: analysis.category,
        });
      } else if (!analysis.accepted && report.examples.rejected_rows.length < 10) {
        report.examples.rejected_rows.push({
          title: analysis.title || null,
          ean_present: Boolean(row.ean),
          category: analysis.category || null,
          reason: analysis.reason,
        });
      }
    }

    if (!headerRead) report.http.error_message = 'En-tête CSV introuvable';
    durations.sample_read_ms = elapsed(sampleStart);
    report.durations_ms.total_ms = elapsed(totalStart);
    return Response.json(report, { status: 200 });
  } catch (error) {
    report.http.error_message = error.message;
    if (error.feed_resolution) report.feed_resolution = error.feed_resolution;
    if (error.http) report.http = { ...report.http, ...error.http, error_message: error.message };
    report.durations_ms.total_ms = elapsed(totalStart);
    return Response.json(report, { status: 200 });
  }
}