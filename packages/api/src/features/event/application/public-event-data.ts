import { db, eventTable, publishedAward, publishedMatch, publishedRanking } from "@nrc-full/db";
import { ORPCError } from "@orpc/server";
import { and, asc, eq, isNull } from "drizzle-orm";

import { buildEventKey, PUBLIC_EVENT_STATUSES } from "./event.js";

type PublishedMatchRecord = typeof publishedMatch.$inferSelect;

// ---------------------------------------------------------------------------
// Public response types
// ---------------------------------------------------------------------------

export interface PublicMatchItem {
  blueAlliance: string[];
  blueScore: number | null;
  details: Record<string, unknown> | null;
  field: string | null;
  matchKey: string;
  phase: "PRACTICE" | "QUALIFICATION" | "PLAYOFF";
  playedAt: string | null;
  redAlliance: string[];
  redScore: number | null;
  resultStatus: string | null;
  scheduledStartAt: string | null;
  sequenceNumber: number;
}

export interface PublicRankingItem {
  details: Record<string, unknown> | null;
  losses: number;
  matchesPlayed: number;
  rank: number;
  summary: Record<string, unknown> | null;
  teamNumber: string;
  ties: number;
  wins: number;
}

export interface PublicAwardItem {
  awardKey: string;
  awardName: string;
  comment: string | null;
  recipientName: string | null;
  teamNumber: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const requirePublicEvent = async (season: string, eventCode: string): Promise<void> => {
  const [event] = await db
    .select({ status: eventTable.status })
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
};

const PHASE_SORT_ORDER: Record<string, number> = {
  QUALIFICATION: 0,
  PLAYOFF: 1,
  PRACTICE: 2,
};

const parseSequenceNumber = (matchKey: string): number => {
  const numeric = matchKey.replace(/^[A-Z]+/i, "");
  const parsed = Number.parseInt(numeric, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const toIsoOrNull = (value: Date | null | undefined): string | null => value?.toISOString() ?? null;

const toRecordOrNull = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const mapPublicMatch = (row: PublishedMatchRecord): PublicMatchItem => ({
  blueAlliance: row.blueAlliance ?? [],
  blueScore: row.blueScore,
  details: toRecordOrNull(row.details),
  field: row.field,
  matchKey: row.matchKey,
  phase: row.phase,
  playedAt: toIsoOrNull(row.playedAt),
  redAlliance: row.redAlliance ?? [],
  redScore: row.redScore,
  resultStatus: row.resultStatus,
  scheduledStartAt: toIsoOrNull(row.scheduledStartAt),
  sequenceNumber: parseSequenceNumber(row.matchKey),
});

// ---------------------------------------------------------------------------
// Query: list matches
// ---------------------------------------------------------------------------

export const listPublicMatches = async (
  season: string,
  eventCode: string,
  phase?: "PRACTICE" | "QUALIFICATION" | "PLAYOFF",
): Promise<PublicMatchItem[]> => {
  await requirePublicEvent(season, eventCode);
  const eventKey = buildEventKey(season, eventCode);

  const conditions = [eq(publishedMatch.eventKey, eventKey), isNull(publishedMatch.deletedAt)];

  if (phase) {
    conditions.push(eq(publishedMatch.phase, phase));
  }

  const rows = await db
    .select()
    .from(publishedMatch)
    .where(and(...conditions));

  return rows
    .map(mapPublicMatch)
    .toSorted(
      (a, b) =>
        (PHASE_SORT_ORDER[a.phase] ?? 9) - (PHASE_SORT_ORDER[b.phase] ?? 9) ||
        a.sequenceNumber - b.sequenceNumber,
    );
};

// ---------------------------------------------------------------------------
// Query: single match detail
// ---------------------------------------------------------------------------

export const getPublicMatchDetail = async (
  season: string,
  eventCode: string,
  matchKey: string,
): Promise<PublicMatchItem | null> => {
  await requirePublicEvent(season, eventCode);
  const eventKey = buildEventKey(season, eventCode);

  const [row] = await db
    .select()
    .from(publishedMatch)
    .where(
      and(
        eq(publishedMatch.eventKey, eventKey),
        eq(publishedMatch.matchKey, matchKey),
        isNull(publishedMatch.deletedAt),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return mapPublicMatch(row);
};

// ---------------------------------------------------------------------------
// Query: rankings
// ---------------------------------------------------------------------------

export const listPublicRankings = async (
  season: string,
  eventCode: string,
): Promise<PublicRankingItem[]> => {
  await requirePublicEvent(season, eventCode);
  const eventKey = buildEventKey(season, eventCode);

  const rows = await db
    .select()
    .from(publishedRanking)
    .where(and(eq(publishedRanking.eventKey, eventKey), isNull(publishedRanking.deletedAt)))
    .orderBy(asc(publishedRanking.rank));

  return rows.map(
    (row): PublicRankingItem => ({
      details: toRecordOrNull(row.details),
      losses: row.losses,
      matchesPlayed: row.matchesPlayed,
      rank: row.rank,
      summary: toRecordOrNull(row.summary),
      teamNumber: row.teamNumber,
      ties: row.ties,
      wins: row.wins,
    }),
  );
};

// ---------------------------------------------------------------------------
// Query: awards
// ---------------------------------------------------------------------------

export const listPublicAwards = async (
  season: string,
  eventCode: string,
): Promise<PublicAwardItem[]> => {
  await requirePublicEvent(season, eventCode);
  const eventKey = buildEventKey(season, eventCode);

  const rows = await db
    .select()
    .from(publishedAward)
    .where(and(eq(publishedAward.eventKey, eventKey), isNull(publishedAward.deletedAt)))
    .orderBy(asc(publishedAward.awardKey));

  return rows.map(
    (row): PublicAwardItem => ({
      awardKey: row.awardKey,
      awardName: row.awardName,
      comment: row.comment,
      recipientName: row.recipientName,
      teamNumber: row.teamNumber,
    }),
  );
};
