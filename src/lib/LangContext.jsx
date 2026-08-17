import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { translations, detectBrowserLanguage } from './i18n/index';

const STORAGE_KEY = 'bordereau_lang';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) return saved;
    return detectBrowserLanguage();
  });

  useEffect(() => {
    base44.auth.me().then((user) => {
      if (user?.preferred_language && translations[user.preferred_language]) {
        localStorage.setItem(STORAGE_KEY, user.preferred_language);
        setLangState(user.preferred_language);
      }
    }).catch(() => {});
  }, []);

  const setLang = useCallback((code) => {
    if (!translations[code]) return;
    localStorage.setItem(STORAGE_KEY, code);
    setLangState(code);
    base44.auth.updateMe({ preferred_language: code }).catch(() => {});
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