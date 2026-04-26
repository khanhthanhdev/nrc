import {
  db,
  eventTable,
  seasonAnnouncementTable,
  seasonDocumentTable,
  seasonTable,
} from "@nrc-full/db";
import { ORPCError } from "@orpc/server";
import { and, eq, isNull } from "drizzle-orm";

import type {
  CreateSeasonAnnouncementInput,
  CreateSeasonDocumentInput,
  CreateSeasonInput,
  DeleteSeasonAnnouncementInput,
  DeleteSeasonDocumentInput,
  DeleteSeasonInput,
  ListAdminSeasonsInput,
  UpdateSeasonAnnouncementInput,
  UpdateSeasonDocumentInput,
  UpdateSeasonInput,
} from "../schemas/season.js";

type SeasonRecord = typeof seasonTable.$inferSelect;
type SeasonDocumentRecord = typeof seasonDocumentTable.$inferSelect;
type SeasonAnnouncementRecord = typeof seasonAnnouncementTable.$inferSelect;
type EventRecord = typeof eventTable.$inferSelect;

export interface PublicSeasonOption {
  gameCode: string;
  isActive: boolean;
  theme: string;
  year: string;
}

export interface PublicSeasonEvent {
  eventCode: string;
  eventEndsAt: string;
  eventStartsAt: string;
  id: string;
  location: string | null;
  maxParticipants: number | null;
  name: string;
  registrationEndsAt: string | null;
  registrationStartsAt: string | null;
  status: EventRecord["status"];
  summary: string | null;
  timezone: string | null;
  venue: string | null;
}

export interface AdminCurrentSeason {
  gameCode: string;
  id: string;
  theme: string;
  year: string;
}

export interface PublicSeasonDocument {
  id: string;
  kind: string;
  sortOrder: number;
  title: string;
  url: string;
}

export interface PublicSeasonAnnouncement {
  body: string;
  id: string;
  isPinned: boolean;
  publishedAt: string;
  sortOrder: number;
  title: string;
}

export interface PublicSeasonPage {
  announcements: PublicSeasonAnnouncement[];
  documents: PublicSeasonDocument[];
  events: PublicSeasonEvent[];
  season: {
    description: string | null;
    gameCode: string;
    id: string;
    isActive: boolean;
    theme: string;
    year: string;
  };
  seasonOptions: PublicSeasonOption[];
}

export interface AdminSeasonSummary {
  gameCode: string;
  isActive: boolean;
  theme: string;
  updatedAt: string;
  year: string;
}

export interface AdminSeasonEventSummary {
  eventCode: string;
  eventEndsAt: string;
  eventStartsAt: string;
  id: string;
  location: string | null;
  name: string;
  status: EventRecord["status"];
  venue: string | null;
}

export interface AdminSeasonDocument extends PublicSeasonDocument {
  createdAt: string;
  updatedAt: string;
}

export interface AdminSeasonAnnouncement extends PublicSeasonAnnouncement {
  createdAt: string;
  updatedAt: string;
}

export interface AdminSeasonDetail {
  announcements: AdminSeasonAnnouncement[];
  documents: AdminSeasonDocument[];
  events: AdminSeasonEventSummary[];
  season: {
    createdAt: string;
    description: string | null;
    gameCode: string;
    id: string;
    isActive: boolean;
    theme: string;
    updatedAt: string;
    year: string;
  };
}

const toIsoString = (value: Date | null | undefined): string | null => value?.toISOString() ?? null;

export const compareSeasonYearsDesc = (
  left: { year: string },
  right: { year: string },
): number => Number.parseInt(right.year, 10) - Number.parseInt(left.year, 10);

export const compareDocumentsByDisplayOrder = (
  left: { sortOrder: number; title: string },
  right: { sortOrder: number; title: string },
): number => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title);

export const compareAnnouncementsForPublic = (
  left: { isPinned: boolean; publishedAt: Date; sortOrder: number; title: string },
  right: { isPinned: boolean; publishedAt: Date; sortOrder: number; title: string },
): number =>
  Number(right.isPinned) - Number(left.isPinned) ||
  right.publishedAt.getTime() - left.publishedAt.getTime() ||
  left.sortOrder - right.sortOrder ||
  left.title.localeCompare(right.title);

