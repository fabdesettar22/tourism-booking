// frontend/src/i18n/translations/index.ts

import { en } from './en';
import { ms } from './ms';
import { ar } from './ar';
import type { Language } from '../index';

export const translations = { en, ms, ar };

export function t(lang: Language, key: string): string {
  const keys = key.split('.');
  let result: unknown = translations[lang];

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      // fallback to English
      let fallback: unknown = translations['en'];
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = (fallback as Record<string, unknown>)[fk];
        } else {
          return key;
        }
      }
      return typeof fallback === 'string' ? fallback : key;
    }
  }

  return typeof result === 'string' ? result : key;
}