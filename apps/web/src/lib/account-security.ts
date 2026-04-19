export interface LinkedAuthAccount {
  providerId: string;
}

export const hasCredentialProvider = (
  accounts: readonly LinkedAuthAccount[] | null | undefined,
): boolean => {
  if (!accounts) {
    return false;
  }

  return accounts.some((account) => account.providerId === "credential");
};
