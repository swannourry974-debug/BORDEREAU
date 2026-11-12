import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { createEntityRateLimiter, isRateLimitError } from '../../shared/entityRateLimiter.ts';
import { AUDIT_PAGE_LIMIT, normalizeText, scanAllEntityPages } from '../../shared/catalogAuditPagination.ts';

const FORMAT_WORDS = [
  ['poche', ['poche']],
  ['broche', ['broche', 'broché']],
  ['relie', ['relie', 'relié']],
  ['album', ['album']],
  ['coffret', ['coffret', 'box']],
  ['numerique', ['numerique', 'numérique', 'ebook', 'e book']],
];

function pickCulturaOffer(offers = [], archived = false) {
  return [...offers]
    .filter((offer) => String(offer.retailer_name || '').toLowerCase() === 'cultura')
    .filter((offer) => archived ? offer.merged === true : offer.merged !== true)
    .sort((a, b) => String(b.last_updated || b.updated_date || b.created_date || '').localeCompare(String(a.last_updated || a.updated_date || a.created_date || '')))[0] || null;
}

function detectFormat(title = '') {
  const text = normalizeText(title);
  const found = [];
  for (const [label, variants] of FORMAT_WORDS) {
    if (variants.some((variant) => text.includes(normalizeText(variant)))) found.push(label);
  }
  return found.join('|');
}

function referenceFields(offer = {}) {
  return {
    retailer_product_id: String(offer?.retailer_product_id || '').trim(),
    merchant_url: String(offer?.merchant_url || '').trim(),
    affiliate_url: String(offer?.affiliate_url || '').trim(),
  };
}

function priceGapPercent(historicalPrice, currentPrice) {
  const history = Number(historicalPrice || 0);
  const current = Number(currentPrice || 0);
  if (!history || !current) return null;
  return Math.abs(history - current) / Math.min(history, current);
}

function sameValue(left, right) {
  return Boolean(String(left || '').trim() && String(left || '').trim() === String(right || '').trim());
}

function differentWhenBothPresent(left, right) {
  const a = String(left || '').trim();
  const b = String(right || '').trim();
  return Boolean(a && b && a !== b);
}

function compactBook(book = {}, offer = null) {
  return {
    id: book.id || '',
    product_identifier: book.product_identifier || '',
    isbn13: book.isbn13 || '',
    title: book.title || '',
    title_norm: book.title_norm || normalizeText(book.title || ''),
    author: book.author || '',
    publisher: book.publisher || '',
    price: offer?.price || 0,
    availability: offer?.availability || '',
    created_date: book.created_date || '',
    source_feed_id: book.source_feed_id || '',
    merged_into: book.merged_into || '',
    merged_at: book.merged_at || '',
    format_detected: detectFormat(book.title || ''),
  };
}

function compactOffer(offer = null) {
  if (!offer) return null;
  return {
    id: offer.id || '',
    book_id: offer.book_id || '',
    retailer_name: offer.retailer_name || '',
    retailer_product_id: offer.retailer_product_id || '',
    merchant_url: offer.merchant_url || '',
    affiliate_url: offer.affiliate_url || '',
    price: offer.price || 0,
    availability: offer.availability || '',
    last_updated: offer.last_updated || offer.updated_date || '',
    merged: offer.merged === true,
    merged_into: offer.merged_into || '',
  };
}

