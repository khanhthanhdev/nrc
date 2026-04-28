export const supportedLocales = ["en", "vi"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

const localePrefixPattern = /^\/(en|vi)(?=\/|$)/;

export const isSupportedLocale = (value: string | null | undefined): value is SupportedLocale =>
  value === "en" || value === "vi";

export const getSupportedLocale = (value: string | null | undefined): SupportedLocale =>
  isSupportedLocale(value) ? value : "en";

export const getLocaleFromPathname = (pathname: string): SupportedLocale | null => {
  const match = pathname.match(localePrefixPattern);

  return isSupportedLocale(match?.[1]) ? match[1] : null;
};

export const stripLocaleFromPathname = (pathname: string): string => {
  const normalizedPath = pathname.replace(localePrefixPattern, "");

  return normalizedPath === "" ? "/" : normalizedPath;
};

export const localizePathname = (pathname: string, locale: SupportedLocale): string => {
  const normalizedPath = stripLocaleFromPathname(pathname);

  return normalizedPath === "/" ? `/${locale}` : `/${locale}${normalizedPath}`;
};
