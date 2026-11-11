import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { createEntityRateLimiter, isRateLimitError } from '../../shared/entityRateLimiter.ts';
import { AUDIT_PAGE_LIMIT, normalizeText, scanAllEntityPages as scanAll } from '../../shared/catalogAuditPagination.ts';
const OPERATIONAL_REFERENCE_ENTITIES = [
  'CartItem',
  'WishlistItem',
  'Commande',
  'MissionVoyageur',
  'NotationVoyageur',
  'MalleCollecte',
  'VoyageurBadge',
  'VoyageurWallet',
  'Voyage',
  'PointRelais',
  'CampagnePromoCollecte',
  'VisuelBordero',
  'ZonesTarifs',
  'ShippingRates',
];

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  const current = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }
  return previous[b.length];
}

function similarity(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left && !right) return 1;
  if (!left || !right) return 0;
  const max = Math.max(left.length, right.length);
  return max ? 1 - levenshtein(left, right) / max : 1;
}

function titlesMatch(leftTitle, leftNorm, rightTitle, rightNorm) {
  const left = normalizeText(leftNorm || leftTitle);
  const right = normalizeText(rightNorm || rightTitle);
  if (!left || !right) return false;
  if (left === right) return true;
  const shorter = left.length <= right.length ? left : right;
  const longer = left.length > right.length ? left : right;
  if (longer.includes(shorter) && shorter.length / longer.length >= 0.9) return true;
  return similarity(left, right) >= 0.9;
}

function extractYear(value = '') {
  const match = normalizeText(value).match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : '';
}

function detectFormat(value = '') {
  const text = normalizeText(value);
  const formats = [];
  if (text.includes('poche')) formats.push('poche');
  if (text.includes('broche') || text.includes('broché')) formats.push('broche');
  if (text.includes('relie') || text.includes('relié')) formats.push('relie');
  if (text.includes('album')) formats.push('album');
  if (text.includes('numerique') || text.includes('ebook') || text.includes('e book')) formats.push('numerique');
  if (text.includes('coffret') || text.includes('box')) formats.push('coffret');
  return formats.join('|');
}

function firstCulturaOffer(offers = []) {
  return [...offers]
    .filter(offer => String(offer.retailer_name || '').toLowerCase() === 'cultura')
    .sort((a, b) => String(b.last_updated || b.updated_date || b.created_date || '').localeCompare(String(a.last_updated || a.updated_date || a.created_date || '')))[0] || null;
}

function sameMerchantOffer(left, right) {
  if (!left || !right) return false;
  const leftRef = String(left.retailer_product_id || '').trim();
  const rightRef = String(right.retailer_product_id || '').trim();
  const leftUrl = String(left.merchant_url || '').trim();
  const rightUrl = String(right.merchant_url || '').trim();
  return Boolean((leftRef && leftRef === rightRef) || (leftUrl && leftUrl === rightUrl));
}

function priceDiffPercent(left, right) {
  const a = Number(left || 0);
  const b = Number(right || 0);
  if (!a || !b) return null;
  return Math.abs(a - b) / Math.min(a, b);
}

function differentIdentifier(left, right) {
  const leftMain = String(left.product_identifier || left.isbn13 || left.ean || '').trim();
  const rightMain = String(right.product_identifier || right.isbn13 || right.ean || '').trim();
  if (!leftMain || !rightMain) return false;
  return leftMain !== rightMain;
}

function differentIsbn(left, right) {
  const leftIsbn = String(left.isbn13 || '').trim();
  const rightIsbn = String(right.isbn13 || '').trim();
  if (!leftIsbn || !rightIsbn) return false;
  return leftIsbn !== rightIsbn;
}

function differentMerchantReference(leftOffer, rightOffer) {
  if (!leftOffer || !rightOffer) return false;
  const leftRef = String(leftOffer.retailer_product_id || '').trim();
  const rightRef = String(rightOffer.retailer_product_id || '').trim();
  const leftUrl = String(leftOffer.merchant_url || '').trim();
  const rightUrl = String(rightOffer.merchant_url || '').trim();
  if (leftRef && rightRef && leftRef !== rightRef) return true;
  if (leftUrl && rightUrl && leftUrl !== rightUrl) return true;
  return false;
}