export const compareEventsForPublic = (
  left: { eventStartsAt: Date; name: string },
  right: { eventStartsAt: Date; name: string },
): number => left.eventStartsAt.getTime() - right.eventStartsAt.getTime() || left.name.localeCompare(right.name);

export const compareEventsForAdmin = (
  left: { eventStartsAt: Date; name: string },
  right: { eventStartsAt: Date; name: string },
): number => compareEventsForPublic(left, right);

const mapPublicSeasonOption = (record: SeasonRecord): PublicSeasonOption => ({
  gameCode: record.gameCode,
  isActive: record.isActive,
  theme: record.theme,
  year: record.year,
});

const mapPublicSeasonEvent = (record: EventRecord): PublicSeasonEvent => ({
  eventCode: record.eventCode,
  eventEndsAt: record.eventEndsAt.toISOString(),
  eventStartsAt: record.eventStartsAt.toISOString(),
  id: record.id,
  location: record.location ?? null,
  maxParticipants: record.maxParticipants ?? null,
  name: record.name,
  registrationEndsAt: toIsoString(record.registrationEndsAt),
  registrationStartsAt: toIsoString(record.registrationStartsAt),
  status: record.status,
  summary: record.summary ?? null,
  timezone: record.timezone ?? null,
  venue: record.venue ?? null,
});

const mapPublicSeasonDocument = (record: SeasonDocumentRecord): PublicSeasonDocument => ({
  id: record.id,
  kind: record.kind,
  sortOrder: record.sortOrder,
  title: record.title,
  url: record.url,
});

const mapPublicSeasonAnnouncement = (
  record: SeasonAnnouncementRecord,
): PublicSeasonAnnouncement => ({
  body: record.body,
  id: record.id,
  isPinned: record.isPinned,
  publishedAt: record.publishedAt.toISOString(),
  sortOrder: record.sortOrder,
  title: record.title,
});

