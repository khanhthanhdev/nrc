import { useEffect, useState } from "react";

import { I18nextProvider } from "react-i18next";

import i18n from "./config";

const getActiveLanguage = () => i18n.resolvedLanguage ?? i18n.language ?? "en";

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [languageRevision, setLanguageRevision] = useState(0);

  useEffect(() => {
    const syncLanguage = (language?: string) => {
      document.documentElement.lang = language ?? getActiveLanguage();
      setLanguageRevision((currentRevision) => currentRevision + 1);
    };

    syncLanguage();
    i18n.on("languageChanged", syncLanguage);

    return () => {
      i18n.off("languageChanged", syncLanguage);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <div data-language-revision={languageRevision}>{children}</div>
    </I18nextProvider>
  );
};
