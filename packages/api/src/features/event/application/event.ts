import {
  db,
  eventAnnouncementTable,
  eventDocumentTable,
  eventRegistrationFormVersionTable,
  eventTable,
  seasonTable,
} from "@nrc-full/db";
import { ORPCError } from "@orpc/server";
import { and, eq, isNull, ne } from "drizzle-orm";

import type {
  CreateEventAnnouncementInput,
  CreateEventDocumentInput,
  CreateEventInput,
  CreateRegistrationFormVersionInput,
  DeleteEventAnnouncementInput,
  DeleteEventDocumentInput,
  DeleteEventInput,
  DeleteRegistrationFormVersionInput,
  ListAdminEventsInput,
  PublishRegistrationFormVersionInput,
  UpdateEventAnnouncementInput,
  UpdateEventDocumentInput,
  UpdateEventInput,
  UpdateRegistrationFormVersionInput,
} from "../schemas/event.js";

type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type EventRecord = typeof eventTable.$inferSelect;
type EventDocumentRecord = typeof eventDocumentTable.$inferSelect;
type EventAnnouncementRecord = typeof eventAnnouncementTable.$inferSelect;
type RegistrationFormVersionRecord = typeof eventRegistrationFormVersionTable.$inferSelect;

export interface AdminEventSummary {
  eventCode: string;
  eventEndsAt: string;
  eventKey: string;
  eventStartsAt: string;
  id: string;
  location: string | null;
  name: string;
  season: string;
  status: EventRecord["status"];
  updatedAt: string;
  venue: string | null;
}

export interface AdminEventDocument {
  createdAt: string;
  id: string;
  isPublic: boolean;
  kind: string;
  sortOrder: number;
  title: string;
  updatedAt: string;
  url: string;
}

export interface AdminEventAnnouncement {
  body: string;
  createdAt: string;
  id: string;
  isPinned: boolean;
  publishedAt: string;
  title: string;
  updatedAt: string;
}

export interface AdminRegistrationFormVersion {
  createdAt: string;
  definition: Record<string, unknown>;
  id: string;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
  versionNumber: number;
}

export interface AdminEventDetail {
  announcements: AdminEventAnnouncement[];
  documents: AdminEventDocument[];
  event: {
    createdAt: string;
    description: string | null;
    eventCode: string;
    eventEndsAt: string;
    eventKey: string;
    eventStartsAt: string;
    id: string;
    location: string | null;
    maxParticipants: number | null;
    name: string;
    registrationEndsAt: string | null;
    registrationStartsAt: string | null;
    season: string;
    status: EventRecord["status"];
    summary: string | null;
    timezone: string | null;
    updatedAt: string;
    venue: string | null;
  };
  registrationFormVersions: AdminRegistrationFormVersion[];
}

export interface PublicEventDetail {
  announcements: AdminEventAnnouncement[];
  documents: AdminEventDocument[];
  event: AdminEventDetail["event"];
  publishedRegistrationFormVersion: AdminRegistrationFormVersion | null;
}

const PUBLIC_EVENT_STATUSES = new Set<EventRecord["status"]>([
  "published",
  "registration_open",
  "registration_closed",
  "active",
  "completed",
  "archived",
]);

const toIsoString = (value: Date | null | undefined): string | null => value?.toISOString() ?? null;

export const buildEventKey = (season: string, eventCode: string): string =>
  `${season}/${eventCode}`;

export const compareEventsForAdmin = (
  left: { eventStartsAt: Date; name: string },
  right: { eventStartsAt: Date; name: string },
): number =>
  left.eventStartsAt.getTime() - right.eventStartsAt.getTime() ||
  left.name.localeCompare(right.name);

export const compareDocumentsByDisplayOrder = (
  left: { sortOrder: number; title: string },
  right: { sortOrder: number; title: string },
): number => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title);

export const compareAnnouncementsForDisplay = (
  left: { isPinned: boolean; publishedAt: Date; title: string },
  right: { isPinned: boolean; publishedAt: Date; title: string },
): number =>
  Number(right.isPinned) - Number(left.isPinned) ||
  right.publishedAt.getTime() - left.publishedAt.getTime() ||
  left.title.localeCompare(right.title);

export const compareFormVersionsDesc = (
  left: { versionNumber: number },
  right: { versionNumber: number },
): number => right.versionNumber - left.versionNumber;

