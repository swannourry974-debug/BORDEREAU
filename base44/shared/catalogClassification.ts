function normalizeBasic(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const CATALOG_CLASSIFICATIONS = ['livre', 'revue', 'produit_editorial', 'non_eligible'];

export function normalizeAuthorForMatch(value = '') {
  return normalizeBasic(value);
}

export function isGenericAuthorName(value = '') {
  const author = normalizeAuthorForMatch(value);
  if (!author) return true;
  if (['collectif', 'divers', 'anonyme', 'auteur inconnu', 'auteurs inconnus', 'autrice inconnue', 'autrices inconnues'].includes(author)) return true;
  if (/^auteurs? divers$/.test(author) || /^divers auteurs?$/.test(author)) return true;
  if (/^collectif d auteurs?$/.test(author) || /^collectif d autrices?$/.test(author)) return true;
  if (author.includes('collectif') && /auteurs?|autrices?/.test(author)) return true;
  return false;
}

function hasAny(text, words) {
  return words.some((word) => text.includes(normalizeBasic(word)));
}

function hasMagazineName(text) {
  const known = [
    'lire magazine', 'magazine lire', 'le monde la vie', 'monde la vie', 'arkeo junior', 'archeo junior',
    'virgule', 'science vie', 'science et vie', 'science & vie', 'science junior', 'histoire junior',
    'j aime lire', 'je bouquine', 'phosphore', 'okapi', 'astrapi'
  ];
  if (hasAny(text, known)) return true;
  return /\blire\b/.test(text) && (text.includes('magazine') || text.includes('hors serie') || /\b(?:numero|n)\s+\d+\b/.test(text));
}

function hasPedagogicalBookContext(text) {
  return hasAny(text, ['livre de l eleve', 'manuel', 'methode', 'cahier d exercices']);
}

function hasPedagogicalPublisher(text) {
  return hasAny(text, ['hachette fle', 'didier', 'cle international', 'maison des langues', 'nathan', 'bordas', 'hatier', 'magnard', 'belin', 'assimil', 'pearson', 'cambridge', 'oxford']);
}

function isStationeryAgenda(text) {
  if (!text.includes('agenda')) return false;
  return hasAny(text, ['semainier', 'agenda scolaire', 'agenda de bureau']) || /\b(?:19|20)\d{2}\b/.test(text);
}

export function classifyCatalogRecord({ title = '', category = '', product_type = '', isbn_valid = false, author = '', publisher = '' } = {}) {
  const text = normalizeBasic(`${category} ${title}`);
  const sourceText = normalizeBasic(`${text} ${author} ${publisher}`);
  if (!text) return 'livre';

  if (text.includes('agenda') && (hasPedagogicalBookContext(text) || (isbn_valid && hasPedagogicalPublisher(sourceText)))) return 'livre';

  if (hasAny(text, ['magazine', 'revue', 'periodique', 'hors serie', 'trimestriel', 'mensuel', 'bimensuel']) || /\b(?:numero|n)\s+\d+\b/.test(text) || hasMagazineName(text)) return 'revue';

  const stationeryAgenda = isStationeryAgenda(text);
  const editorialAgenda = text.includes('agenda') && !stationeryAgenda && hasAny(text, ['sempe', 'litteraire', 'lecture', 'bd', 'manga', 'illustre', 'illustration', 'collector', 'edition']);
  const nonEligibleWords = ['pochette surprise', 'blind box', 'goodies', 'figurine', 'peluche', 't shirt', 'tee shirt', 'poster', 'carte postale', 'cartes postales', 'marque page', 'marque pages', 'dvd', 'blu ray', 'bluray', 'cd', 'coffret cd', 'jeu', 'jouet', 'papeterie', 'carnet', 'bloc notes', 'bloc note', 'stylo', 'stylos'];
  if (hasAny(text, nonEligibleWords) || stationeryAgenda) return 'non_eligible';

  const editorialWords = ['coffret bd', 'coffret bande dessinee', 'coffret manga', 'integrale', 'pack de volumes', 'pack volumes', 'album illustre', 'agenda sempe', 'edition collector', 'collector'];
  if (editorialAgenda || hasAny(text, editorialWords)) return 'produit_editorial';
  if (text.includes('coffret') && hasAny(text, ['bd', 'bande dessinee', 'manga', 'comics', 'roman', 'livre', 'album'])) return 'produit_editorial';
  if (text.includes('pack') && hasAny(text, ['tome', 'volumes', 'livres', 'manga', 'bd'])) return 'produit_editorial';
  if (product_type === 'produit_editorial' && !isbn_valid) return 'produit_editorial';

  return 'livre';
}

export function isSearchVisible(book = {}) {
  return String(book.classification || book.product_type || 'livre') !== 'non_eligible';
}

export function isSuggestionEligible(book = {}) {
  const classification = String(book.classification || book.product_type || 'livre');
  return classification === 'livre' || classification === 'produit_editorial';
}