function bookSummary(book, offers) {
  const offer = firstCulturaOffer(offers);
  return {
    id: book?.id || '',
    product_identifier: book?.product_identifier || '',
    isbn13: book?.isbn13 || '',
    ean: book?.ean || '',
    identifier_type: book?.identifier_type || '',
    isbn_valid: book?.isbn_valid === true,
    product_type: book?.product_type || '',
    classification: book?.classification || '',
    title: book?.title || '',
    title_norm: book?.title_norm || normalizeText(book?.title || ''),
    author: book?.author || '',
    publisher: book?.publisher || '',
    category: book?.category || '',
    price: offer?.price || 0,
    availability: offer?.availability || '',
    image_url_present: Boolean(String(book?.image_url || '').trim()),
    source_feed_id: book?.source_feed_id || '',
    created_date: book?.created_date || '',
    cultura_offer: offer ? {
      retailer_product_id: offer.retailer_product_id || '',
      merchant_url: offer.merchant_url || '',
      last_updated: offer.last_updated || offer.updated_date || '',
      price: offer.price || 0,
      availability: offer.availability || '',
    } : null,
  };
}

function classifyPair(mergedBook, targetBook, mergedOffers, targetOffers) {
  const mergedOffer = firstCulturaOffer(mergedOffers);
  const targetOffer = firstCulturaOffer(targetOffers);
  const titleOk = titlesMatch(mergedBook.title, mergedBook.title_norm, targetBook.title, targetBook.title_norm);
  const titleSimilarity = similarity(mergedBook.title_norm || mergedBook.title, targetBook.title_norm || targetBook.title);
  const editeurDifferent = Boolean(normalizeText(mergedBook.publisher) && normalizeText(targetBook.publisher) && normalizeText(mergedBook.publisher) !== normalizeText(targetBook.publisher));
  const diffPercent = priceDiffPercent(mergedOffer?.price, targetOffer?.price);
  const prixDifferent = diffPercent !== null && diffPercent > 0.05;
  const prixTresDifferent = diffPercent !== null && diffPercent > 0.35;
  const identifiantDifferent = differentIdentifier(mergedBook, targetBook);
  const isbnDifferent = differentIsbn(mergedBook, targetBook);
  const referenceMarchandeDifferente = differentMerchantReference(mergedOffer, targetOffer);
  const formatMerged = detectFormat(mergedBook.title);
  const formatTarget = detectFormat(targetBook.title);
  const formatDifferent = Boolean(formatMerged && formatTarget && formatMerged !== formatTarget);
  const yearMerged = extractYear(mergedBook.title);
  const yearTarget = extractYear(targetBook.title);
  const anneeDifferente = Boolean(yearMerged && yearTarget && yearMerged !== yearTarget);
  const memeOffreMarchande = sameMerchantOffer(mergedOffer, targetOffer);
  const sameIsbn = Boolean(mergedBook.isbn13 && targetBook.isbn13 && mergedBook.isbn13 === targetBook.isbn13);
  const noEditorialDifference = !editeurDifferent && !formatDifferent && !anneeDifferente && !prixDifferent;
  const insufficient = !mergedOffer || !targetOffer || (!mergedBook.title && !targetBook.title);

  const indicators = {
    titres_identiques: titleOk,
    similarite_titre: Math.round(titleSimilarity * 1000) / 1000,
    editeur_different: editeurDifferent,
    prix_different: prixDifferent,
    prix_ecart_percent: diffPercent === null ? null : Math.round(diffPercent * 10000) / 100,
    identifiant_different: identifiantDifferent,
    isbn_different: isbnDifferent,
    reference_marchande_differente: referenceMarchandeDifferente,
    format_different: formatDifferent,
    format_fusionnee: formatMerged,
    format_cible: formatTarget,
    annee_differente: anneeDifferente,
    annee_fusionnee: yearMerged,
    annee_cible: yearTarget,
    meme_offre_marchande: memeOffreMarchande,
  };

  const reasons = [];
  if (!titleOk) reasons.push('titre');
  if (editeurDifferent) reasons.push('editeur');
  if (prixDifferent) reasons.push('prix');
  if (isbnDifferent || identifiantDifferent) reasons.push('ISBN');
  if (referenceMarchandeDifferente) reasons.push('reference_marchande');
  if (formatDifferent) reasons.push('format');

  let classification = 'B_douteuse';
  if (titleOk && (memeOffreMarchande || sameIsbn || !identifiantDifferent) && noEditorialDifference) classification = 'A_justifiee';
  if (!titleOk && titleSimilarity < 0.75) classification = 'C_incorrecte';
  if (isbnDifferent && editeurDifferent) classification = 'C_incorrecte';
  if (prixTresDifferent) classification = 'C_incorrecte';
  if (referenceMarchandeDifferente && !titleOk) classification = 'C_incorrecte';
  if (classification === 'A_justifiee' && insufficient) classification = 'B_douteuse';

  if (!reasons.length && classification !== 'A_justifiee') reasons.push('informations_insuffisantes');

  return { classification, indicators, reasons };
}

