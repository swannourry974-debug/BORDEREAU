import fr from './fr';
import en from './en';
import es from './es';

export const translations = { fr, en, es };

export const SUPPORTED_LANGUAGES = [
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'es', label: '🇪🇸 Español' },
];

/** Detect best language from browser, fallback to 'fr' */
export function detectBrowserLanguage() {
  const langs = navigator.languages || [navigator.language || 'fr'];
  for (const l of langs) {
    const code = l.slice(0, 2).toLowerCase();
    if (translations[code]) return code;
  }
  return 'fr';
}