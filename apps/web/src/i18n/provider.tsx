import { useEffect } from "react";

import { I18nextProvider } from "react-i18next";

import i18n from "./config";

const getActiveLanguage = () => i18n.resolvedLanguage ?? i18n.language ?? "en";

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const syncLanguage = (language?: string) => {
      document.documentElement.lang = language ?? getActiveLanguage();
    };

    syncLanguage();
    i18n.on("languageChanged", syncLanguage);

    return () => {
      i18n.off("languageChanged", syncLanguage);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <>{children}</>
    </I18nextProvider>
  );
};
