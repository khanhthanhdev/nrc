import type { TFunction } from "i18next";

import type {
  AdminSeasonAnnouncement,
  AdminSeasonDocument,
  PublicSeasonDocument,
  PublicSeasonEvent,
} from "./types";

type DocumentLike = Pick<PublicSeasonDocument | AdminSeasonDocument, "id" | "title" | "url">;
type AnnouncementLike = Pick<AdminSeasonAnnouncement, "publishedAt">;

export interface SeasonHeroCtas {
  primary: DocumentLike | null;
  secondary: DocumentLike | null;
}

export interface SeasonStatusMeta {
  badgeClassName: string;
  labelKey: string;
}

export const SEASON_DOCUMENT_UPLOAD_PATH = "/api/upload/document";

const MANUAL_DOCUMENT_PATTERN =
  /\b(manual|guide|handbook|rulebook|rules|game\s+manual|competition\s+manual)\b/i;

const shortDateFormatterCache = new Map<string, Intl.DateTimeFormat>();
const longDateFormatterCache = new Map<string, Intl.DateTimeFormat>();
const dayFormatterCache = new Map<string, Intl.DateTimeFormat>();

const getShortDateFormatter = (locale: string) => {
  const cacheKey = locale;

  if (!shortDateFormatterCache.has(cacheKey)) {
    shortDateFormatterCache.set(
      cacheKey,
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    );
  }

  return shortDateFormatterCache.get(cacheKey)!;
};

const getLongDateFormatter = (locale: string) => {
  const cacheKey = locale;

  if (!longDateFormatterCache.has(cacheKey)) {
    longDateFormatterCache.set(
      cacheKey,
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        year: "numeric",
      }),
    );
  }

  return longDateFormatterCache.get(cacheKey)!;
};

const getDayFormatter = (locale: string) => {
  const cacheKey = locale;

  if (!dayFormatterCache.has(cacheKey)) {
    dayFormatterCache.set(
      cacheKey,
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
      }),
    );
  }

  return dayFormatterCache.get(cacheKey)!;
};

export const deriveSeasonHeroCtas = (documents: DocumentLike[]): SeasonHeroCtas => {
  const primary =
    documents.find((document) => MANUAL_DOCUMENT_PATTERN.test(document.title)) ?? null;
  const secondary = documents.find((document) => document.id !== primary?.id) ?? null;

  return {
    primary,
    secondary,
  };
};

export const buildSeasonDocumentUploadUrl = (key: string, serverUrl: string): string => {
  const url = new URL(SEASON_DOCUMENT_UPLOAD_PATH, serverUrl);
  url.searchParams.set("key", key);
  return url.toString();
};

export const getSeasonDocumentUploadKey = (
  documentUrl: string,
  serverUrl?: string,
): string | null => {
  const parseUrl = (base?: string): string | null => {
    try {
      const url = base ? new URL(documentUrl, base) : new URL(documentUrl);

      if (url.pathname !== SEASON_DOCUMENT_UPLOAD_PATH) {
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

export const getSeasonEventStatusMeta = (status: PublicSeasonEvent["status"]): SeasonStatusMeta => {
  switch (status) {
    case "registration_open": {
      return {
        badgeClassName: "nrc-badge-success",
        labelKey: "season.status.registrationOpen",
      };
    }
    case "registration_closed": {
      return {
        badgeClassName: "nrc-badge-warning",
        labelKey: "season.status.registrationClosed",
      };
    }
    case "published": {
      return {
        badgeClassName: "nrc-badge-info",
        labelKey: "season.status.published",
      };
    }
    case "active": {
      return {
        badgeClassName: "nrc-badge-cyan",
        labelKey: "season.status.active",
      };
    }
    case "completed": {
      return {
        badgeClassName: "nrc-badge-purple",
        labelKey: "season.status.completed",
      };
    }
    case "archived": {
      return {
        badgeClassName: "nrc-badge-neutral",
        labelKey: "season.status.archived",
      };
    }
    case "draft": {
      return {
        badgeClassName: "nrc-badge-neutral",
        labelKey: "season.status.draft",
      };
    }
    default: {
      return {
        badgeClassName: "nrc-badge-neutral",
        labelKey: "season.status.unknown",
      };
    }
  }
};

export const getSeasonLifecycleMeta = (isActive: boolean): SeasonStatusMeta =>
  isActive
    ? {
        badgeClassName: "nrc-badge-success",
        labelKey: "season.admin.lifecycle.active",
      }
    : {
        badgeClassName: "nrc-badge-neutral",
        labelKey: "season.admin.lifecycle.archived",
      };

export const isSeasonNotFoundError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    code?: string;
    message?: string;
    status?: number;
  };

  return (
    maybeError.code === "NOT_FOUND" ||
    maybeError.status === 404 ||
    (typeof maybeError.message === "string" &&
      maybeError.message.toLowerCase().includes("not found"))
  );
};

export const formatSeasonDateRange = (startAt: string, endAt: string, locale: string): string => {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }

  if (start.toDateString() === end.toDateString()) {
    return getShortDateFormatter(locale).format(start);
  }

  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();

  if (sameMonth) {
    const formatter = new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "numeric",
    });

    return `${formatter.format(start)} ${getDayFormatter(locale).format(start)}-${getDayFormatter(locale).format(end)}`;
  }

  return `${getShortDateFormatter(locale).format(start)} - ${getShortDateFormatter(locale).format(end)}`;
};

export const formatSeasonDateTime = (value: string, locale: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return getLongDateFormatter(locale).format(date);
};

export const formatSeasonAnnouncementDate = (
  announcement: AnnouncementLike,
  locale: string,
): string => formatSeasonDateTime(announcement.publishedAt, locale);

export const formatSeasonLocation = (
  event: Pick<PublicSeasonEvent, "location" | "venue">,
): string => {
  if (event.venue && event.location) {
    return `${event.venue}, ${event.location}`;
  }

  return event.venue ?? event.location ?? "";
};

export const toDateTimeLocalValue = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

export const toIsoDateTime = (value: string): string => new Date(value).toISOString();

export const getSeasonLocale = (language: string): string =>
  language === "vi" ? "vi-VN" : "en-US";

export const renderStatusLabel = (t: TFunction, status: SeasonStatusMeta): string =>
  t(status.labelKey);
