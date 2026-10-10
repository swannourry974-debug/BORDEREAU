export function normalizeIsbn(value = '') {
  return String(value).toUpperCase().replace(/[^0-9X]/g, '');
}

export function isValidIsbn10(isbn) {
  const clean = normalizeIsbn(isbn);
  if (!/^\d{9}[0-9X]$/.test(clean)) return false;
  const sum = clean.split('').reduce((total, char, index) => {
    const value = char === 'X' ? 10 : Number(char);
    return total + value * (10 - index);
  }, 0);
  return sum % 11 === 0;
}

export function isValidIsbn13(isbn) {
  const clean = normalizeIsbn(isbn);
  if (!/^97[89]\d{10}$/.test(clean)) return false;
  const sum = clean.split('').reduce((total, char, index) => total + Number(char) * (index % 2 === 0 ? 1 : 3), 0);
  return sum % 10 === 0;
}

export function isValidIsbn(isbn) {
  const clean = normalizeIsbn(isbn);
  return clean.length === 10 ? isValidIsbn10(clean) : isValidIsbn13(clean);
}

export function extractValidIsbn(value = '') {
  const clean = normalizeIsbn(value);
  const candidates = [
    ...clean.match(/97[89]\d{10}/g) || [],
    ...clean.match(/\d{9}[0-9X]/g) || [],
  ];
  return candidates.find(isValidIsbn) || null;
}