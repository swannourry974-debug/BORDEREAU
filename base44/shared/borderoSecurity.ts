export function getFormatLivre(livreType) {
  if (livreType === 'Broché') return 'M';
  if (livreType === 'BD' || livreType === 'Relié') return 'L';
  return 'S';
}

export function assertFormatCoherent(livreType, format) {
  return getFormatLivre(livreType) === format;
}

function toBase64Url(value) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  return atob(padded);
}

export async function hashSecurity(commandeId, lecteurId, formatLivre, secret) {
  const input = `${commandeId}|${lecteurId}|${formatLivre}|${secret}`;
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(bytes)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function makeToken(payload) {
  return `BORDERO-SECURE:${toBase64Url(JSON.stringify(payload))}`;
}

export function parseToken(token) {
  if (!token || !token.startsWith('BORDERO-SECURE:')) return null;
  try {
    return JSON.parse(fromBase64Url(token.replace('BORDERO-SECURE:', '')));
  } catch {
    return null;
  }
}