const mapAdminSeasonDocument = (record: SeasonDocumentRecord): AdminSeasonDocument => ({
  ...mapPublicSeasonDocument(record),
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

const mapAdminSeasonAnnouncement = (
  record: SeasonAnnouncementRecord,
): AdminSeasonAnnouncement => ({
  ...mapPublicSeasonAnnouncement(record),
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

const mapAdminSeasonEvent = (record: EventRecord): AdminSeasonEventSummary => ({
  eventCode: record.eventCode,
  eventEndsAt: record.eventEndsAt.toISOString(),
  eventStartsAt: record.eventStartsAt.toISOString(),
  id: record.id,
  location: record.location ?? null,
  name: record.name,
  status: record.status,
  venue: record.venue ?? null,
});

export const buildPublicSeasonPage = ({
  announcements,
  documents,
  events,
  season,
  seasonOptions,
}: {
  announcements: SeasonAnnouncementRecord[];
  documents: SeasonDocumentRecord[];
  events: EventRecord[];
  season: SeasonRecord;
  seasonOptions: SeasonRecord[];
}): PublicSeasonPage => ({
  announcements: announcements.sort(compareAnnouncementsForPublic).map(mapPublicSeasonAnnouncement),
  documents: documents.sort(compareDocumentsByDisplayOrder).map(mapPublicSeasonDocument),
  events: events
    .filter((event) => event.status !== "draft")
    .sort(compareEventsForPublic)
    .map(mapPublicSeasonEvent),
  season: {
    description: season.description ?? null,
    gameCode: season.gameCode,
    id: season.id,
    isActive: season.isActive,
    theme: season.theme,
    year: season.year,
  },
  seasonOptions: seasonOptions.sort(compareSeasonYearsDesc).map(mapPublicSeasonOption),
});

export const buildAdminSeasonSummaries = (seasons: SeasonRecord[]): AdminSeasonSummary[] =>
  seasons.sort(compareSeasonYearsDesc).map((season) => ({
    gameCode: season.gameCode,
    isActive: season.isActive,
    theme: season.theme,
    updatedAt: season.updatedAt.toISOString(),
    year: season.year,
  }));

export const buildAdminSeasonDetail = ({
  announcements,
  documents,
  events,
  season,
}: {
  announcements: SeasonAnnouncementRecord[];
  documents: SeasonDocumentRecord[];
  events: EventRecord[];
  season: SeasonRecord;
}): AdminSeasonDetail => ({
  announcements: announcements.sort(compareAnnouncementsForPublic).map(mapAdminSeasonAnnouncement),
  documents: documents.sort(compareDocumentsByDisplayOrder).map(mapAdminSeasonDocument),
  events: events.sort(compareEventsForAdmin).map(mapAdminSeasonEvent),
  season: {
    createdAt: season.createdAt.toISOString(),
    description: season.description ?? null,
    gameCode: season.gameCode,
    id: season.id,
    isActive: season.isActive,
    theme: season.theme,
    updatedAt: season.updatedAt.toISOString(),
    year: season.year,
  },
});

const getSeasonByYear = async (year: string): Promise<SeasonRecord | null> => {
  const [season] = await db
    .select()
    .from(seasonTable)
    .where(and(eq(seasonTable.year, year), isNull(seasonTable.deletedAt)))
    .limit(1);

  return season ?? null;
};

const requireSeasonByYear = async (year: string): Promise<SeasonRecord> => {
  const season = await getSeasonByYear(year);

  if (!season) {
    throw new ORPCError("NOT_FOUND", {
      message: `Season ${year} was not found.`,
    });
  }

  return season;
};

const getSeasonDocumentById = async (
  seasonYear: string,
  documentId: string,
): Promise<SeasonDocumentRecord | null> => {
  const [document] = await db
    .select()
    .from(seasonDocumentTable)
    .where(
      and(
        eq(seasonDocumentTable.id, documentId),
        eq(seasonDocumentTable.seasonYear, seasonYear),
        isNull(seasonDocumentTable.deletedAt),
      ),
    )
    .limit(1);

  return document ?? null;
};

const requireSeasonDocumentById = async (
  seasonYear: string,
  documentId: string,
): Promise<SeasonDocumentRecord> => {
  const document = await getSeasonDocumentById(seasonYear, documentId);

  if (!document) {
    throw new ORPCError("NOT_FOUND", {
      message: `Season document ${documentId} was not found for season ${seasonYear}.`,
    });
  }

  return document;
};

const getSeasonAnnouncementById = async (
  seasonYear: string,
  announcementId: string,
): Promise<SeasonAnnouncementRecord | null> => {
  const [announcement] = await db
    .select()
    .from(seasonAnnouncementTable)
    .where(
      and(
        eq(seasonAnnouncementTable.id, announcementId),
        eq(seasonAnnouncementTable.seasonYear, seasonYear),
        isNull(seasonAnnouncementTable.deletedAt),
      ),
    )
    .limit(1);

  return announcement ?? null;
};

const requireSeasonAnnouncementById = async (
  seasonYear: string,
  announcementId: string,
): Promise<SeasonAnnouncementRecord> => {
  const announcement = await getSeasonAnnouncementById(seasonYear, announcementId);

  if (!announcement) {
    throw new ORPCError("NOT_FOUND", {
      message: `Season announcement ${announcementId} was not found for season ${seasonYear}.`,
    });
  }

  return announcement;
};

export const getPublicSeasonPageByYear = async (year: string): Promise<PublicSeasonPage> => {
  const season = await requireSeasonByYear(year);

  const [seasonOptions, events, documents, announcements] = await Promise.all([
    db.select().from(seasonTable).where(isNull(seasonTable.deletedAt)),
    db
      .select()
      .from(eventTable)
      .where(
        and(
          eq(eventTable.season, year),
          isNull(eventTable.deletedAt),
        ),
      ),
    db
      .select()
      .from(seasonDocumentTable)
      .where(
        and(
          eq(seasonDocumentTable.seasonYear, year),
          isNull(seasonDocumentTable.deletedAt),
        ),
      ),
    db
      .select()
      .from(seasonAnnouncementTable)
      .where(
        and(
          eq(seasonAnnouncementTable.seasonYear, year),
          isNull(seasonAnnouncementTable.deletedAt),
        ),
      ),
  ]);

  return buildPublicSeasonPage({
    announcements,
    documents,
    events,
    season,
    seasonOptions,
  });
};

export const listAdminSeasons = async (
  input: ListAdminSeasonsInput = { includeDeleted: false },
): Promise<AdminSeasonSummary[]> => {
  const conditions = input.includeDeleted ? undefined : isNull(seasonTable.deletedAt);
  const seasons = conditions
    ? await db.select().from(seasonTable).where(conditions)
    : await db.select().from(seasonTable);

  return buildAdminSeasonSummaries(seasons);
};

export const getCurrentAdminSeason = async (): Promise<AdminCurrentSeason> => {
  const activeSeasons = await db
    .select()
    .from(seasonTable)
    .where(and(eq(seasonTable.isActive, true), isNull(seasonTable.deletedAt)));

  if (activeSeasons.length !== 1) {
    throw new ORPCError("FAILED_PRECONDITION", {
      message:
        activeSeasons.length === 0
          ? "Event management requires exactly one active season, but none are active."
          : "Event management requires exactly one active season, but multiple active seasons were found.",
    });
  }

  const [season] = activeSeasons;
  if (!season) {
    throw new ORPCError("FAILED_PRECONDITION", {
      message: "Event management requires exactly one active season.",
    });
  }

  return {
    gameCode: season.gameCode,
    id: season.id,
    theme: season.theme,
    year: season.year,
  };
};

export const getAdminSeasonByYear = async (year: string): Promise<AdminSeasonDetail> => {
  const season = await requireSeasonByYear(year);
  const [events, documents, announcements] = await Promise.all([
    db
      .select()
      .from(eventTable)
      .where(and(eq(eventTable.season, year), isNull(eventTable.deletedAt))),
    db
      .select()
      .from(seasonDocumentTable)
      .where(
        and(
          eq(seasonDocumentTable.seasonYear, year),
          isNull(seasonDocumentTable.deletedAt),
        ),
      ),
    db
      .select()
      .from(seasonAnnouncementTable)
      .where(
        and(
          eq(seasonAnnouncementTable.seasonYear, year),
          isNull(seasonAnnouncementTable.deletedAt),
        ),
      ),
  ]);

  return buildAdminSeasonDetail({
    announcements,
    documents,
    events,
    season,
  });
};

export const createSeasonForAdmin = async (input: CreateSeasonInput): Promise<AdminSeasonDetail> => {
  const existingSeason = await getSeasonByYear(input.year);

  if (existingSeason) {
    throw new ORPCError("CONFLICT", {
      message: `Season ${input.year} already exists.`,
    });
  }

  const now = new Date();
  await db.insert(seasonTable).values({
    createdAt: now,
    description: input.description ?? null,
    gameCode: input.gameCode,
    id: crypto.randomUUID(),
    isActive: input.isActive ?? true,
    theme: input.theme,
    updatedAt: now,
    year: input.year,
  });

  return getAdminSeasonByYear(input.year);
};

export const updateSeasonForAdmin = async (input: UpdateSeasonInput): Promise<AdminSeasonDetail> => {
  await requireSeasonByYear(input.year);

  await db
    .update(seasonTable)
    .set({
      description: input.description ?? null,
      gameCode: input.gameCode,
      isActive: input.isActive,
      theme: input.theme,
    })
    .where(and(eq(seasonTable.year, input.year), isNull(seasonTable.deletedAt)));

  return getAdminSeasonByYear(input.year);
};

export const deleteSeasonForAdmin = async (
  actorUserId: string,
  input: DeleteSeasonInput,
): Promise<{ success: true }> => {
  await requireSeasonByYear(input.year);

  const now = new Date();
  await db
    .update(seasonTable)
    .set({
      deletedAt: now,
      deletedByUserId: actorUserId,
    })
    .where(and(eq(seasonTable.year, input.year), isNull(seasonTable.deletedAt)));

  return { success: true };
};

export const createSeasonDocumentForAdmin = async (
  input: CreateSeasonDocumentInput,
): Promise<AdminSeasonDocument> => {
  await requireSeasonByYear(input.seasonYear);

  const now = new Date();
  const [document] = await db
    .insert(seasonDocumentTable)
    .values({
      createdAt: now,
      id: crypto.randomUUID(),
      kind: input.kind,
      seasonYear: input.seasonYear,
      sortOrder: input.sortOrder ?? 0,
      title: input.title,
      updatedAt: now,
      url: input.url,
    })
    .returning();

  if (!document) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Unable to create season document.",
    });
  }

  return mapAdminSeasonDocument(document);
};

export const updateSeasonDocumentForAdmin = async (
  input: UpdateSeasonDocumentInput,
): Promise<AdminSeasonDocument> => {
  await requireSeasonByYear(input.seasonYear);
  await requireSeasonDocumentById(input.seasonYear, input.id);

  const [document] = await db
    .update(seasonDocumentTable)
    .set({
      kind: input.kind,
      sortOrder: input.sortOrder,
      title: input.title,
      url: input.url,
    })
    .where(
      and(
        eq(seasonDocumentTable.id, input.id),
        eq(seasonDocumentTable.seasonYear, input.seasonYear),
        isNull(seasonDocumentTable.deletedAt),
      ),
    )
    .returning();

  if (!document) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Unable to update season document.",
    });
  }

  return mapAdminSeasonDocument(document);
};

