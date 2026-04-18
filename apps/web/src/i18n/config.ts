import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .init({
    backend: {
      loadPath: "/locales//.json",
    },
    defaultNS: "common",
    detection: {
      caches: ["localStorage"],
      order: ["navigator", "htmlTag"],
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    ns: ["common"],
    supportedLngs: ["en", "en"],
  });

export default i18n;
