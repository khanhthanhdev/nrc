export const toBrowserCallbackURL = (path: string): string => {
  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
};
