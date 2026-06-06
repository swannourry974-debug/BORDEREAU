import React from 'react';
import { useLang } from '@/lib/LangContext';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/index';

export default function LangSwitcher() {
  const { lang, setLang, t } = useLang();

  return (
    <div>
      <div style={{
        fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2,
        textTransform: 'uppercase', color: 'rgba(26,16,8,0.45)', marginBottom: 12,
      }}>
        {t('profil_langue')}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {SUPPORTED_LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            style={{
              flex: 1, padding: '10px 6px', cursor: 'pointer',
              fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 1,
              textAlign: 'center',
              background: lang === code ? 'var(--bordeaux)' : 'transparent',
              color: lang === code ? 'var(--creme)' : 'rgba(26,16,8,0.6)',
              border: lang === code ? 'none' : '1px dashed rgba(26,16,8,0.25)',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}