export const deleteSeasonDocumentForAdmin = async (
  actorUserId: string,
  input: DeleteSeasonDocumentInput,
): Promise<{ success: true }> => {
  await requireSeasonByYear(input.seasonYear);
  await requireSeasonDocumentById(input.seasonYear, input.id);

  const now = new Date();
  await db
    .update(seasonDocumentTable)
    .set({
      deletedAt: now,
      deletedByUserId: actorUserId,
    })
    .where(
      and(
        eq(seasonDocumentTable.id, input.id),
        eq(seasonDocumentTable.seasonYear, input.seasonYear),
        isNull(seasonDocumentTable.deletedAt),
      ),
    );

  return { success: true };
};

export const createSeasonAnnouncementForAdmin = async (
  input: CreateSeasonAnnouncementInput,
): Promise<AdminSeasonAnnouncement> => {
  await requireSeasonByYear(input.seasonYear);

  const now = new Date();
  const [announcement] = await db
    .insert(seasonAnnouncementTable)
    .values({
      body: input.body,
      createdAt: now,
      id: crypto.randomUUID(),
      isPinned: input.isPinned ?? false,
      publishedAt: new Date(input.publishedAt),
      seasonYear: input.seasonYear,
      sortOrder: input.sortOrder ?? 0,
      title: input.title,
      updatedAt: now,
    })
    .returning();

  if (!announcement) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Unable to create season announcement.",
    });
  }

  return mapAdminSeasonAnnouncement(announcement);
};

