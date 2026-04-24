import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import viCommon from "./locales/vi/common.json";

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    defaultNS: "common",
    detection: {
      caches: ["localStorage"],
      order: ["localStorage", "navigator", "htmlTag"],
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    ns: ["common"],
    resources: {
      en: {
        common: enCommon,
      },
      vi: {
        common: viCommon,
      },
    },
    supportedLngs: ["en", "vi"],
  });

export default i18n;