function classifyReference(mergedBook, targetBook, historicalOffer, currentOffer) {
  if (!historicalOffer) {
    return { classification: 'C_reference_introuvable', reasons: ['aucune_offre_archivee'], price_gap_percent: null };
  }

  const historicalRef = referenceFields(historicalOffer);
  const currentRef = referenceFields(currentOffer || {});
  const historicalReferenceEmpty = !historicalRef.retailer_product_id && !historicalRef.merchant_url && !historicalRef.affiliate_url;
  if (historicalReferenceEmpty) {
    return { classification: 'C_reference_introuvable', reasons: ['references_archivees_vides'], price_gap_percent: null };
  }

  const sameRetailerProduct = sameValue(historicalRef.retailer_product_id, currentRef.retailer_product_id);
  const sameMerchantUrl = sameValue(historicalRef.merchant_url, currentRef.merchant_url);
  const sameAffiliateUrl = sameValue(historicalRef.affiliate_url, currentRef.affiliate_url);
  const sameIsbn = sameValue(mergedBook.isbn13, targetBook?.isbn13);
  const retailerProductDifferent = differentWhenBothPresent(historicalRef.retailer_product_id, currentRef.retailer_product_id);
  const merchantUrlDifferent = differentWhenBothPresent(historicalRef.merchant_url, currentRef.merchant_url);
  const isbnDifferent = differentWhenBothPresent(mergedBook.isbn13, targetBook?.isbn13);
  const gap = priceGapPercent(historicalOffer.price, currentOffer?.price);
  const priceComparable = gap !== null && gap <= 0.2;
  const priceVeryDifferent = gap !== null && gap > 0.2;
  const titleNormDifferent = Boolean(normalizeText(mergedBook.title_norm || mergedBook.title || '') && normalizeText(targetBook?.title_norm || targetBook?.title || '') && normalizeText(mergedBook.title_norm || mergedBook.title || '') !== normalizeText(targetBook?.title_norm || targetBook?.title || ''));
  const formatDifferent = Boolean(detectFormat(mergedBook.title || '') && detectFormat(targetBook?.title || '') && detectFormat(mergedBook.title || '') !== detectFormat(targetBook?.title || ''));

  if (sameRetailerProduct || sameMerchantUrl || (sameIsbn && priceComparable && (!retailerProductDifferent || !merchantUrlDifferent))) {
    return { classification: 'A_fusion_confirmee', reasons: sameRetailerProduct ? ['retailer_product_id_identique'] : sameMerchantUrl ? ['merchant_url_identique'] : ['isbn_identique_prix_comparable'], price_gap_percent: gap };
  }

  const reasons = [];
  if (!currentOffer) reasons.push('cible_sans_offre_cultura_active');
  if (retailerProductDifferent && merchantUrlDifferent) reasons.push('retailer_product_id_et_merchant_url_differents');
  else {
    if (retailerProductDifferent) reasons.push('retailer_product_id_different');
    if (merchantUrlDifferent) reasons.push('merchant_url_differente');
  }
  if (isbnDifferent) reasons.push('isbn_different');
  if (priceVeryDifferent) reasons.push('prix_ecart_superieur_20');
  if (titleNormDifferent) reasons.push('title_norm_different');
  if (formatDifferent) reasons.push('format_different');
  if (sameAffiliateUrl) reasons.push('affiliate_url_identique_seulement');
  if (!reasons.length) reasons.push('reference_non_confirmee');

  return { classification: 'B_reference_differente', reasons, price_gap_percent: gap };
}

function exampleDetail(mergedBook, targetBook, historicalOffer, currentOffer, result) {
  return {
    classification: result.classification,
    motifs: result.reasons,
    merged_book: compactBook(mergedBook, historicalOffer),
    target_book: targetBook ? compactBook(targetBook, currentOffer) : null,
    historical_cultura_offer: compactOffer(historicalOffer),
    current_cultura_offer: compactOffer(currentOffer),
    comparison: {
      product_identifier_historique: mergedBook.product_identifier || '',
      product_identifier_actuel: targetBook?.product_identifier || '',
      isbn_historique: mergedBook.isbn13 || '',
      isbn_actuel: targetBook?.isbn13 || '',
      retailer_product_id_historique: historicalOffer?.retailer_product_id || '',
      retailer_product_id_actuel: currentOffer?.retailer_product_id || '',
      merchant_url_historique: historicalOffer?.merchant_url || '',
      merchant_url_actuel: currentOffer?.merchant_url || '',
      title_norm_historique: mergedBook.title_norm || normalizeText(mergedBook.title || ''),
      title_norm_actuel: targetBook?.title_norm || normalizeText(targetBook?.title || ''),
      format_historique: detectFormat(mergedBook.title || ''),
      format_actuel: detectFormat(targetBook?.title || ''),
      prix_historique: historicalOffer?.price || 0,
      prix_actuel: currentOffer?.price || 0,
      ecart_prix_percent: result.price_gap_percent === null ? null : Math.round(result.price_gap_percent * 10000) / 100,
    },
  };
}

