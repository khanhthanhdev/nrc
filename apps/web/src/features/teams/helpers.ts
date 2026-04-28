export const TEAM_IMAGE_UPLOAD_PATH = "/api/upload/image";

const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+.-]*:/i;

export const buildTeamImageUploadUrl = (key: string, serverUrl: string): string => {
  const url = new URL(TEAM_IMAGE_UPLOAD_PATH, serverUrl);
  url.searchParams.set("key", key);
  return url.toString();
};

export const getTeamImageUploadKey = (imageUrl: string, serverUrl?: string): string | null => {
  const parseUrl = (base?: string): string | null => {
    try {
      const url = base ? new URL(imageUrl, base) : new URL(imageUrl);

      if (url.pathname !== TEAM_IMAGE_UPLOAD_PATH) {
        return null;
      }

      const key = url.searchParams.get("key")?.trim();
      return key ? key : null;
    } catch {
      return null;
    }
  };

  return parseUrl() ?? (serverUrl ? parseUrl(serverUrl) : null);
};

export const resolveTeamImageUrl = (
  imageUrlOrKey: string | null | undefined,
  serverUrl: string,
): string | undefined => {
  const value = imageUrlOrKey?.trim();

  if (!value) {
    return undefined;
  }

  if (ABSOLUTE_URL_PATTERN.test(value) || value.startsWith("/")) {
    return value;
  }

  return buildTeamImageUploadUrl(value, serverUrl);
};
