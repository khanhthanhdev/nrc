import * as v from "valibot";

import {
  MACHINE_PULL_RESOURCE_TYPES,
  MACHINE_PUSH_RESOURCE_TYPES,
  SYNC_DEFINITION_VERSION,
  SYNC_SCHEMA_VERSION,
} from "../domain/constants.js";

const trimmedString = (maxLength: number) =>
  v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(maxLength));

const optionalTrimmedString = (maxLength: number) => v.optional(trimmedString(maxLength));

const timestampString = v.pipe(
  v.string(),
  v.trim(),
  v.isoTimestamp("Expected an ISO 8601 UTC timestamp."),
);

const jsonObject = v.pipe(
  v.unknown(),
  v.check(
    (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value),
    "Expected a JSON object.",
  ),
  v.transform((value) => value as Record<string, unknown>),
);

export const eventCodeSchema = v.pipe(
  v.string(),
  v.trim(),
  v.toUpperCase(),
  v.regex(/^[A-Z0-9][A-Z0-9_-]{1,49}$/),
);

export const seasonSchema = v.pipe(v.string(), v.trim(), v.regex(/^\d{4}$/));

export const machinePushResourceTypeSchema = v.picklist(MACHINE_PUSH_RESOURCE_TYPES);
export const machinePullResourceTypeSchema = v.picklist(MACHINE_PULL_RESOURCE_TYPES);
export const syncReviewModeSchema = v.picklist(["AUTO_ACCEPT", "MANUAL_REVIEW"]);
export const scheduleOwnerSchema = v.picklist(["WEB", "LOCAL_APP"]);
export const syncModeSchema = v.picklist(["upsert", "replace_snapshot"]);

const allianceSchema = v.object({
  color: v.picklist(["RED", "BLUE"]),
  teamNumbers: v.array(trimmedString(32)),
});

const matchResultAllianceDetailsSchema = v.object({
  aCenterFlags: v.pipe(v.number(), v.integer(), v.minValue(0)),
  aFirstTierFlags: v.pipe(v.number(), v.integer(), v.minValue(0)),
  aSecondTierFlags: v.pipe(v.number(), v.integer(), v.minValue(0)),
  bBaseFlagsDown: v.pipe(v.number(), v.integer(), v.minValue(0)),
  bCenterFlagDown: v.pipe(v.number(), v.integer(), v.minValue(0)),
  cOpponentBackfieldBullets: v.pipe(v.number(), v.integer(), v.minValue(0)),
  dGoldFlagsDefended: v.pipe(v.number(), v.integer(), v.minValue(0)),
  dRobotParkState: v.pipe(v.number(), v.integer(), v.minValue(0)),
  scoreA: v.pipe(v.number(), v.integer()),
  scoreB: v.pipe(v.number(), v.integer()),
  scoreC: v.pipe(v.number(), v.integer()),
  scoreD: v.pipe(v.number(), v.integer()),
  scoreTotal: v.pipe(v.number(), v.integer()),
});

const matchResultDetailsSchema = v.object({
  blueAlliance: matchResultAllianceDetailsSchema,
  redAlliance: matchResultAllianceDetailsSchema,
});

export const inspectionScheduleRecordSchema = v.object({
  durationMinutes: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
  externalInspectionItemId: optionalTrimmedString(128),
  stage: trimmedString(80),
  startsAt: v.optional(timestampString),
  stationNumber: optionalTrimmedString(80),
  status: trimmedString(80),
  teamNumber: trimmedString(32),
});

export const inspectionResultsRecordSchema = v.object({
  comment: optionalTrimmedString(2000),
  recordedAt: timestampString,
  stage: trimmedString(80),
  status: trimmedString(80),
  teamNumber: trimmedString(32),
});

export const matchScheduleRecordSchema = v.object({
  alliances: v.array(allianceSchema),
  description: optionalTrimmedString(255),
  externalScheduleDetailId: optionalTrimmedString(128),
  matchKey: trimmedString(80),
  matchNumber: v.pipe(v.number(), v.integer(), v.minValue(1)),
  phase: v.picklist(["PRACTICE", "QUALIFICATION", "PLAYOFF"]),
  playNumber: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
  scheduledAt: v.optional(timestampString),
  status: trimmedString(80),
});

