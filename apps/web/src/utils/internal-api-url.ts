let warnedAboutLocalhostFallback = false;

export const getInternalApiUrl = (): string => {
  const internal = process.env.VITE_API_URL ?? process.env.VITE_SERVER_URL;

  if (internal?.startsWith("http://") || internal?.startsWith("https://")) {
    return internal.replace(/\/+$/, "");
  }

  if (
    process.env.NODE_ENV !== "development" &&
    process.env.NODE_ENV !== "test" &&
    !warnedAboutLocalhostFallback
  ) {
    warnedAboutLocalhostFallback = true;
    console.warn(
      "VITE_API_URL/VITE_SERVER_URL is unset or invalid during SSR; falling back to http://localhost:3000.",
    );
  }

  return "http://localhost:3000";
};