function pairDetail(mergedBook, targetBook, mergedOffers, targetOffers, classification, indicators, reasons) {
  return {
    classification,
    reasons,
    indicators,
    merged: bookSummary(mergedBook, mergedOffers),
    target: bookSummary(targetBook, targetOffers),
    offers_attachment: {
      merged_book_offers_count: mergedOffers.length,
      target_book_offers_count: targetOffers.length,
      total_offers_count: mergedOffers.length + targetOffers.length,
    },
  };
}

function incrementReasons(output, classification, reasons) {
  if (!['B_douteuse', 'C_incorrecte'].includes(classification)) return;
  const bucket = classification === 'B_douteuse' ? output.B_douteuse : output.C_incorrecte;
  for (const reason of reasons) bucket[reason] = (bucket[reason] || 0) + 1;
}

function findMergedReferences(record, mergedIds, path = '') {
  const hits = [];
  if (record === null || record === undefined) return hits;
  if (typeof record === 'string') {
    if (mergedIds.has(record)) hits.push({ path, value: record });
    return hits;
  }
  if (Array.isArray(record)) {
    record.forEach((item, index) => hits.push(...findMergedReferences(item, mergedIds, `${path}[${index}]`)));
    return hits;
  }
  if (typeof record === 'object') {
    for (const [key, value] of Object.entries(record)) {
      const nextPath = path ? `${path}.${key}` : key;
      hits.push(...findMergedReferences(value, mergedIds, nextPath));
    }
  }
  return hits;
}

