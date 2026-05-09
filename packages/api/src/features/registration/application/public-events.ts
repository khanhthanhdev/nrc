import { db, eventTable } from "@nrc-full/db";
import { and, count, desc, eq, isNull, ne } from "drizzle-orm";

import { PUBLIC_EVENT_STATUSES } from "../../event/application/event.js";
import type { ListPublicEventsInput } from "../schemas/registration.js";

type EventRecord = typeof eventTable.$inferSelect;

export interface PublicEventListItem {
  description: string | null;
  eventCode: string;
  eventEndsAt: string;
  eventKey: string;
  eventStartsAt: string;
  id: string;
  location: string | null;
  name: string;
  registrationEndsAt: string | null;
  registrationStartsAt: string | null;
  season: string;
  status: EventRecord["status"];
  summary: string | null;
  venue: string | null;
}

export interface PublicEventListResult {
  items: PublicEventListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const toIsoOrNull = (d: Date | null | undefined): string | null => d?.toISOString() ?? null;

const mapPublicEvent = (r: EventRecord): PublicEventListItem => ({
  description: r.description ?? null,
  eventCode: r.eventCode,
  eventEndsAt: r.eventEndsAt.toISOString(),
  eventKey: r.eventKey,
  eventStartsAt: r.eventStartsAt.toISOString(),
  id: r.id,
  location: r.location ?? null,
  name: r.name,
  registrationEndsAt: toIsoOrNull(r.registrationEndsAt),
  registrationStartsAt: toIsoOrNull(r.registrationStartsAt),
  season: r.season,
  status: r.status,
  summary: r.summary ?? null,
  venue: r.venue ?? null,
});

export const listPublicEvents = async (
  input: ListPublicEventsInput,
): Promise<PublicEventListResult> => {
  const page = input.page ?? 1;
  const pageSize = input.limit ?? 20;
  const offset = (page - 1) * pageSize;

  const conditions = [
    isNull(eventTable.deletedAt),
    ne(eventTable.status, "draft"),
  ];

  if (input.season) {
    conditions.push(eq(eventTable.season, input.season));
  }

  if (input.status) {
    conditions.push(eq(eventTable.status, input.status));
  }

  const whereClause = and(...conditions);

  const [totalResult] = await db
    .select({ value: count() })
    .from(eventTable)
    .where(whereClause);

  const totalCount = totalResult?.value ?? 0;

  const rows = await db
    .select()
    .from(eventTable)
    .where(whereClause)
    .orderBy(desc(eventTable.eventStartsAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.filter((r) => PUBLIC_EVENT_STATUSES.has(r.status)).map(mapPublicEvent),
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
};