const mapAdminEventSummary = (record: EventRecord): AdminEventSummary => ({
  eventCode: record.eventCode,
  eventEndsAt: record.eventEndsAt.toISOString(),
  eventKey: record.eventKey,
  eventStartsAt: record.eventStartsAt.toISOString(),
  id: record.id,
  location: record.location ?? null,
  name: record.name,
  season: record.season,
  status: record.status,
  updatedAt: record.updatedAt.toISOString(),
  venue: record.venue ?? null,
});

const mapAdminEvent = (record: EventRecord): AdminEventDetail["event"] => ({
  createdAt: record.createdAt.toISOString(),
  description: record.description ?? null,
  eventCode: record.eventCode,
  eventEndsAt: record.eventEndsAt.toISOString(),
  eventKey: record.eventKey,
  eventStartsAt: record.eventStartsAt.toISOString(),
  id: record.id,
  location: record.location ?? null,
  maxParticipants: record.maxParticipants ?? null,
  name: record.name,
  registrationEndsAt: toIsoString(record.registrationEndsAt),
  registrationStartsAt: toIsoString(record.registrationStartsAt),
  season: record.season,
  status: record.status,
  summary: record.summary ?? null,
  timezone: record.timezone ?? null,
  updatedAt: record.updatedAt.toISOString(),
  venue: record.venue ?? null,
});

const mapAdminEventDocument = (record: EventDocumentRecord): AdminEventDocument => ({
  createdAt: record.createdAt.toISOString(),
  id: record.id,
  isPublic: record.isPublic,
  kind: record.kind,
  sortOrder: record.sortOrder,
  title: record.title,
  updatedAt: record.updatedAt.toISOString(),
  url: record.url,
});

const mapAdminEventAnnouncement = (record: EventAnnouncementRecord): AdminEventAnnouncement => ({
  body: record.body,
  createdAt: record.createdAt.toISOString(),
  id: record.id,
  isPinned: record.isPinned,
  publishedAt: record.publishedAt.toISOString(),
  title: record.title,
  updatedAt: record.updatedAt.toISOString(),
});

const mapRegistrationFormVersion = (
  record: RegistrationFormVersionRecord,
): AdminRegistrationFormVersion => ({
  createdAt: record.createdAt.toISOString(),
  definition: record.definition,
  id: record.id,
  isPublished: record.isPublished,
  publishedAt: toIsoString(record.publishedAt),
  updatedAt: record.updatedAt.toISOString(),
  versionNumber: record.versionNumber,
});

export const buildAdminEventSummaries = (events: EventRecord[]): AdminEventSummary[] =>
  events.toSorted(compareEventsForAdmin).map(mapAdminEventSummary);

export const buildAdminEventDetail = ({
  announcements,
  documents,
  event,
  registrationFormVersions,
}: {
  announcements: EventAnnouncementRecord[];
  documents: EventDocumentRecord[];
  event: EventRecord;
  registrationFormVersions: RegistrationFormVersionRecord[];
}): AdminEventDetail => ({
  announcements: announcements
    .toSorted(compareAnnouncementsForDisplay)
    .map(mapAdminEventAnnouncement),
  documents: documents.toSorted(compareDocumentsByDisplayOrder).map(mapAdminEventDocument),
  event: mapAdminEvent(event),
  registrationFormVersions: registrationFormVersions
    .toSorted(compareFormVersionsDesc)
    .map(mapRegistrationFormVersion),
});

const requireSeason = async (year: string): Promise<void> => {
  const [season] = await db
    .select({ id: seasonTable.id })
    .from(seasonTable)
    .where(and(eq(seasonTable.year, year), isNull(seasonTable.deletedAt)))
    .limit(1);

  if (!season) {
    throw new ORPCError("NOT_FOUND", {
      message: `Season ${year} was not found.`,
    });
  }
};

const getEventById = async (id: string): Promise<EventRecord | null> => {
  const [event] = await db
    .select()
    .from(eventTable)
    .where(and(eq(eventTable.id, id), isNull(eventTable.deletedAt)))
    .limit(1);

  return event ?? null;
};

const requireEventById = async (id: string): Promise<EventRecord> => {
  const event = await getEventById(id);

  if (!event) {
    throw new ORPCError("NOT_FOUND", {
      message: `Event ${id} was not found.`,
    });
  }

  return event;
};

