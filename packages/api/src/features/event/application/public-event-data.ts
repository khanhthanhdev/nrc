import { db, eventTable, publishedAward, publishedMatch, publishedRanking } from "@nrc-full/db";
import { ORPCError } from "@orpc/server";
import { and, asc, eq, isNull } from "drizzle-orm";

import { buildEventKey, PUBLIC_EVENT_STATUSES } from "./event.js";

// ---------------------------------------------------------------------------
// Season-2026 game-specific scoring types
// ---------------------------------------------------------------------------

interface ScoreDetailAlliance2026 {
  aCenterFlags: number;
  aFirstTierFlags: number;
  aSecondTierFlags: number;
  bBaseFlagsDown: number;
  bCenterFlagDown: number;
  cOpponentBackfieldBullets: number;
  dGoldFlagsDefended: number;
  dRobotParkState: number;
  scoreA: number;
  scoreB: number;
  scoreC: number;
  scoreD: number;
  scoreTotal: number;
}

interface MatchDetails2026 {
  blueAlliance: ScoreDetailAlliance2026;
  redAlliance: ScoreDetailAlliance2026;
}

// ---------------------------------------------------------------------------
// Public response types
// ---------------------------------------------------------------------------

export interface PublicMatchItem {
  blueAlliance: string[];
  blueScore: number | null;
  details: MatchDetails2026 | null;
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

const toIsoOrNull = (value: Date | null | undefined): string | null =>
  value?.toISOString() ?? null;

const isScoreDetailAlliance2026 = (value: unknown): value is ScoreDetailAlliance2026 =>
  typeof value === "object" &&
  value !== null &&
  "scoreA" in value &&
  "scoreTotal" in value;

const parseMatchDetails2026 = (raw: unknown): MatchDetails2026 | null => {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const obj = raw as Record<string, unknown>;
  if (isScoreDetailAlliance2026(obj.redAlliance) && isScoreDetailAlliance2026(obj.blueAlliance)) {
    return { blueAlliance: obj.blueAlliance, redAlliance: obj.redAlliance };
  }

  return null;
};

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
    .map(
      (row): PublicMatchItem => ({
        blueAlliance: (row.blueAlliance as string[] | null) ?? [],
        blueScore: row.blueScore,
        details: parseMatchDetails2026(row.details),
        field: row.field,
        matchKey: row.matchKey,
        phase: row.phase,
        playedAt: toIsoOrNull(row.playedAt),
        redAlliance: (row.redAlliance as string[] | null) ?? [],
        redScore: row.redScore,
        resultStatus: row.resultStatus,
        scheduledStartAt: toIsoOrNull(row.scheduledStartAt),
        sequenceNumber: parseSequenceNumber(row.matchKey),
      }),
    )
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

  return {
    blueAlliance: (row.blueAlliance as string[] | null) ?? [],
    blueScore: row.blueScore,
    details: parseMatchDetails2026(row.details),
    field: row.field,
    matchKey: row.matchKey,
    phase: row.phase,
    playedAt: toIsoOrNull(row.playedAt),
    redAlliance: (row.redAlliance as string[] | null) ?? [],
    redScore: row.redScore,
    resultStatus: row.resultStatus,
    scheduledStartAt: toIsoOrNull(row.scheduledStartAt),
    sequenceNumber: parseSequenceNumber(row.matchKey),
  };
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
      details: row.details as Record<string, unknown> | null,
      losses: row.losses,
      matchesPlayed: row.matchesPlayed,
      rank: row.rank,
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
    .where(and(eq(publishedAward.eventKey, eventKey), isNull(publishedAward.deletedAt)));

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
