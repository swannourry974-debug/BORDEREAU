import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, detectBrowserLanguage } from './i18n/index';

const STORAGE_KEY = 'bordereau_lang';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) return saved;
    const detected = detectBrowserLanguage();
    localStorage.setItem(STORAGE_KEY, detected);
    return detected;
  });

  const setLang = useCallback((code) => {
    if (!translations[code]) return;
    localStorage.setItem(STORAGE_KEY, code);
    setLangState(code);
  }, []);

  /** t('key') or t('key', { n: 3 }) for interpolation */
  const t = useCallback((key, vars) => {
    const dict = translations[lang] || translations.fr;
    let str = dict[key] ?? translations.fr[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replaceAll(`{${k}}`, v);
      });
    }
    return str;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}