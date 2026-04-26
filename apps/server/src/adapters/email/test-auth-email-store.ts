interface CapturedEmailPayload {
  createdAt: string;
  token: string | null;
  url: string;
}

interface CapturedAuthEmails {
  reset: CapturedEmailPayload | null;
  verification: CapturedEmailPayload | null;
}

const capturedAuthEmails = new Map<string, CapturedAuthEmails>();

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const parseTokenFromUrl = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get("token");
  } catch {
    return null;
  }
};

const getOrCreateRecord = (email: string): CapturedAuthEmails => {
  const key = normalizeEmail(email);
  const existingRecord = capturedAuthEmails.get(key);

  if (existingRecord) {
    return existingRecord;
  }

  const nextRecord: CapturedAuthEmails = {
    reset: null,
    verification: null,
  };

  capturedAuthEmails.set(key, nextRecord);

  return nextRecord;
};

export const captureVerificationEmail = (email: string, url: string): void => {
  const record = getOrCreateRecord(email);
  record.verification = {
    createdAt: new Date().toISOString(),
    token: parseTokenFromUrl(url),
    url,
  };
};

export const capturePasswordResetEmail = (email: string, url: string, token: string): void => {
  const record = getOrCreateRecord(email);
  record.reset = {
    createdAt: new Date().toISOString(),
    token,
    url,
  };
};

export const getCapturedAuthEmails = (email: string): CapturedAuthEmails | null => {
  const record = capturedAuthEmails.get(normalizeEmail(email));
  return record ?? null;
};

export const clearCapturedAuthEmails = (email: string): void => {
  capturedAuthEmails.delete(normalizeEmail(email));
};

export const clearAllCapturedAuthEmails = (): void => {
  capturedAuthEmails.clear();
};
