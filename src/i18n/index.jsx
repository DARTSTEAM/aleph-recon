import React, { createContext, useContext, useState, useCallback } from 'react';
import { en } from './en';
import { es } from './es';

const dictionaries = { en, es };

const LanguageContext = createContext(null);

const LS_KEY = 'aleph-lang';

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(LS_KEY) || 'en');

  const setLang = useCallback((next) => {
    setLangState(next);
    localStorage.setItem(LS_KEY, next);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'es' : 'en');
  }, [lang, setLang]);

  /**
   * t('key') → translated string
   * t('key', { n: 5 }) → translated string with {n} replaced by 5
   */
  const t = useCallback((key, params = {}) => {
    const dict = dictionaries[lang] || dictionaries.en;
    let str = dict[key] ?? dictionaries.en[key] ?? key;
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    return str;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useT must be used inside <LanguageProvider>');
  return ctx;
}