const assertUniqueEventIdentity = async (
  input: { eventCode: string; season: string },
  currentEventId?: string,
): Promise<void> => {
  const identityConditions = currentEventId
    ? and(
        eq(eventTable.season, input.season),
        eq(eventTable.eventCode, input.eventCode),
        isNull(eventTable.deletedAt),
        ne(eventTable.id, currentEventId),
      )
    : and(
        eq(eventTable.season, input.season),
        eq(eventTable.eventCode, input.eventCode),
        isNull(eventTable.deletedAt),
      );

  const [sameIdentity] = await db
    .select({ id: eventTable.id })
    .from(eventTable)
    .where(identityConditions)
    .limit(1);
  if (sameIdentity) {
    throw new ORPCError("CONFLICT", {
      message: `Event ${input.season}/${input.eventCode} already exists.`,
    });
  }
};

const requireEventDocument = async (
  eventId: string,
  documentId: string,
): Promise<EventDocumentRecord> => {
  const [document] = await db
    .select()
    .from(eventDocumentTable)
    .where(
      and(
        eq(eventDocumentTable.id, documentId),
        eq(eventDocumentTable.eventId, eventId),
        isNull(eventDocumentTable.deletedAt),
      ),
    )
    .limit(1);

  if (!document) {
    throw new ORPCError("NOT_FOUND", {
      message: `Event document ${documentId} was not found.`,
    });
  }

  return document;
};

const requireEventAnnouncement = async (
  eventId: string,
  announcementId: string,
): Promise<EventAnnouncementRecord> => {
  const [announcement] = await db
    .select()
    .from(eventAnnouncementTable)
    .where(
      and(
        eq(eventAnnouncementTable.id, announcementId),
        eq(eventAnnouncementTable.eventId, eventId),
        isNull(eventAnnouncementTable.deletedAt),
      ),
    )
    .limit(1);

  if (!announcement) {
    throw new ORPCError("NOT_FOUND", {
      message: `Event announcement ${announcementId} was not found.`,
    });
  }

  return announcement;
};

const requireRegistrationFormVersion = async (
  eventId: string,
  versionId: string,
): Promise<RegistrationFormVersionRecord> => {
  const [version] = await db
    .select()
    .from(eventRegistrationFormVersionTable)
    .where(
      and(
        eq(eventRegistrationFormVersionTable.id, versionId),
        eq(eventRegistrationFormVersionTable.eventId, eventId),
        isNull(eventRegistrationFormVersionTable.deletedAt),
      ),
    )
    .limit(1);

  if (!version) {
    throw new ORPCError("NOT_FOUND", {
      message: `Registration form version ${versionId} was not found.`,
    });
  }

  return version;
};

const getNextFormVersionNumber = async (
  tx: DatabaseTransaction,
  eventId: string,
): Promise<number> => {
  const versions = await tx
    .select({ versionNumber: eventRegistrationFormVersionTable.versionNumber })
    .from(eventRegistrationFormVersionTable)
    .where(
      and(
        eq(eventRegistrationFormVersionTable.eventId, eventId),
        isNull(eventRegistrationFormVersionTable.deletedAt),
      ),
    );

  return Math.max(0, ...versions.map((version) => version.versionNumber)) + 1;
};

export const listAdminEvents = async (
  input: ListAdminEventsInput = { includeDeleted: false },
): Promise<AdminEventSummary[]> => {
  const conditions = [
    input.season ? eq(eventTable.season, input.season) : undefined,
    input.includeDeleted ? undefined : isNull(eventTable.deletedAt),
  ].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));

  const events =
    conditions.length > 0
      ? await db
          .select()
          .from(eventTable)
          .where(and(...conditions))
      : await db.select().from(eventTable);

  return buildAdminEventSummaries(events);
};

export const getAdminEventById = async (id: string): Promise<AdminEventDetail> => {
  const event = await requireEventById(id);
  const [documents, announcements, registrationFormVersions] = await Promise.all([
    db
      .select()
      .from(eventDocumentTable)
      .where(and(eq(eventDocumentTable.eventId, id), isNull(eventDocumentTable.deletedAt))),
    db
      .select()
      .from(eventAnnouncementTable)
      .where(and(eq(eventAnnouncementTable.eventId, id), isNull(eventAnnouncementTable.deletedAt))),
    db
      .select()
      .from(eventRegistrationFormVersionTable)
      .where(
        and(
          eq(eventRegistrationFormVersionTable.eventId, id),
          isNull(eventRegistrationFormVersionTable.deletedAt),
        ),
      ),
  ]);

  return buildAdminEventDetail({
    announcements,
    documents,
    event,
    registrationFormVersions,
  });
};

