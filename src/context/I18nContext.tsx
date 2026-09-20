import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';
import { translations, TranslationDict } from '../i18n/translations';

export const LANGUAGE_LABELS: Record<SupportedLanguage, { code: string; name: string }> = {
  fr: { code: 'FR', name: 'Français' },
  en: { code: 'EN', name: 'English' },
  sw: { code: 'SW', name: 'Kiswahili' },
  lng: { code: 'LNG', name: 'Lingala' },
  ha: { code: 'HA', name: 'Hausa' },
  pt: { code: 'PT', name: 'Português' },
  ar: { code: 'AR', name: 'العربية' },
  es: { code: 'ES', name: 'Español' },
  zh: { code: 'ZH', name: '中文' },
  hi: { code: 'HI', name: 'हिन्दी' },
};

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationDict;
  isRTL: boolean;
}

export const I18nContext = createContext<I18nContextType>({
  language: 'fr',
  setLanguage: () => {},
  t: translations.fr,
  isRTL: false,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('nnecxy_language') as SupportedLanguage;
      if (saved && translations[saved]) return saved;
    } catch {
      // ignore
    }
    return 'fr'; // default language
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('nnecxy_language', lang);
    } catch {
      // ignore
    }
  };

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = translations[language] || translations.fr;

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
