import { useState, useCallback } from "react";

export type AppLanguage = "en" | "hi" | "od";

export const LANGUAGE_LABELS: Record<AppLanguage, { short: string; native: string; flag: string }> = {
  en: { short: "EN", native: "English", flag: "🇬🇧" },
  hi: { short: "HI", native: "हिंदी", flag: "🇮🇳" },
  od: { short: "OD", native: "ଓଡ଼ିଆ", flag: "🇮🇳" },
};

export const useLanguage = () => {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem("bloomsense-language");
    return (saved as AppLanguage) || "en";
  });

  const changeLanguage = useCallback((lang: AppLanguage) => {
    setLanguage(lang);
    localStorage.setItem("bloomsense-language", lang);
  }, []);

  return { language, changeLanguage };
};