async function auditAnnexReferences(base44, mergedIds, limiter) {
  const results = [];
  for (const entityName of OPERATIONAL_REFERENCE_ENTITIES) {
    const entity = base44.asServiceRole.entities[entityName];
    if (!entity) continue;
    const scan = await scanAll(entity, {}, entityName, limiter);
    let references_count = 0;
    const field_counts = {};
    const examples = [];
    for (const record of scan.records) {
      const hits = findMergedReferences(record, mergedIds);
      if (!hits.length) continue;
      references_count += hits.length;
      for (const hit of hits) field_counts[hit.path] = (field_counts[hit.path] || 0) + 1;
      if (examples.length < 10) examples.push({ record_id: record.id, hits: hits.slice(0, 8) });
    }
    if (references_count > 0) {
      results.push({ entity: entityName, records_scanned: scan.total_scanned, pages_scanned: scan.pages_scanned, references_count, field_counts, examples });
    }
  }
  return results;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const limiter = createEntityRateLimiter({ listPerMinute: 105, writePerMinute: 1, maxAttempts: 4 });

    const [booksScan, offersScan] = await Promise.all([
      scanAll(base44.asServiceRole.entities.Books, {}, 'Books', limiter),
      scanAll(base44.asServiceRole.entities.BookOffers, {}, 'BookOffers', limiter),
    ]);

    const allBooks = booksScan.records;
    const allOffers = offersScan.records;
    const bookById = new Map(allBooks.map(book => [book.id, book]));
    const allBookIds = new Set(allBooks.map(book => book.id));
    const mergedBooks = allBooks.filter(book => book.merged === true);
    const mergedIds = new Set(mergedBooks.map(book => book.id));
    const targetIds = new Set(mergedBooks.map(book => String(book.merged_into || '').trim()).filter(Boolean));

    const offersByBookId = new Map();
    const orphanOffers = [];
    for (const offer of allOffers) {
      const bookId = String(offer.book_id || '').trim();
      if (!bookId || !allBookIds.has(bookId)) orphanOffers.push(offer);
      if (!bookId) continue;
      if (!offersByBookId.has(bookId)) offersByBookId.set(bookId, []);
      offersByBookId.get(bookId).push(offer);
    }

    const counters = {
      total_fusionnees: mergedBooks.length,
      A_justifiee: 0,
      B_douteuse: 0,
      C_incorrecte: 0,
      fiches_sans_cible_retrouvee: 0,
      fiches_avec_merged_into_invalide: 0,
    };
    const reasonBreakdown = {
      B_douteuse: { titre: 0, editeur: 0, prix: 0, ISBN: 0, reference_marchande: 0, format: 0, informations_insuffisantes: 0 },
      C_incorrecte: { titre: 0, editeur: 0, prix: 0, ISBN: 0, reference_marchande: 0, format: 0, informations_insuffisantes: 0 },
    };
    const examplesA = [];
    const examplesB = [];
    const examplesC = [];

    let offersPointingToMerged = 0;
    let mergedBooksWithActiveOffer = 0;

    for (const mergedBook of mergedBooks) {
      const targetId = String(mergedBook.merged_into || '').trim();
      const mergedOffers = offersByBookId.get(mergedBook.id) || [];
      if (mergedOffers.length) offersPointingToMerged += mergedOffers.length;
      if (mergedOffers.some(offer => offer.merged !== true)) mergedBooksWithActiveOffer += 1;

      if (!targetId) {
        counters.fiches_avec_merged_into_invalide += 1;
        continue;
      }
      const targetBook = bookById.get(targetId);
      if (!targetBook) {
        counters.fiches_sans_cible_retrouvee += 1;
        continue;
      }

      const targetOffers = offersByBookId.get(targetId) || [];
      const result = classifyPair(mergedBook, targetBook, mergedOffers, targetOffers);
      counters[result.classification] += 1;
      incrementReasons(reasonBreakdown, result.classification, result.reasons);
      const detail = pairDetail(mergedBook, targetBook, mergedOffers, targetOffers, result.classification, result.indicators, result.reasons);
      if (result.classification === 'A_justifiee' && examplesA.length < 10) examplesA.push(detail);
      if (result.classification === 'B_douteuse' && examplesB.length < 20) examplesB.push(detail);
      if (result.classification === 'C_incorrecte' && examplesC.length < 30) examplesC.push(detail);
    }

    let targetsWithMultipleCulturaOffers = 0;
    for (const targetId of targetIds) {
      const culturaOffers = (offersByBookId.get(targetId) || []).filter(offer => String(offer.retailer_name || '').toLowerCase() === 'cultura' && offer.merged !== true);
      if (culturaOffers.length > 1) targetsWithMultipleCulturaOffers += 1;
    }

    const annexReferences = await auditAnnexReferences(base44, mergedIds, limiter);

    return Response.json({
      read_only: true,
      no_write: true,
      no_merge: true,
      no_delete: true,
      no_import: true,
      no_secret_exposed: true,
      pagination: {
        books_pages_scanned: booksScan.pages_scanned,
        offers_pages_scanned: offersScan.pages_scanned,
        stopped_on_has_more_false: booksScan.stopped_on_has_more_false && offersScan.stopped_on_has_more_false,
        limit: AUDIT_PAGE_LIMIT,
        logical_skip_progression: true,
        limiter: limiter.metrics(),
      },
      counters,
      reason_breakdown_B_C: reasonBreakdown,
      offers_attachment: {
        offres_pointant_sur_fiche_fusionnee: offersPointingToMerged,
        fiches_fusionnees_ayant_encore_une_offre_active: mergedBooksWithActiveOffer,
        offres_orphelines: orphanOffers.length,
        cibles_ayant_plusieurs_offres_cultura: targetsWithMultipleCulturaOffers,
      },
      annex_reference_check: {
        merged_ids_checked: mergedIds.size,
        entities_checked: OPERATIONAL_REFERENCE_ENTITIES,
        entities_with_references: annexReferences.length,
        references: annexReferences,
      },
      examples_C_incorrecte: examplesC,
      examples_B_douteuse: examplesB,
      examples_A_justifiee: examplesA,
    });
  } catch (error) {
    const status = isRateLimitError(error) ? 429 : 500;
    return Response.json({ error: error.message, rate_limited: isRateLimitError(error), retryable: isRateLimitError(error), read_only: true, no_write: true }, { status });
  }
}