export const getPublicEventBySeasonAndCode = async (
  season: string,
  eventCode: string,
): Promise<PublicEventDetail> => {
  const [event] = await db
    .select()
    .from(eventTable)
    .where(
      and(
        eq(eventTable.season, season),
        eq(eventTable.eventCode, eventCode),
        isNull(eventTable.deletedAt),
      ),
    )
    .limit(1);

  if (!event || !PUBLIC_EVENT_STATUSES.has(event.status)) {
    throw new ORPCError("NOT_FOUND", {
      message: `Event ${season}/${eventCode} was not found.`,
    });
  }

  const [documents, announcements, formVersions] = await Promise.all([
    db
      .select()
      .from(eventDocumentTable)
      .where(
        and(
          eq(eventDocumentTable.eventId, event.id),
          eq(eventDocumentTable.isPublic, true),
          isNull(eventDocumentTable.deletedAt),
        ),
      ),
    db
      .select()
      .from(eventAnnouncementTable)
      .where(
        and(eq(eventAnnouncementTable.eventId, event.id), isNull(eventAnnouncementTable.deletedAt)),
      ),
    db
      .select()
      .from(eventRegistrationFormVersionTable)
      .where(
        and(
          eq(eventRegistrationFormVersionTable.eventId, event.id),
          eq(eventRegistrationFormVersionTable.isPublished, true),
          isNull(eventRegistrationFormVersionTable.deletedAt),
        ),
      ),
  ]);

  return {
    announcements: announcements
      .toSorted(compareAnnouncementsForDisplay)
      .map(mapAdminEventAnnouncement),
    documents: documents.toSorted(compareDocumentsByDisplayOrder).map(mapAdminEventDocument),
    event: mapAdminEvent(event),
    publishedRegistrationFormVersion: formVersions[0]
      ? mapRegistrationFormVersion(formVersions[0])
      : null,
  };
};

export const createEventForAdmin = async (input: CreateEventInput): Promise<AdminEventDetail> => {
  await requireSeason(input.season);
  await assertUniqueEventIdentity(input);

  const now = new Date();
  const id = crypto.randomUUID();
  await db.insert(eventTable).values({
    createdAt: now,
    description: input.description ?? null,
    eventCode: input.eventCode,
    eventEndsAt: new Date(input.eventEndsAt),
    eventKey: buildEventKey(input.season, input.eventCode),
    eventStartsAt: new Date(input.eventStartsAt),
    id,
    location: input.location ?? null,
    maxParticipants: input.maxParticipants ?? null,
    name: input.name,
    registrationEndsAt: input.registrationEndsAt ? new Date(input.registrationEndsAt) : null,
    registrationStartsAt: input.registrationStartsAt ? new Date(input.registrationStartsAt) : null,
    season: input.season,
    status: input.status,
    summary: input.summary ?? null,
    timezone: input.timezone ?? "UTC",
    updatedAt: now,
    venue: input.venue ?? null,
  });

  return getAdminEventById(id);
};

export const updateEventForAdmin = async (input: UpdateEventInput): Promise<AdminEventDetail> => {
  await requireEventById(input.id);
  await requireSeason(input.season);
  await assertUniqueEventIdentity(input, input.id);

  await db
    .update(eventTable)
    .set({
      description: input.description ?? null,
      eventCode: input.eventCode,
      eventEndsAt: new Date(input.eventEndsAt),
      eventKey: buildEventKey(input.season, input.eventCode),
      eventStartsAt: new Date(input.eventStartsAt),
      location: input.location ?? null,
      maxParticipants: input.maxParticipants ?? null,
      name: input.name,
      registrationEndsAt: input.registrationEndsAt ? new Date(input.registrationEndsAt) : null,
      registrationStartsAt: input.registrationStartsAt
        ? new Date(input.registrationStartsAt)
        : null,
      season: input.season,
      status: input.status,
      summary: input.summary ?? null,
      timezone: input.timezone ?? "UTC",
      venue: input.venue ?? null,
    })
    .where(and(eq(eventTable.id, input.id), isNull(eventTable.deletedAt)));

  return getAdminEventById(input.id);
};

