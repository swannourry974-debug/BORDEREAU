import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { classifyCatalogRecord, CATALOG_CLASSIFICATIONS } from '../../shared/catalogClassification.ts';
import { fetchAll } from '../../shared/catalogAuditUtils.ts';

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

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const rows = await fetchAll(base44.asServiceRole.entities.ImportRejection, { reviewed: false }, { sort: '-created_date', maxPages: 80 });
    const counters = Object.fromEntries(CATALOG_CLASSIFICATIONS.map((category) => [category, 0]));
    const examples = Object.fromEntries(CATALOG_CLASSIFICATIONS.map((category) => [category, []]));

    for (const row of rows) {
      const classification = classifyCatalogRecord({ title: row.title || '', category: row.category || '', product_type: row.product_type || '', isbn_valid: row.isbn_valid === true });
      counters[classification] += 1;
      if (examples[classification].length < 10) examples[classification].push(example(row, classification));
    }

    return Response.json({
      read_only: true,
      reviewed_filter: false,
      total_unreviewed_scanned: rows.length,
      counters,
      examples,
      estimated_integrable_references: counters.livre + counters.produit_editorial,
      no_import: true,
      no_deletion: true,
      no_secret_or_datafeed_url_exposed: true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}