export const updateSeasonAnnouncementForAdmin = async (
  input: UpdateSeasonAnnouncementInput,
): Promise<AdminSeasonAnnouncement> => {
  await requireSeasonByYear(input.seasonYear);
  await requireSeasonAnnouncementById(input.seasonYear, input.id);

  const [announcement] = await db
    .update(seasonAnnouncementTable)
    .set({
      body: input.body,
      isPinned: input.isPinned,
      publishedAt: new Date(input.publishedAt),
      sortOrder: input.sortOrder,
      title: input.title,
    })
    .where(
      and(
        eq(seasonAnnouncementTable.id, input.id),
        eq(seasonAnnouncementTable.seasonYear, input.seasonYear),
        isNull(seasonAnnouncementTable.deletedAt),
      ),
    )
    .returning();

  if (!announcement) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Unable to update season announcement.",
    });
  }

  return mapAdminSeasonAnnouncement(announcement);
};

export const deleteSeasonAnnouncementForAdmin = async (
  actorUserId: string,
  input: DeleteSeasonAnnouncementInput,
): Promise<{ success: true }> => {
  await requireSeasonByYear(input.seasonYear);
  await requireSeasonAnnouncementById(input.seasonYear, input.id);

  const now = new Date();
  await db
    .update(seasonAnnouncementTable)
    .set({
      deletedAt: now,
      deletedByUserId: actorUserId,
    })
    .where(
      and(
        eq(seasonAnnouncementTable.id, input.id),
        eq(seasonAnnouncementTable.seasonYear, input.seasonYear),
        isNull(seasonAnnouncementTable.deletedAt),
      ),
    );

  return { success: true };
};
