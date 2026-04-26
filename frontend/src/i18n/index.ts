// frontend/src/i18n/index.ts

export type Language = 'en' | 'ms' | 'ar';

export const LANGUAGES: { code: Language; label: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'English',       dir: 'ltr' },
  { code: 'ms', label: 'Bahasa Melayu', dir: 'ltr' },
  { code: 'ar', label: 'العربية',       dir: 'rtl' },
];

export const DEFAULT_LANG: Language = 'en';

export function getStoredLang(): Language {
  const stored = localStorage.getItem('lang') as Language;
  return LANGUAGES.find(l => l.code === stored) ? stored : DEFAULT_LANG;
}

export function setStoredLang(lang: Language): void {
  localStorage.setItem('lang', lang);
}

export function getLangDir(lang: Language): 'ltr' | 'rtl' {
  return LANGUAGES.find(l => l.code === lang)?.dir ?? 'ltr';
}