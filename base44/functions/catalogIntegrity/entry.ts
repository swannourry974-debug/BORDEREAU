import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildCatalogRelations, compactBook, compactOffer, duplicateBookGroups, fetchAll } from '../../shared/catalogAuditUtils.ts';

function diagnosisFrom(relations, duplicateBooks) {
  const parts = [];
  if (relations.orphanOffers.length && relations.booksWithoutOffer.length) parts.push('Des offres pointent vers des book_id inexistants tandis que des fiches Books restent sans offre : cela indique probablement des offres rattachées à d’anciennes fiches après recréation ou fusion non finalisée.');
  if (duplicateBooks.product_identifier.length || duplicateBooks.isbn13.length) parts.push('Des fiches Books partagent un même identifiant produit ou ISBN-13 : une fusion canonique est nécessaire avant validation finale.');
  if (relations.duplicateOfferGroups.length) parts.push('Des offres actives existent en double pour un même couple book_id + retailer_name : conserver la plus récente et marquer les autres comme fusionnées suffit, sans suppression.');
  if (!parts.length) parts.push('Aucune rupture relationnelle active majeure détectée entre Books et BookOffers.');
  return parts.join(' ');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const [books, offers] = await Promise.all([
      fetchAll(base44.asServiceRole.entities.Books, {}, { sort: '-created_date' }),
      fetchAll(base44.asServiceRole.entities.BookOffers, {}, { sort: '-updated_date' }),
    ]);
    const relations = buildCatalogRelations(books, offers);
    const duplicateBooks = duplicateBookGroups(books);
    const offersWithValidBookId = offers.filter((offer) => String(offer.book_id || '').trim() && relations.bookById.has(String(offer.book_id || '').trim())).length;

    return Response.json({
      read_only: true,
      total_books_scanned: books.length,
      total_offers_scanned: offers.length,
      offers_with_valid_book_id: offersWithValidBookId,
      offers_without_book_id: relations.offersWithoutBookId.length,
      offers_orphan_book_id: relations.orphanOffers.length,
      distinct_book_ids_in_offers: relations.allOfferBookIds.size,
      books_with_offer: relations.booksWithOffer.length,
      books_without_offer: relations.booksWithoutOffer.length,
      books_without_offer_list: {
        total: relations.booksWithoutOffer.length,
        items: relations.booksWithoutOffer.slice(0, 50).map(compactBook),
      },
      orphan_offers_list: {
        total: relations.orphanOffers.length,
        items: relations.orphanOffers.slice(0, 50).map(compactOffer),
      },
      duplicate_offers_same_book_retailer: relations.duplicateOfferGroups.length,
      books_with_multiple_offers: relations.booksWithMultipleOffers,
      duplicate_books_same_identifier: {
        total_groups: duplicateBooks.product_identifier.length + duplicateBooks.isbn13.length,
        by_product_identifier: duplicateBooks.product_identifier.length,
        by_isbn13: duplicateBooks.isbn13.length,
        examples: [
          ...duplicateBooks.product_identifier.slice(0, 10).map(([identifier, group]) => ({ type: 'product_identifier', identifier, count: group.length, book_ids: group.map((book) => book.id) })),
          ...duplicateBooks.isbn13.slice(0, 10).map(([identifier, group]) => ({ type: 'isbn13', identifier, count: group.length, book_ids: group.map((book) => book.id) })),
        ].slice(0, 20),
      },
      diagnosis: diagnosisFrom(relations, duplicateBooks),
      no_deletion: true,
      no_secret_or_datafeed_url_exposed: true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}