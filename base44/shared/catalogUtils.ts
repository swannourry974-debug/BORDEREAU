import { classifyCatalogRecord, isGenericAuthorName, isSuggestionEligible, normalizeAuthorForMatch } from './catalogClassification.ts';

export function normalizeText(value = '') {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const STOP_WORDS = new Set(['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'et', 'ou', 'a', 'au', 'aux', 'en', 'dans', 'sur', 'pour', 'par', 'avec', 'the', 'a', 'an', 'of', 'in', 'on', 'to', 'and']);
const EMPTY_BRANDS = new Set(['', 'pas de marque', '-', 'n a', 'na', 'sans marque', 'aucun']);

export function tokenizeTitle(value = '') {
  return [...new Set(normalizeText(value).split(' ').filter(token => token.length > 1 && !STOP_WORDS.has(token)))];
}

export function cleanPublisher(value = '') {
  const raw = String(value || '').trim();
  const norm = normalizeText(raw);
  return EMPTY_BRANDS.has(norm) ? '' : raw;
}

export function isValidIsbn13(value = '') {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (!/^\d{13}$/.test(digits) || !/^97[89]/.test(digits)) return false;
  const sum = digits.slice(0, 12).split('').reduce((total, char, index) => total + Number(char) * (index % 2 ? 3 : 1), 0);
  return ((10 - (sum % 10)) % 10) === Number(digits[12]);
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

export function isValidEan13(value = '') {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (!/^\d{13}$/.test(digits)) return false;
  const sum = digits.slice(0, 12).split('').reduce((total, char, index) => total + Number(char) * (index % 2 ? 3 : 1), 0);
  return ((10 - (sum % 10)) % 10) === Number(digits[12]);
}

export function cleanEan(value = '') {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  return isValidEan13(digits) ? digits : '';
}

export function parsePrice(value) {
  const price = Number(String(value ?? '').replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(price) && price > 0 ? Math.round(price * 100) / 100 : null;
}

export function safeUrl(value = '') {
  try {
    const url = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch { return ''; }
}

export function parseCsvLine(line = '') {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') { current += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { cells.push(current); current = ''; }
    else current += char;
  }
  cells.push(current);
  return cells.map(cell => cell.trim());
}

export function normalizeAvailability(value = '') {
  const raw = String(value ?? '').trim();
  const text = normalizeText(raw);
  if (!text) return 'unknown';
  if (text === '0' || text.includes('hors stock') || text.includes('rupture') || text.includes('indisponible') || text.includes('out of stock') || text.includes('unavailable')) return 'out_of_stock';
  if (text.includes('stock') || ['1', 'true', 'yes', 'oui', 'available', 'disponible'].includes(text)) return 'in_stock';
  return 'unknown';
}

export function isTruthyStock(value) { return normalizeAvailability(value) === 'in_stock'; }

export function cleanAuthorList(value = '') {
  const seen = new Set();
  const authors = String(value || '')
    .split(/[;,]/)
    .map(author => author.trim())
    .filter(Boolean)
    .filter((author) => {
      const key = normalizeText(author);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return authors.join(', ');
}

export function isStationeryProduct(title = '') {
  const text = normalizeText(title);
  const excluded = ['carnet', 'bloc notes', 'bloc note', 'papeterie', 'marque page', 'marque pages', 'carte postale', 'cartes postales', 'poster', 'stylo', 'stylos'];
  if (excluded.some(word => text.includes(word))) return true;
  if (text.includes('cahier') && !text.includes('cahier d exercices')) return true;
  if (text.includes('agenda') && (text.includes('agenda scolaire') || text.includes('agenda de bureau') || text.includes('semainier') || /\b(?:19|20)\d{2}\b/.test(text))) return true;
  return false;
}

export function isEditorialProduct(category = '', title = '') {
  if (isStationeryProduct(title)) return false;
  const text = normalizeText(`${category} ${title}`);
  const editorial = ['coffret', 'pack', 'integrale', 'intégrale', 'album', 'agenda', 'calendrier', 'dvd', 'lot', 'collector', 'box', 'tome', 'livre', 'roman', 'bd', 'bande dessinee', 'manga', 'comics', 'litterature', 'jeunesse'];
  const hardExcluded = ['blu ray', 'bluray', 'cd audio', 'vinyle', 'jeux video', 'jeu video', 'jouet', 'figurine', 'peluche', 'fourniture'];
  if (hardExcluded.some(word => text.includes(normalizeText(word)))) return false;
  return editorial.some(word => text.includes(normalizeText(word)));
}

export function isBookCategory(category = '', title = '') { return isEditorialProduct(category, title); }

export function inferProductType(category = '', title = '', isbnValid = false) {
  if (isbnValid) return 'livre';
  const text = normalizeText(`${category} ${title}`);
  return ['coffret', 'pack', 'integrale', 'album', 'agenda', 'calendrier', 'dvd', 'lot', 'collector', 'box'].some(word => text.includes(normalizeText(word))) ? 'produit_editorial' : 'livre';
}

export function inferAuthor(row = {}) {
  const reject = (value = '') => {
    const text = normalizeText(value);
    if (!text || text.includes('cultura') || text.includes('pas de marque') || text.includes('livre') || text.includes('roman') || text.includes('manga') || text.includes('bd') || text.includes('comics')) return true;
    if (String(value).length > 90 || /[>\/]/.test(String(value))) return true;
    return !/[A-Za-zÀ-ÿ]{2}/.test(String(value));
  };
  for (const key of ['custom_5', 'custom_1', 'product_type']) {
    const value = String(row[key] || '').trim();
    if (value && !reject(value)) return cleanAuthorList(value);
  }
  const description = String(row.description || '').replace(/<[^>]+>/g, ' ');
  const match = description.match(/(?:auteur|auteurs|autrice|scenariste|dessinateur)\s*:?\s*([^.;\n]{2,90})/i);
  if (match && !reject(match[1])) return cleanAuthorList(match[1]);
  return '';
}

function availabilityRank(offer = {}) {
  const value = offer?.availability || 'unknown';
  if (value === 'in_stock') return 0;
  if (value === 'out_of_stock') return 1;
  return 2;
}

export function bestOffer(offers = []) {
  return [...offers].sort((a, b) => availabilityRank(a) - availabilityRank(b) || Number(a.price || 999999) - Number(b.price || 999999))[0] || null;
}

export function offerAvailable(offer = {}) { return offer?.availability === 'in_stock'; }

export function lightBook(book = {}, offers = [], origin = undefined) {
  const offer = bestOffer(offers);
  const classification = book.classification || book.product_type || 'livre';
  const classificationLabel = classification === 'revue' ? 'revue' : classification === 'produit_editorial' ? 'produit éditorial' : classification === 'non_eligible' ? 'non éligible' : 'livre';
  return {
    id: book.id,
    product_identifier: book.product_identifier || book.isbn13 || book.ean || book.id,
    identifier_type: book.identifier_type || (book.isbn13 ? 'isbn13' : 'merchant_id'),
    isbn_valid: book.isbn_valid === true,
    product_type: book.product_type || 'livre',
    classification,
    classification_label: classificationLabel,
    classification_previous: book.classification_previous || '',
    classification_updated_at: book.classification_updated_at || '',
    classification_source: book.classification_source || '',
    isbn13: book.isbn_valid === false ? '' : (book.isbn13 || ''),
    ean: book.ean,
    title: book.title,
    title_norm: book.title_norm,
    title_tokens: book.title_tokens || [],
    author: normalizeText(book.author) === 'pas de marque' ? '' : book.author,
    author_source: book.author_source || (book.author ? 'feed' : 'none'),
    author_enriched_at: book.author_enriched_at,
    category: book.category,
    category_source: book.category_source,
    source_feed_id: book.source_feed_id,
    image_url: book.image_url,
    language: book.language,
    publisher: book.publisher,
    price: offer?.price || 0,
    currency: offer?.currency || 'EUR',
    availability: offer?.availability || 'unknown',
    availability_raw: offer?.availability_raw || '',
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
  offers.forEach((offer) => { if (!map.has(offer.book_id)) map.set(offer.book_id, []); map.get(offer.book_id).push(offer); });
  return map;
}

function sortAvailableThenPrice(a, b) { return availabilityRank(a.best_offer) - availabilityRank(b.best_offer) || Number(a.price || 999999) - Number(b.price || 999999); }

export async function suggestionPoolsForBook(base44, book) {
  const seen = new Set([book?.id, book?.product_identifier, book?.isbn13].filter(Boolean));
  const authorKey = normalizeAuthorForMatch(book?.author || book?.author_norm || '');
  const canUseAuthor = Boolean(authorKey) && !isGenericAuthorName(authorKey);
  const authorPage = canUseAuthor ? await base44.asServiceRole.entities.Books.filter({ author_norm: authorKey }, { sort: 'title_norm', limit: 50 }) : { items: [] };
  const categoryPage = book?.category_norm ? await base44.asServiceRole.entities.Books.filter({ category_norm: book.category_norm }, { sort: 'title_norm', limit: 60 }) : { items: [] };
  const keepCandidate = candidate => !seen.has(candidate.id) && !seen.has(candidate.product_identifier) && !seen.has(candidate.isbn13) && isSuggestionEligible(candidate);
  const authorBooks = (authorPage.items || authorPage || []).filter(candidate => keepCandidate(candidate) && !isGenericAuthorName(candidate.author || candidate.author_norm || ''));
  const categoryBooks = (categoryPage.items || categoryPage || []).filter(keepCandidate);
  const offersMap = await fetchOffersByBookIds(base44, [...authorBooks, ...categoryBooks].map(candidate => candidate.id));
  return {
    same_author: authorBooks.map(candidate => lightBook(candidate, offersMap.get(candidate.id) || [], 'same_author')).sort(sortAvailableThenPrice),
    same_category: categoryBooks.map(candidate => lightBook(candidate, offersMap.get(candidate.id) || [], 'same_category')).sort(sortAvailableThenPrice),
  };
}

export async function buildSuggestionsForBook(base44, book, maxSuggestions = 5) {
  const max = Math.max(0, Math.min(Number(maxSuggestions || 0), 5));
  if (!book || max === 0) return [];
  const pools = await suggestionPoolsForBook(base44, book);
  const seen = new Set([book.id, book.product_identifier, book.isbn13].filter(Boolean));
  const suggestions = [];
  for (const pool of [pools.same_author, pools.same_category]) {
    for (const item of pool) {
      if (suggestions.length >= max) break;
      if (seen.has(item.id) || seen.has(item.product_identifier) || seen.has(item.isbn13)) continue;
      seen.add(item.id); seen.add(item.product_identifier); seen.add(item.isbn13);
      suggestions.push(item);
    }
  }
  return suggestions;
}

export const AWIN_PRODUCT_FIELDS = ['product_name', 'ean', 'aw_product_id', 'search_price', 'currency', 'merchant_image_url', 'description', 'merchant_product_category_path', 'category_name', 'stock_status', 'in_stock', 'stock_quantity', 'merchant_deep_link', 'aw_deep_link', 'last_updated'];

export function normalizeAwinHeader(value = '') { return normalizeText(value).replace(/ /g, '_'); }

export function maskAwinUrl(value = '') {
  try {
    const url = new URL(value);
    const safePath = url.pathname.split('/').map((segment) => (!segment ? segment : (segment.length >= 16 || /^[A-Fa-f0-9]{10,}$/.test(segment) ? ':masked' : segment))).join('/');
    return `${url.origin}${safePath}`;
  } catch { return ''; }
}

async function fetchAwinWithRedirects(feedUrl, token, timeoutMs = 120000) {
  let currentUrl = feedUrl;
  let redirects = 0;
  let response = null;
  const hasTokenInUrl = (() => { try { return Boolean(new URL(feedUrl).search); } catch { return false; } })();
  for (let i = 0; i <= 5; i += 1) {
    const headers = hasTokenInUrl || !token ? {} : { Authorization: `Bearer ${token}` };
    response = await fetch(currentUrl, { headers, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
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
  return { stream: body, text_preview: textPreview, magic_bytes_gzip: magicBytesGzip, content_encoding_gzip: headerGzip, is_gzip: magicBytesGzip || headerGzip };
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
  return lines.slice(1).map(line => { const cells = parseCsvLine(line); const row = {}; headers.forEach((header, index) => { row[header] = cells[index] || ''; }); return row; });
}

function stripHtml(value = '') { return String(value || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim(); }

function rowsFromAwinHtmlList(text = '') {
  const tableRows = [...text.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(match => match[0]);
  if (tableRows.length < 2) return [];
  const headers = [...tableRows[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(match => normalizeAwinHeader(stripHtml(match[1])));
  if (!headers.includes('advertiser_name') || !headers.includes('url')) return [];
  return tableRows.slice(1).map(rowHtml => { const cells = [...rowHtml.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(match => stripHtml(match[1])); const href = [...rowHtml.matchAll(/href=["']([^"']+)["']/gi)].map(match => match[1]).find(url => String(url).includes('datafeed')) || ''; const row = {}; headers.forEach((header, index) => { row[header] = cells[index] || ''; }); if (!row.url && href) row.url = href; return row; });
}

function sanitizeAwinFeedRow(row = {}) {
  return { advertiser_name: String(row.advertiser_name || '').trim(), feed_id: String(row.feed_id || row.data_feed_id || row.fid || '').trim(), feed_name: String(row.feed_name || '').trim(), language: String(row.language || '').trim(), primary_region: String(row.primary_region || '').trim(), datafeed_format: String(row.datafeed_format || '').trim(), membership_status: String(row.membership_status || row.status || '').trim(), no_of_products: String(row.no_of_products || '').trim(), vertical: String(row.vertical || '').trim() };
}

export async function listAwinFeedRows(configuredUrl, token, options = {}) {
  const timeoutMs = options.timeoutMs || 120000;
  const initial = await fetchAwinWithRedirects(configuredUrl, token, timeoutMs);
  const initialHttp = { status: initial.response?.status || null, content_type: initial.response?.headers.get('content-type') || '', content_length: initial.response?.headers.get('content-length') || '', redirects: initial.redirects, final_url_masked: maskAwinUrl(initial.finalUrl), auth_mode: initial.auth_mode };
  if (!initial.response?.ok || !initial.response?.body) { const error = new Error(`Liste Awin impossible (${initial.response?.status || 'sans réponse'})`); error.http = initialHttp; throw error; }
  const firstProbe = await probeAwinStream(initial.response.body, initial.response.headers.get('content-encoding') || '');
  const listText = await readAwinText(firstProbe.stream);
  return { rows: [...rowsFromAwinCsvList(listText), ...rowsFromAwinHtmlList(listText)], http: initialHttp };
}

function chooseCulturaFeed(rows = []) {
  const culturaRows = rows.filter(row => normalizeText(row.advertiser_name).includes('cultura'));
  const scored = culturaRows.map(row => { const text = normalizeText(`${row.feed_name} ${row.language} ${row.primary_region} ${row.datafeed_format}`); let score = 0; if (normalizeText(row.datafeed_format).includes('csv')) score += 50; if (normalizeText(row.language) === 'fr' || normalizeText(row.language).includes('french')) score += 40; if (text.includes('france') || text.includes(' fr ') || text.endsWith(' fr') || text.startsWith('fr ')) score += 20; if (normalizeText(row.feed_name).includes('cultura')) score += 10; score += Math.min(Number(String(row.no_of_products || '').replace(/[^0-9]/g, '')) || 0, 1000000) / 1000000; return { row, score }; }).sort((a, b) => b.score - a.score);
  return scored[0]?.row || null;
}

export async function resolveAwinFeedRow(configuredUrl, feedRow, token, options = {}) {
  const timeoutMs = options.timeoutMs || 120000;
  if (!feedRow?.url) throw new Error('Flux Awin sans URL téléchargeable');
  const selectedUrl = new URL(feedRow.url, configuredUrl).toString();
  const datafeed = await fetchAwinWithRedirects(selectedUrl, token, timeoutMs);
  if (!datafeed.response?.ok || !datafeed.response?.body) throw new Error(`Téléchargement du datafeed Cultura impossible (${datafeed.response?.status || 'sans réponse'})`);
  const dataProbe = await probeAwinStream(datafeed.response.body, datafeed.response.headers.get('content-encoding') || '');
  return { stream: dataProbe.stream, gzip: dataProbe, http: { status: datafeed.response.status, content_type: datafeed.response.headers.get('content-type') || '', content_length: datafeed.response.headers.get('content-length') || '', redirects: datafeed.redirects, final_url_masked: maskAwinUrl(datafeed.finalUrl), auth_mode: datafeed.auth_mode }, feed_resolution: { method: 'feed_list', selected_feed: sanitizeAwinFeedRow(feedRow), advertisers_detected: [] } };
}

export async function resolveAwinDatafeed(configuredUrl, token, options = {}) {
  const timeoutMs = options.timeoutMs || 120000;
  const initial = await fetchAwinWithRedirects(configuredUrl, token, timeoutMs);
  const initialHttp = { status: initial.response?.status || null, content_type: initial.response?.headers.get('content-type') || '', content_length: initial.response?.headers.get('content-length') || '', redirects: initial.redirects, final_url_masked: maskAwinUrl(initial.finalUrl), auth_mode: initial.auth_mode };
  if (!initial.response?.ok || !initial.response?.body) throw new Error(`Téléchargement Awin impossible (${initial.response?.status || 'sans réponse'})`);
  const firstProbe = await probeAwinStream(initial.response.body, initial.response.headers.get('content-encoding') || '');
  const productHeaderDirect = AWIN_PRODUCT_FIELDS.slice(0, 3).every(field => normalizeText(firstProbe.text_preview).replace(/ /g, '_').includes(field));
  if (firstProbe.is_gzip || productHeaderDirect) return { stream: firstProbe.stream, gzip: firstProbe, http: initialHttp, feed_resolution: { method: 'direct', selected_feed: null, advertisers_detected: [] } };
  const listText = await readAwinText(firstProbe.stream);
  const rows = [...rowsFromAwinCsvList(listText), ...rowsFromAwinHtmlList(listText)];
  const selected = chooseCulturaFeed(rows);
  if (!selected?.url) { const advertisers = [...new Map(rows.map(row => [String(row.advertiser_name || row.feed_name || '').trim(), sanitizeAwinFeedRow(row)]).filter(([name]) => name)).values()].slice(0, 30); const error = new Error('Aucun flux Cultura trouvé dans la liste Awin'); error.feed_resolution = { method: 'feed_list', selected_feed: null, advertisers_detected: advertisers }; error.http = initialHttp; throw error; }
  const resolved = await resolveAwinFeedRow(configuredUrl, selected, token, { timeoutMs });
  return { ...resolved, http: { ...resolved.http, redirects: initial.redirects + resolved.http.redirects } };
}