function addReasons(target, reasons = []) {
  for (const reason of reasons) target[reason] = (target[reason] || 0) + 1;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const limiter = createEntityRateLimiter({ listPerMinute: 105, writePerMinute: 1, maxAttempts: 4 });

    const [booksScan, offersScan, realBooksTotal, realMergedBooksTotal, realOffersTotal, realMergedOffersTotal] = await Promise.all([
      scanAllEntityPages(base44.asServiceRole.entities.Books, {}, 'Books', limiter),
      scanAllEntityPages(base44.asServiceRole.entities.BookOffers, {}, 'BookOffers', limiter),
      base44.asServiceRole.entities.Books.count(),
      base44.asServiceRole.entities.Books.count({ merged: true }),
      base44.asServiceRole.entities.BookOffers.count(),
      base44.asServiceRole.entities.BookOffers.count({ merged: true }),
    ]);

    const allBooks = booksScan.records;
    const allOffers = offersScan.records;
    const bookById = new Map(allBooks.map((book) => [book.id, book]));
    const allBookIds = new Set(allBooks.map((book) => book.id));
    const mergedBooks = allBooks.filter((book) => book.merged === true);
    const mergedBookIds = new Set(mergedBooks.map((book) => book.id));
    const targetIds = new Set(mergedBooks.map((book) => String(book.merged_into || '').trim()).filter(Boolean));

    const offersByBookId = new Map();
    const mergedOffers = allOffers.filter((offer) => offer.merged === true);
    let archivedOffersWithBookId = 0;
    let archivedOffersOrphan = 0;
    let archivedOffersPointingToMergedBook = 0;
    let archivedOffersPointingToActiveBook = 0;

    for (const offer of allOffers) {
      const bookId = String(offer.book_id || '').trim();
      if (bookId) {
        if (!offersByBookId.has(bookId)) offersByBookId.set(bookId, []);
        offersByBookId.get(bookId).push(offer);
      }
      if (offer.merged === true) {
        if (bookId) archivedOffersWithBookId += 1;
        if (!bookId || !allBookIds.has(bookId)) archivedOffersOrphan += 1;
        else if (mergedBookIds.has(bookId)) archivedOffersPointingToMergedBook += 1;
        else archivedOffersPointingToActiveBook += 1;
      }
    }

    const counters = {
      total_fusionnees_scannees: mergedBooks.length,
      A_fusion_confirmee: 0,
      B_reference_differente: 0,
      C_reference_introuvable: 0,
      fiches_fusionnees_sans_offre_archivee: 0,
      fiches_fusionnees_sans_cible: 0,
    };
    const reasonBreakdown = {
      B_reference_differente: {},
      C_reference_introuvable: {},
    };
    const examplesA = [];
    const examplesB = [];
    const examplesC = [];

    for (const mergedBook of mergedBooks) {
      const mergedBookOffers = offersByBookId.get(mergedBook.id) || [];
      const historicalOffer = pickCulturaOffer(mergedBookOffers, true);
      const targetBook = bookById.get(String(mergedBook.merged_into || '').trim()) || null;
      const targetOffers = targetBook ? (offersByBookId.get(targetBook.id) || []) : [];
      const currentOffer = pickCulturaOffer(targetOffers, false);

      if (!historicalOffer) counters.fiches_fusionnees_sans_offre_archivee += 1;
      if (!targetBook) counters.fiches_fusionnees_sans_cible += 1;

      const result = classifyReference(mergedBook, targetBook, historicalOffer, currentOffer);
      counters[result.classification] += 1;
      if (result.classification === 'B_reference_differente') addReasons(reasonBreakdown.B_reference_differente, result.reasons);
      if (result.classification === 'C_reference_introuvable') addReasons(reasonBreakdown.C_reference_introuvable, result.reasons);

      const detail = exampleDetail(mergedBook, targetBook, historicalOffer, currentOffer, result);
      if (result.classification === 'A_fusion_confirmee' && examplesA.length < 10) examplesA.push(detail);
      if (result.classification === 'B_reference_differente' && examplesB.length < 30) examplesB.push(detail);
      if (result.classification === 'C_reference_introuvable' && examplesC.length < 30) examplesC.push(detail);
    }

    let targetsWithMultipleActiveCulturaOffers = 0;
    let targetsWithMultipleAllCulturaOffers = 0;
    for (const targetId of targetIds) {
      const targetOffers = offersByBookId.get(targetId) || [];
      const activeCultura = targetOffers.filter((offer) => String(offer.retailer_name || '').toLowerCase() === 'cultura' && offer.merged !== true);
      const allCultura = targetOffers.filter((offer) => String(offer.retailer_name || '').toLowerCase() === 'cultura');
      if (activeCultura.length > 1) targetsWithMultipleActiveCulturaOffers += 1;
      if (allCultura.length > 1) targetsWithMultipleAllCulturaOffers += 1;
    }

    const archivedAttachedMessage = archivedOffersPointingToMergedBook > 0
      ? 'Des offres Cultura archivées sont encore rattachées aux fiches fusionnées.'
      : 'Aucune offre Cultura archivée rattachée aux fiches fusionnées n’a été trouvée avec book_id = fiche merged.';

    return Response.json({
      read_only: true,
      no_write: true,
      no_import: true,
      no_merge: true,
      no_reactivation: true,
      no_checkpoint_modified: true,
      no_secret_exposed: true,
      pagination: {
        limit: AUDIT_PAGE_LIMIT,
        books_pages_scanned: booksScan.pages_scanned,
        offers_pages_scanned: offersScan.pages_scanned,
        stopped_on_has_more_false: booksScan.stopped_on_has_more_false && offersScan.stopped_on_has_more_false,
        logical_skip_progression: true,
        books_final_skip: booksScan.final_skip,
        offers_final_skip: offersScan.final_skip,
        limiter: limiter.metrics(),
      },
      verification: {
        total_fiches_scannees: booksScan.total_scanned,
        total_fiches_reel: realBooksTotal,
        total_fiches_scannees_egale_total_reel: booksScan.total_scanned === realBooksTotal,
        total_fusionnees_scannees: mergedBooks.length,
        total_fusionnees_reel: realMergedBooksTotal,
        total_fusionnees_attendu_7455: mergedBooks.length === 7455,
        total_fusionnees_scannees_egale_total_reel: mergedBooks.length === realMergedBooksTotal,
        total_offres_scannees: offersScan.total_scanned,
        total_offres_reel: realOffersTotal,
        total_offres_scannees_egale_total_reel: offersScan.total_scanned === realOffersTotal,
      },
      archived_offers_presence: {
        total_bookoffers_merged_true: realMergedOffersTotal,
        scanned_bookoffers_merged_true: mergedOffers.length,
        exists: mergedOffers.length > 0,
        archived_cultura_offers_attached_to_merged_books: archivedOffersPointingToMergedBook,
        message: archivedAttachedMessage,
      },
      counters,
      reason_breakdown: reasonBreakdown,
      archived_offer_attachment_state: {
        offres_archivees_merged_conservant_un_book_id: archivedOffersWithBookId,
        offres_archivees_merged_orphelines: archivedOffersOrphan,
        offres_archivees_pointant_sur_fiche_fusionnee: archivedOffersPointingToMergedBook,
        offres_archivees_pointant_sur_fiche_active: archivedOffersPointingToActiveBook,
        cibles_ayant_plusieurs_offres_cultura_actives: targetsWithMultipleActiveCulturaOffers,
        cibles_ayant_plusieurs_offres_cultura_total_actives_et_archivees: targetsWithMultipleAllCulturaOffers,
      },
      examples_B_reference_differente: examplesB,
      examples_C_reference_introuvable: examplesC,
      examples_A_fusion_confirmee: examplesA,
    });
  } catch (error) {
    const status = isRateLimitError(error) ? 429 : 500;
    return Response.json({ error: error.message, rate_limited: isRateLimitError(error), retryable: isRateLimitError(error), read_only: true, no_write: true }, { status });
  }
}