export const AUDIT_PAGE_LIMIT = 500;

export function rowsFrom(page) {
  return page?.items || page || [];
}

export async function scanAllEntityPages(entity, query = {}, label = 'Entity', limiter, limit = AUDIT_PAGE_LIMIT) {
  let cursor = undefined;
  let skip = 0;
  let pages = 0;
  const records = [];

  while (true) {
    const run = () => entity.filter(query, { limit, cursor, skip, sort: 'created_date' });
    const page = limiter ? await limiter.list(run, `${label}.filter`) : await run();
    const items = rowsFrom(page);
    records.push(...items);
    pages += 1;

    if (!page?.has_more) {
      return { label, records, total_scanned: records.length, pages_scanned: pages, final_skip: skip, stopped_on_has_more_false: true };
    }

    if (!page.next_cursor) {
      throw new Error(`${label}: pagination incomplète, has_more=true sans next_cursor après ${pages} pages`);
    }

    cursor = page.next_cursor;
    skip += limit;
  }
}

export function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}