export const deleteEventForAdmin = async (
  actorUserId: string,
  input: DeleteEventInput,
): Promise<{ success: true }> => {
  await requireEventById(input.id);

  await db
    .update(eventTable)
    .set({
      deletedAt: new Date(),
      deletedByUserId: actorUserId,
    })
    .where(and(eq(eventTable.id, input.id), isNull(eventTable.deletedAt)));

  return { success: true };
};

export const createEventDocumentForAdmin = async (
  input: CreateEventDocumentInput,
): Promise<AdminEventDocument> => {
  await requireEventById(input.eventId);

  const now = new Date();
  const [document] = await db
    .insert(eventDocumentTable)
    .values({
      createdAt: now,
      eventId: input.eventId,
      id: crypto.randomUUID(),
      isPublic: input.isPublic ?? true,
      kind: input.kind,
      sortOrder: input.sortOrder ?? 0,
      title: input.title,
      updatedAt: now,
      url: input.url,
    })
    .returning();

  if (!document) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Unable to create event document." });
  }

  return mapAdminEventDocument(document);
};

export const updateEventDocumentForAdmin = async (
  input: UpdateEventDocumentInput,
): Promise<AdminEventDocument> => {
  await requireEventById(input.eventId);
  await requireEventDocument(input.eventId, input.id);

  const [document] = await db
    .update(eventDocumentTable)
    .set({
      isPublic: input.isPublic,
      kind: input.kind,
      sortOrder: input.sortOrder,
      title: input.title,
      url: input.url,
    })
    .where(
      and(
        eq(eventDocumentTable.id, input.id),
        eq(eventDocumentTable.eventId, input.eventId),
        isNull(eventDocumentTable.deletedAt),
      ),
    )
    .returning();

  if (!document) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Unable to update event document." });
  }

  return mapAdminEventDocument(document);
};

export const deleteEventDocumentForAdmin = async (
  actorUserId: string,
  input: DeleteEventDocumentInput,
): Promise<{ success: true }> => {
  await requireEventById(input.eventId);
  await requireEventDocument(input.eventId, input.id);

  await db
    .update(eventDocumentTable)
    .set({ deletedAt: new Date(), deletedByUserId: actorUserId })
    .where(
      and(
        eq(eventDocumentTable.id, input.id),
        eq(eventDocumentTable.eventId, input.eventId),
        isNull(eventDocumentTable.deletedAt),
      ),
    );

  return { success: true };
};

export const createEventAnnouncementForAdmin = async (
  input: CreateEventAnnouncementInput,
): Promise<AdminEventAnnouncement> => {
  await requireEventById(input.eventId);

  const now = new Date();
  const [announcement] = await db
    .insert(eventAnnouncementTable)
    .values({
      body: input.body,
      createdAt: now,
      eventId: input.eventId,
      id: crypto.randomUUID(),
      isPinned: input.isPinned ?? false,
      publishedAt: new Date(input.publishedAt),
      title: input.title,
      updatedAt: now,
    })
    .returning();

  if (!announcement) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Unable to create event announcement.",
    });
  }

  return mapAdminEventAnnouncement(announcement);
};

export const updateEventAnnouncementForAdmin = async (
  input: UpdateEventAnnouncementInput,
): Promise<AdminEventAnnouncement> => {
  await requireEventById(input.eventId);
  await requireEventAnnouncement(input.eventId, input.id);

  const [announcement] = await db
    .update(eventAnnouncementTable)
    .set({
      body: input.body,
      isPinned: input.isPinned,
      publishedAt: new Date(input.publishedAt),
      title: input.title,
    })
    .where(
      and(
        eq(eventAnnouncementTable.id, input.id),
        eq(eventAnnouncementTable.eventId, input.eventId),
        isNull(eventAnnouncementTable.deletedAt),
      ),
    )
    .returning();

  if (!announcement) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Unable to update event announcement.",
    });
  }

  return mapAdminEventAnnouncement(announcement);
};

export const deleteEventAnnouncementForAdmin = async (
  actorUserId: string,
  input: DeleteEventAnnouncementInput,
): Promise<{ success: true }> => {
  await requireEventById(input.eventId);
  await requireEventAnnouncement(input.eventId, input.id);

  await db
    .update(eventAnnouncementTable)
    .set({ deletedAt: new Date(), deletedByUserId: actorUserId })
    .where(
      and(
        eq(eventAnnouncementTable.id, input.id),
        eq(eventAnnouncementTable.eventId, input.eventId),
        isNull(eventAnnouncementTable.deletedAt),
      ),
    );

  return { success: true };
};

