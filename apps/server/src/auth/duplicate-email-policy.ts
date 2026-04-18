export interface AccountProvider {
  providerId: string;
}

export const normalizeEmailForLookup = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.toLowerCase().trim();

  return normalized.length > 0 ? normalized : null;
};

export const shouldBlockCredentialSignUpForGoogleOnlyAccount = (
  providers: readonly AccountProvider[],
): boolean => {
  const hasCredential = providers.some((provider) => provider.providerId === "credential");
  const hasGoogle = providers.some((provider) => provider.providerId === "google");

  return hasGoogle && !hasCredential;
};
