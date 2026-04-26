import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getStoredLang, setStoredLang, getLangDir, type Language } from './index';
import { t as translate } from './translations/index';

interface LanguageContextType {
  lang: Language;
  changeLang: (l: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(getStoredLang);

  useEffect(() => {
    const dir = getLangDir(lang);
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const changeLang = useCallback((newLang: Language) => {
    setStoredLang(newLang);
    setLang(newLang);
  }, []);

  const t = useCallback(
    (key: string): string => translate(lang, key),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{
      lang,
      changeLang,
      t,
      isRTL: getLangDir(lang) === 'rtl',
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguageContext must be used within LanguageProvider');
  return ctx;
}