export const createRegistrationFormVersionForAdmin = async (
  actorUserId: string,
  input: CreateRegistrationFormVersionInput,
): Promise<AdminRegistrationFormVersion> => {
  await requireEventById(input.eventId);

  return db.transaction(async (tx) => {
    const now = new Date();
    if (input.isPublished) {
      await tx
        .update(eventRegistrationFormVersionTable)
        .set({ isPublished: false, publishedAt: null })
        .where(
          and(
            eq(eventRegistrationFormVersionTable.eventId, input.eventId),
            isNull(eventRegistrationFormVersionTable.deletedAt),
          ),
        );
    }

    const [version] = await tx
      .insert(eventRegistrationFormVersionTable)
      .values({
        createdAt: now,
        createdByUserId: actorUserId,
        definition: input.definition,
        eventId: input.eventId,
        id: crypto.randomUUID(),
        isPublished: input.isPublished ?? false,
        publishedAt: input.isPublished ? now : null,
        updatedAt: now,
        versionNumber: await getNextFormVersionNumber(tx, input.eventId),
      })
      .returning();

    if (!version) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Unable to create registration form version.",
      });
    }

    return mapRegistrationFormVersion(version);
  });
};

export const updateRegistrationFormVersionForAdmin = async (
  input: UpdateRegistrationFormVersionInput,
): Promise<AdminRegistrationFormVersion> => {
  await requireEventById(input.eventId);
  const existingVersion = await requireRegistrationFormVersion(input.eventId, input.id);

  if (existingVersion.isPublished) {
    throw new ORPCError("CONFLICT", {
      message: "Published registration form versions cannot be edited.",
    });
  }

  const [version] = await db
    .update(eventRegistrationFormVersionTable)
    .set({ definition: input.definition })
    .where(
      and(
        eq(eventRegistrationFormVersionTable.id, input.id),
        eq(eventRegistrationFormVersionTable.eventId, input.eventId),
        isNull(eventRegistrationFormVersionTable.deletedAt),
      ),
    )
    .returning();

  if (!version) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Unable to update registration form version.",
    });
  }

  return mapRegistrationFormVersion(version);
};

export const publishRegistrationFormVersionForAdmin = async (
  input: PublishRegistrationFormVersionInput,
): Promise<AdminRegistrationFormVersion> => {
  await requireEventById(input.eventId);
  await requireRegistrationFormVersion(input.eventId, input.id);

  return db.transaction(async (tx) => {
    const now = new Date();
    await tx
      .update(eventRegistrationFormVersionTable)
      .set({ isPublished: false, publishedAt: null })
      .where(
        and(
          eq(eventRegistrationFormVersionTable.eventId, input.eventId),
          isNull(eventRegistrationFormVersionTable.deletedAt),
        ),
      );

    const [version] = await tx
      .update(eventRegistrationFormVersionTable)
      .set({ isPublished: true, publishedAt: now })
      .where(
        and(
          eq(eventRegistrationFormVersionTable.id, input.id),
          eq(eventRegistrationFormVersionTable.eventId, input.eventId),
          isNull(eventRegistrationFormVersionTable.deletedAt),
        ),
      )
      .returning();

    if (!version) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Unable to publish registration form version.",
      });
    }

    return mapRegistrationFormVersion(version);
  });
};

export const deleteRegistrationFormVersionForAdmin = async (
  actorUserId: string,
  input: DeleteRegistrationFormVersionInput,
): Promise<{ success: true }> => {
  await requireEventById(input.eventId);
  await requireRegistrationFormVersion(input.eventId, input.id);

  await db
    .update(eventRegistrationFormVersionTable)
    .set({
      deletedAt: new Date(),
      deletedByUserId: actorUserId,
      isPublished: false,
      publishedAt: null,
    })
    .where(
      and(
        eq(eventRegistrationFormVersionTable.id, input.id),
        eq(eventRegistrationFormVersionTable.eventId, input.eventId),
        isNull(eventRegistrationFormVersionTable.deletedAt),
      ),
    );

  return { success: true };
};
