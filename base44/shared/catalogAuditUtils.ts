export function rowsFrom(page) {
  return page?.items || page?.rows || page || [];
}

export async function fetchAll(entity, query = {}, options = {}) {
  const limit = Math.min(Number(options.limit || 500), 500);
  const sort = options.sort;
  const maxPages = Math.max(1, Number(options.maxPages || 40));
  let cursor = undefined;
  const output = [];
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const page = await entity.filter(query, { limit, cursor, ...(sort ? { sort } : {}) });
    const items = rowsFrom(page);
    output.push(...items);
    if (!page?.has_more || !page?.next_cursor) break;
    cursor = page.next_cursor;
  }
  return output;
}

export function isMerged(record = {}) {
  return record.merged === true;
}

export function compactBook(book = {}) {
  return {
    id: book.id,
    product_identifier: book.product_identifier || '',
    isbn13: book.isbn13 || '',
    title: book.title || '',
    category: book.category || '',
    created_date: book.created_date || '',
    merged: book.merged === true,
    merged_into: book.merged_into || '',
  };
}

export function compactOffer(offer = {}) {
  return {
    id: offer.id,
    book_id: offer.book_id || '',
    retailer_name: offer.retailer_name || '',
    retailer_product_id: offer.retailer_product_id || '',
    price: offer.price || 0,
    merged: offer.merged === true,
    merged_into: offer.merged_into || '',
  };
}

export function buildCatalogRelations(books = [], offers = []) {
  const bookById = new Map(books.map((book) => [book.id, book]));
  const activeBooks = books.filter((book) => !isMerged(book));
  const activeOffers = offers.filter((offer) => !isMerged(offer));
  const activeOfferBookIds = new Set(activeOffers.map((offer) => String(offer.book_id || '').trim()).filter(Boolean));
  const allOfferBookIds = new Set(offers.map((offer) => String(offer.book_id || '').trim()).filter(Boolean));
  const offersWithoutBookId = offers.filter((offer) => !String(offer.book_id || '').trim());
  const orphanOffers = offers.filter((offer) => {
    const bookId = String(offer.book_id || '').trim();
    return bookId && !bookById.has(bookId);
  });
  const booksWithOffer = activeBooks.filter((book) => activeOfferBookIds.has(book.id));
  const booksWithoutOffer = activeBooks.filter((book) => !activeOfferBookIds.has(book.id));
  const offersByBook = new Map();
  for (const offer of activeOffers) {
    const bookId = String(offer.book_id || '').trim();
    if (!bookId) continue;
    if (!offersByBook.has(bookId)) offersByBook.set(bookId, []);
    offersByBook.get(bookId).push(offer);
  }
  const duplicateOfferGroups = [];
  const offerGroups = new Map();
  for (const offer of activeOffers) {
    const bookId = String(offer.book_id || '').trim();
    const retailer = String(offer.retailer_name || '').trim();
    if (!bookId || !retailer) continue;
    const key = `${bookId}||${retailer}`;
    if (!offerGroups.has(key)) offerGroups.set(key, []);
    offerGroups.get(key).push(offer);
  }
  for (const [key, group] of offerGroups.entries()) {
    if (group.length > 1) duplicateOfferGroups.push({ key, offers: group });
  }
  const booksWithMultipleOffers = [...offersByBook.values()].filter((group) => group.length > 1).length;
  return {
    bookById,
    activeBooks,
    activeOffers,
    activeOfferBookIds,
    allOfferBookIds,
    offersWithoutBookId,
    orphanOffers,
    booksWithOffer,
    booksWithoutOffer,
    offersByBook,
    duplicateOfferGroups,
    booksWithMultipleOffers,
  };
}

export function duplicateBookGroups(books = []) {
  const byProductIdentifier = new Map();
  const byIsbn13 = new Map();
  for (const book of books.filter((item) => !isMerged(item))) {
    const productIdentifier = String(book.product_identifier || '').trim();
    const isbn13 = String(book.isbn13 || '').trim();
    if (productIdentifier) {
      if (!byProductIdentifier.has(productIdentifier)) byProductIdentifier.set(productIdentifier, []);
      byProductIdentifier.get(productIdentifier).push(book);
    }
    if (isbn13) {
      if (!byIsbn13.has(isbn13)) byIsbn13.set(isbn13, []);
      byIsbn13.get(isbn13).push(book);
    }
  }
  return {
    product_identifier: [...byProductIdentifier.entries()].filter(([, group]) => group.length > 1),
    isbn13: [...byIsbn13.entries()].filter(([, group]) => group.length > 1),
  };
}

export function newestOffer(offers = []) {
  return [...offers].sort((a, b) => String(b.last_updated || b.updated_date || b.created_date || '').localeCompare(String(a.last_updated || a.updated_date || a.created_date || '')))[0] || null;
}