export const matchResultRecordSchema = v.object({
  alliances: v.array(allianceSchema),
  bluePenalty: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  blueScore: v.pipe(v.number(), v.integer(), v.minValue(0)),
  cards: v.optional(v.array(trimmedString(80))),
  details: v.optional(matchResultDetailsSchema),
  disqualifications: v.optional(v.array(trimmedString(80))),
  externalMatchId: optionalTrimmedString(128),
  matchKey: trimmedString(80),
  noShows: v.optional(v.array(trimmedString(80))),
  phase: v.picklist(["PRACTICE", "QUALIFICATION", "PLAYOFF"]),
  playedAt: v.optional(timestampString),
  redPenalty: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  redScore: v.pipe(v.number(), v.integer(), v.minValue(0)),
  status: trimmedString(80),
  winnerAlliance: v.optional(v.picklist(["RED", "BLUE", "TIE"])),
});

export const teamRankingsRecordSchema = v.object({
  details: v.optional(jsonObject),
  losses: v.pipe(v.number(), v.integer(), v.minValue(0)),
  matchesPlayed: v.pipe(v.number(), v.integer(), v.minValue(0)),
  modifiedAt: v.optional(timestampString),
  pointsScoredAverage: v.optional(v.number()),
  pointsScoredTotal: v.optional(v.number()),
  qualifyingScore: v.optional(v.number()),
  rank: v.pipe(v.number(), v.integer(), v.minValue(1)),
  rankChange: v.optional(v.pipe(v.number(), v.integer())),
  sortOrders: v.optional(v.array(v.number())),
  teamNumber: trimmedString(32),
  ties: v.pipe(v.number(), v.integer(), v.minValue(0)),
  wins: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

export const teamAwardsRecordSchema = v.object({
  awardKey: trimmedString(128),
  awardName: trimmedString(255),
  comment: optionalTrimmedString(2000),
  payload: v.optional(jsonObject),
  recipientName: optionalTrimmedString(255),
  teamNumber: optionalTrimmedString(32),
});

export const pushResourceSchema = v.object({
  mode: syncModeSchema,
  records: v.pipe(v.array(v.unknown()), v.minLength(1)),
  resourceType: machinePushResourceTypeSchema,
  schemaRef: v.optional(v.pipe(v.string(), v.trim(), v.includes("@"))),
});

export const pushSyncBatchRequestSchema = v.object({
  batchId: trimmedString(128),
  definitionVersion: v.literal(SYNC_DEFINITION_VERSION),
  producedAt: timestampString,
  resources: v.pipe(v.array(pushResourceSchema), v.minLength(1)),
  schemaVersion: v.literal(SYNC_SCHEMA_VERSION),
  source: v.optional(
    v.object({
      appVersion: trimmedString(128),
      databaseId: optionalTrimmedString(128),
      deviceId: optionalTrimmedString(128),
    }),
  ),
});

export const createSyncClientRequestSchema = v.object({
  expiresAt: v.optional(v.nullable(timestampString)),
  name: trimmedString(255),
});

export const revokeSyncClientRequestSchema = v.object({
  reason: v.optional(v.nullable(trimmedString(1000))),
});

export const updateSyncPolicyRequestSchema = v.object({
  allowedPushResources: v.optional(v.array(machinePushResourceTypeSchema)),
  isSyncEnabled: v.optional(v.boolean()),
  reviewMode: v.optional(syncReviewModeSchema),
  scheduleOwner: v.optional(scheduleOwnerSchema),
});

export const reviewChangeSetRequestSchema = v.object({
  decision: v.picklist(["APPROVED", "REJECTED"]),
  reason: v.optional(v.nullable(trimmedString(2000))),
});

export type PushSyncBatchRequest = v.InferOutput<typeof pushSyncBatchRequestSchema>;
export type PushResource = v.InferOutput<typeof pushResourceSchema>;
export type CreateSyncClientRequest = v.InferOutput<typeof createSyncClientRequestSchema>;
export type UpdateSyncPolicyRequest = v.InferOutput<typeof updateSyncPolicyRequestSchema>;
export type RevokeSyncClientRequest = v.InferOutput<typeof revokeSyncClientRequestSchema>;
export type ReviewChangeSetRequest = v.InferOutput<typeof reviewChangeSetRequestSchema>;
