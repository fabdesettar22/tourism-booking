// frontend/src/hooks/useLanguage.ts
// يُعيد توجيه إلى LanguageContext لمشاركة الحالة بين كل المكوّنات

import { useLanguageContext } from '../i18n/LanguageContext';

export function useLanguage() {
  return useLanguageContext();
}
