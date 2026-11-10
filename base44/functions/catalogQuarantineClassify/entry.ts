import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { cleanEan, normalizeText } from '../../shared/catalogUtils.ts';
import { fetchAll } from '../../shared/catalogAuditUtils.ts';

const CATEGORIES = ['livres', 'produits_editoriaux', 'papeterie_non_eligible', 'invalides_indetermines'];

function example(row, classification) {
  return {
    id: row.id,
    ean_raw: row.ean_raw || '',
    title: row.title || '',
    reason: row.reason || '',
    feed_id: row.feed_id || '',
    product_identifier: row.product_identifier || '',
    classification,
  };
}

function hasAny(text, words) {
  return words.some((word) => text.includes(normalizeText(word)));
}

function classify(row = {}) {
  const title = String(row.title || '').trim();
  const text = normalizeText(`${row.category || ''} ${title}`);
  const ean = cleanEan(row.ean_raw || row.product_identifier || '');
  if (!ean || !title || title.length < 3) return 'invalides_indetermines';

  const collectionNotebook = text.includes('carnet de collection') || text.includes('carnet collector') || text.includes('carnet litteraire');
  const hardNonEligible = ['bloc notes', 'bloc note', 'stylo', 'poster', 'carte postale', 'cartes postales', 'marque page', 'marque pages', 't shirt', 'tee shirt', 'figurine', 'blu ray', 'bluray', 'cd', 'dvd'];
  if (!collectionNotebook && (hasAny(text, hardNonEligible) || (text.includes('carnet') && !text.includes('coffret')))) return 'papeterie_non_eligible';

  const editorialTerms = ['coffret', 'integrale', 'intégrale', 'pack', 'album', 'agenda', 'collector', 'lot', 'box', 'tome', 'manga', 'bd', 'comics'];
  if (collectionNotebook || hasAny(text, editorialTerms)) return 'produits_editoriaux';

  const bookTerms = ['roman', 'livre', 'poche', 'litterature', 'littérature', 'essai', 'recit', 'récit', 'jeunesse', 'histoire', 'science humaine', 'auteur', 'autrice'];
  if (String(ean).startsWith('978') || String(ean).startsWith('979') || hasAny(text, bookTerms)) return 'livres';

  return 'invalides_indetermines';
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const rows = await fetchAll(base44.asServiceRole.entities.ImportRejection, { reviewed: false }, { sort: '-created_date', maxPages: 80 });
    const counters = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
    const examples = Object.fromEntries(CATEGORIES.map((category) => [category, []]));

    for (const row of rows) {
      const category = classify(row);
      counters[category] += 1;
      if (examples[category].length < 10) examples[category].push(example(row, category));
    }

    return Response.json({
      read_only: true,
      reviewed_filter: false,
      total_unreviewed_scanned: rows.length,
      counters,
      examples,
      estimated_integrable_references: counters.livres + counters.produits_editoriaux,
      no_import: true,
      no_deletion: true,
      no_secret_or_datafeed_url_exposed: true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}