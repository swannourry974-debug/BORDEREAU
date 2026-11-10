export function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function isValidIsbn13(value = '') {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (!/^\d{13}$/.test(digits)) return false;
  const sum = digits.slice(0, 12).split('').reduce((total, char, index) => total + Number(char) * (index % 2 ? 3 : 1), 0);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(digits[12]);
}

export function isValidIsbn10(value = '') {
  const clean = String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
  if (!/^\d{9}[\dX]$/.test(clean)) return false;
  const sum = clean.split('').reduce((total, char, index) => total + (char === 'X' ? 10 : Number(char)) * (10 - index), 0);
  return sum % 11 === 0;
}

export function isbn10To13(value = '') {
  const clean = String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
  if (!isValidIsbn10(clean)) return null;
  const base = `978${clean.slice(0, 9)}`;
  const sum = base.split('').reduce((total, char, index) => total + Number(char) * (index % 2 ? 3 : 1), 0);
  return `${base}${(10 - (sum % 10)) % 10}`;
}

export function normalizeIsbn(value = '') {
  const clean = String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
  if (isValidIsbn13(clean)) return clean;
  if (isValidIsbn10(clean)) return isbn10To13(clean);
  return null;
}

export function parsePrice(value) {
  const price = Number(String(value ?? '').replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(price) && price > 0 ? Math.round(price * 100) / 100 : null;
}

export function safeUrl(value = '') {
  try {
    const url = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

export function parseCsvLine(line = '') {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map(cell => cell.trim());
}

export function isTruthyStock(value) {
  const text = normalizeText(value);
  if (!text) return false;
  return ['1', 'true', 'yes', 'oui', 'y', 'in stock', 'instock', 'en stock', 'available', 'disponible'].some(token => text === token || text.includes(token));
}

export function isBookCategory(category = '', title = '') {
  const text = normalizeText(`${category} ${title}`);
  const excluded = ['papeterie', 'dvd', 'blu ray', 'bluray', 'cd', 'vinyle', 'jeux video', 'jeu video', 'jouet', 'goodies', 'figurine', 'agenda', 'calendrier', 'loisir creatif', 'fourniture'];
  if (excluded.some(word => text.includes(word))) return false;
  const included = ['livre', 'roman', 'poche', 'bd', 'bande dessinee', 'manga', 'litterature', 'jeunesse', 'essai', 'scolaire', 'parascolaire', 'beau livre', 'bibliotheque'];
  return included.some(word => text.includes(word));
}

export function inferBookType(category = '', title = '') {
  const text = normalizeText(`${category} ${title}`);
  if (text.includes('bd') || text.includes('bande dessinee')) return 'BD';
  if (text.includes('beau livre') || text.includes('relie')) return 'Relié';
  if (text.includes('broche')) return 'Broché';
  return 'Poche';
}

export function inferAuthor(row = {}) {
  const direct = row.author || row.auteur || row.creator || row.brand || '';
  if (direct && normalizeText(direct) !== 'cultura') return String(direct).trim();
  const name = String(row.product_name || row.title || '').trim();
  const parts = name.split(/\s[-–—|/]\s/).map(part => part.trim()).filter(Boolean);
  if (parts.length > 1 && parts[parts.length - 1].length < 80) return parts[parts.length - 1];
  return '';
}

export function bestOffer(offers = []) {
  const ranked = [...offers].sort((a, b) => {
    const av = offerAvailable(a) ? 0 : 1;
    const bv = offerAvailable(b) ? 0 : 1;
    if (av !== bv) return av - bv;
    return Number(a.price || 999999) - Number(b.price || 999999);
  });
  return ranked[0] || null;
}

export function offerAvailable(offer = {}) {
  if (Number(offer.stock_quantity || 0) > 0) return true;
  return isTruthyStock(offer.availability);
}

export function lightBook(book = {}, offers = [], origin = undefined) {
  const offer = bestOffer(offers);
  return {
    id: book.id,
    isbn13: book.isbn13,
    ean: book.ean,
    title: book.title,
    author: book.author,
    category: book.category,
    image_url: book.image_url,
    language: book.language,
    publisher: book.publisher,
    price: offer?.price || 0,
    currency: offer?.currency || 'EUR',
    availability: offer?.availability || 'indisponible',
    last_updated: offer?.last_updated || book.updated_date,
    best_offer: offer,
    offers,
    origin,
  };
}

export async function fetchOffersByBookIds(base44, bookIds = []) {
  const ids = [...new Set(bookIds.filter(Boolean))];
  if (!ids.length) return new Map();
  const page = await base44.asServiceRole.entities.BookOffers.filter({ book_id: { $in: ids } }, { limit: Math.min(500, Math.max(1, ids.length * 8)) });
  const offers = page.items || page || [];
  const map = new Map();
  offers.forEach((offer) => {
    if (!map.has(offer.book_id)) map.set(offer.book_id, []);
    map.get(offer.book_id).push(offer);
  });
  return map;
}

function sortAvailableThenPrice(a, b) {
  const av = offerAvailable(a.best_offer) ? 0 : 1;
  const bv = offerAvailable(b.best_offer) ? 0 : 1;
  if (av !== bv) return av - bv;
  return Number(a.price || 999999) - Number(b.price || 999999);
}

export async function buildSuggestionsForBook(base44, book, maxSuggestions = 5) {
  const max = Math.max(0, Math.min(Number(maxSuggestions || 0), 5));
  if (!book || max === 0) return [];
  const seen = new Set([book.id, book.isbn13].filter(Boolean));

  const authorPage = book.author_norm
    ? await base44.asServiceRole.entities.Books.filter({ author_norm: book.author_norm }, { sort: 'title_norm', limit: 30 })
    : { items: [] };
  const authorBooks = (authorPage.items || authorPage || []).filter(candidate => !seen.has(candidate.id) && !seen.has(candidate.isbn13));

  const categoryPage = book.category_norm
    ? await base44.asServiceRole.entities.Books.filter({ category_norm: book.category_norm }, { sort: 'title_norm', limit: 30 })
    : { items: [] };
  const categoryBooks = (categoryPage.items || categoryPage || []).filter(candidate => !seen.has(candidate.id) && !seen.has(candidate.isbn13));

  const allIds = [...authorBooks, ...categoryBooks].map(candidate => candidate.id);
  const offersMap = await fetchOffersByBookIds(base44, allIds);
  const sameAuthor = authorBooks.map(candidate => lightBook(candidate, offersMap.get(candidate.id) || [], 'same_author')).sort(sortAvailableThenPrice);
  const sameCategory = categoryBooks.map(candidate => lightBook(candidate, offersMap.get(candidate.id) || [], 'same_category')).sort(sortAvailableThenPrice);

  const buckets = [
    sameAuthor.filter(item => offerAvailable(item.best_offer)),
    sameCategory.filter(item => offerAvailable(item.best_offer)),
    sameAuthor.filter(item => !offerAvailable(item.best_offer)),
    sameCategory.filter(item => !offerAvailable(item.best_offer)),
  ];

  const suggestions = [];
  for (const bucket of buckets) {
    for (const item of bucket) {
      if (suggestions.length >= max) break;
      if (seen.has(item.id) || seen.has(item.isbn13)) continue;
      seen.add(item.id);
      seen.add(item.isbn13);
      suggestions.push(item);
    }
    if (suggestions.length >= max) break;
  }
  return suggestions;
}

export const AWIN_PRODUCT_FIELDS = [
  'product_name',
  'ean',
  'search_price',
  'currency',
  'merchant_image_url',
  'description',
  'merchant_product_category_path',
  'in_stock',
  'stock_quantity',
  'merchant_deep_link',
  'aw_deep_link',
  'last_updated',
];

export function normalizeAwinHeader(value = '') {
  return normalizeText(value).replace(/ /g, '_');
}

export function maskAwinUrl(value = '') {
  try {
    const url = new URL(value);
    const safePath = url.pathname
      .split('/')
      .map((segment) => {
        if (!segment) return segment;
        if (segment.length >= 16) return ':masked';
        if (/^[A-Fa-f0-9]{10,}$/.test(segment)) return ':masked';
        return segment;
      })
      .join('/');
    return `${url.origin}${safePath}`;
  } catch {
    return '';
  }
}

async function fetchAwinWithRedirects(feedUrl, token, timeoutMs = 120000) {
  let currentUrl = feedUrl;
  let redirects = 0;
  let response = null;
  const hasTokenInUrl = (() => {
    try {
      return Boolean(new URL(feedUrl).search);
    } catch {
      return false;
    }
  })();

  for (let i = 0; i <= 5; i += 1) {
    const headers = hasTokenInUrl || !token ? {} : { Authorization: `Bearer ${token}` };
    response = await fetch(currentUrl, {
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get('location');
    if (!location) break;
    currentUrl = new URL(location, currentUrl).toString();
    redirects += 1;
  }

  return { response, redirects, finalUrl: currentUrl, auth_mode: hasTokenInUrl ? 'url_query' : 'authorization_header' };
}

async function probeAwinStream(stream, contentEncoding = '') {
  const [probe, body] = stream.tee();
  const reader = probe.getReader();
  const { value } = await reader.read();
  await reader.cancel().catch(() => {});
  const firstChunk = value || new Uint8Array();
  const textPreview = new TextDecoder().decode(firstChunk.slice(0, 8192));
  const magicBytesGzip = Boolean(firstChunk.length >= 2 && firstChunk[0] === 0x1f && firstChunk[1] === 0x8b);
  const headerGzip = String(contentEncoding || '').toLowerCase().includes('gzip');
  return {
    stream: body,
    text_preview: textPreview,
    magic_bytes_gzip: magicBytesGzip,
    content_encoding_gzip: headerGzip,
    is_gzip: magicBytesGzip || headerGzip,
  };
}

async function readAwinText(stream) {
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let output = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    output += value;
    if (output.length > 2000000) break;
  }
  return output;
}

function rowsFromAwinCsvList(text = '') {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map(normalizeAwinHeader);
  if (!headers.includes('advertiser_name') || !headers.includes('url')) return [];
  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => { row[header] = cells[index] || ''; });
    return row;
  });
}

function stripHtml(value = '') {
  return String(value || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}

function rowsFromAwinHtmlList(text = '') {
  const tableRows = [...text.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(match => match[0]);
  if (tableRows.length < 2) return [];
  const headers = [...tableRows[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(match => normalizeAwinHeader(stripHtml(match[1])));
  if (!headers.includes('advertiser_name') || !headers.includes('url')) return [];
  return tableRows.slice(1).map(rowHtml => {
    const cells = [...rowHtml.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(match => stripHtml(match[1]));
    const href = [...rowHtml.matchAll(/href=["']([^"']+)["']/gi)].map(match => match[1]).find(url => String(url).includes('datafeed')) || '';
    const row = {};
    headers.forEach((header, index) => { row[header] = cells[index] || ''; });
    if (!row.url && href) row.url = href;
    return row;
  });
}

function sanitizeAwinFeedRow(row = {}) {
  return {
    advertiser_name: String(row.advertiser_name || '').trim(),
    feed_id: String(row.feed_id || row.data_feed_id || row.fid || '').trim(),
    feed_name: String(row.feed_name || '').trim(),
    language: String(row.language || '').trim(),
    primary_region: String(row.primary_region || '').trim(),
    datafeed_format: String(row.datafeed_format || '').trim(),
    membership_status: String(row.membership_status || row.status || '').trim(),
    no_of_products: String(row.no_of_products || '').trim(),
    vertical: String(row.vertical || '').trim(),
  };
}

export async function listAwinFeedRows(configuredUrl, token, options = {}) {
  const timeoutMs = options.timeoutMs || 120000;
  const initial = await fetchAwinWithRedirects(configuredUrl, token, timeoutMs);
  const initialHttp = {
    status: initial.response?.status || null,
    content_type: initial.response?.headers.get('content-type') || '',
    content_length: initial.response?.headers.get('content-length') || '',
    redirects: initial.redirects,
    final_url_masked: maskAwinUrl(initial.finalUrl),
    auth_mode: initial.auth_mode,
  };

  if (!initial.response?.ok || !initial.response?.body) {
    const error = new Error(`Liste Awin impossible (${initial.response?.status || 'sans réponse'})`);
    (error as any).http = initialHttp;
    throw error;
  }

  const firstProbe = await probeAwinStream(initial.response.body, initial.response.headers.get('content-encoding') || '');
  const listText = await readAwinText(firstProbe.stream);
  const rows = [...rowsFromAwinCsvList(listText), ...rowsFromAwinHtmlList(listText)];
  return { rows, http: initialHttp };
}

function chooseCulturaFeed(rows = []) {
  const culturaRows = rows.filter(row => normalizeText(row.advertiser_name).includes('cultura'));
  const scored = culturaRows.map(row => {
    const text = normalizeText(`${row.feed_name} ${row.language} ${row.primary_region} ${row.datafeed_format}`);
    let score = 0;
    if (normalizeText(row.datafeed_format).includes('csv')) score += 50;
    if (normalizeText(row.language) === 'fr' || normalizeText(row.language).includes('french')) score += 40;
    if (text.includes('france') || text.includes(' fr ') || text.endsWith(' fr') || text.startsWith('fr ')) score += 20;
    if (normalizeText(row.feed_name).includes('cultura')) score += 10;
    score += Math.min(Number(String(row.no_of_products || '').replace(/[^0-9]/g, '')) || 0, 1000000) / 1000000;
    return { row, score };
  }).sort((a, b) => b.score - a.score);
  return scored[0]?.row || null;
}

export async function resolveAwinDatafeed(configuredUrl, token, options = {}) {
  const timeoutMs = options.timeoutMs || 120000;
  const initial = await fetchAwinWithRedirects(configuredUrl, token, timeoutMs);
  const initialHttp = {
    status: initial.response?.status || null,
    content_type: initial.response?.headers.get('content-type') || '',
    content_length: initial.response?.headers.get('content-length') || '',
    redirects: initial.redirects,
    final_url_masked: maskAwinUrl(initial.finalUrl),
    auth_mode: initial.auth_mode,
  };

  if (!initial.response?.ok || !initial.response?.body) {
    throw new Error(`Téléchargement Awin impossible (${initial.response?.status || 'sans réponse'})`);
  }

  const firstProbe = await probeAwinStream(initial.response.body, initial.response.headers.get('content-encoding') || '');
  const productHeaderDirect = AWIN_PRODUCT_FIELDS.slice(0, 3).every(field => normalizeText(firstProbe.text_preview).replace(/ /g, '_').includes(field));
  if (firstProbe.is_gzip || productHeaderDirect) {
    return {
      stream: firstProbe.stream,
      gzip: firstProbe,
      http: initialHttp,
      feed_resolution: {
        method: 'direct',
        selected_feed: null,
        advertisers_detected: [],
      },
    };
  }

  const listText = await readAwinText(firstProbe.stream);
  const rows = [...rowsFromAwinCsvList(listText), ...rowsFromAwinHtmlList(listText)];
  const selected = chooseCulturaFeed(rows);
  if (!selected?.url) {
    const advertisers = [...new Map(rows.map(row => [String(row.advertiser_name || row.feed_name || '').trim(), sanitizeAwinFeedRow(row)]).filter(([name]) => name)).values()].slice(0, 30);
    const error = new Error('Aucun flux Cultura trouvé dans la liste Awin');
    (error as any).feed_resolution = {
      method: 'feed_list',
      selected_feed: null,
      advertisers_detected: advertisers,
    };
    (error as any).http = initialHttp;
    throw error;
  }

  const selectedUrl = new URL(selected.url, configuredUrl).toString();
  const datafeed = await fetchAwinWithRedirects(selectedUrl, token, timeoutMs);
  if (!datafeed.response?.ok || !datafeed.response?.body) {
    throw new Error(`Téléchargement du datafeed Cultura impossible (${datafeed.response?.status || 'sans réponse'})`);
  }
  const dataProbe = await probeAwinStream(datafeed.response.body, datafeed.response.headers.get('content-encoding') || '');

  return {
    stream: dataProbe.stream,
    gzip: dataProbe,
    http: {
      status: datafeed.response.status,
      content_type: datafeed.response.headers.get('content-type') || '',
      content_length: datafeed.response.headers.get('content-length') || '',
      redirects: initial.redirects + datafeed.redirects,
      final_url_masked: maskAwinUrl(datafeed.finalUrl),
      auth_mode: datafeed.auth_mode,
    },
    feed_resolution: {
      method: 'feed_list',
      selected_feed: sanitizeAwinFeedRow(selected),
      advertisers_detected: [],
    },
  };
}