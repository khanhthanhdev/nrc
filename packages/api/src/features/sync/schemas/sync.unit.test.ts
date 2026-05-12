import { describe, expect, it } from "vitest";
import * as v from "valibot";

import {
  pushSyncBatchRequestSchema,
  pushResourceSchema,
  createSyncClientRequestSchema,
  revokeSyncClientRequestSchema,
  updateSyncPolicyRequestSchema,
  reviewChangeSetRequestSchema,
  inspectionScheduleRecordSchema,
  inspectionResultsRecordSchema,
  matchScheduleRecordSchema,
  matchResultRecordSchema,
  teamRankingsRecordSchema,
  teamAwardsRecordSchema,
  syncModeSchema,
  syncReviewModeSchema,
  scheduleOwnerSchema,
  machinePushResourceTypeSchema,
  machinePullResourceTypeSchema,
} from "./sync.js";
import {
  SYNC_DEFINITION_VERSION,
  SYNC_SCHEMA_VERSION,
} from "../domain/constants.js";

const makeMatchResultDetails = () => ({
  aCenterFlags: 0,
  aFirstTierFlags: 0,
  aSecondTierFlags: 0,
  bBaseFlagsDown: 0,
  bCenterFlagDown: 0,
  cOpponentBackfieldBullets: 0,
  dGoldFlagsDefended: 0,
  dRobotParkState: 0,
  scoreA: 0,
  scoreB: 0,
  scoreC: 0,
  scoreD: 0,
  scoreTotal: 0,
});

describe("syncModeSchema", () => {
  it.each(["upsert", "replace_snapshot"] as const)("accepts %s", (mode) => {
    expect(v.safeParse(syncModeSchema, mode).success).toBe(true);
  });

  it("rejects invalid modes", () => {
    expect(v.safeParse(syncModeSchema, "delete").success).toBe(false);
  });
});

describe("syncReviewModeSchema", () => {
  it.each(["AUTO_ACCEPT", "MANUAL_REVIEW"] as const)("accepts %s", (mode) => {
    expect(v.safeParse(syncReviewModeSchema, mode).success).toBe(true);
  });

  it("rejects invalid modes", () => {
    expect(v.safeParse(syncReviewModeSchema, "auto").success).toBe(false);
  });
});

describe("scheduleOwnerSchema", () => {
  it.each(["WEB", "LOCAL_APP"] as const)("accepts %s", (owner) => {
    expect(v.safeParse(scheduleOwnerSchema, owner).success).toBe(true);
  });

  it("rejects invalid owners", () => {
    expect(v.safeParse(scheduleOwnerSchema, "MOBILE").success).toBe(false);
  });
});

describe("machinePushResourceTypeSchema", () => {
  it.each(["inspection_schedule", "inspection_results", "match_schedule", "match_results", "team_rankings", "team_awards"])(
    "accepts %s",
    (type) => {
      expect(v.safeParse(machinePushResourceTypeSchema, type).success).toBe(true);
    },
  );

  it("rejects pull-only types", () => {
    expect(v.safeParse(machinePushResourceTypeSchema, "season_definition").success).toBe(false);
  });
});

describe("machinePullResourceTypeSchema", () => {
  it.each(["season_definition", "event_manifest", "approved_registrations", "team_operational_profiles", "sync_policy"])(
    "accepts %s",
    (type) => {
      expect(v.safeParse(machinePullResourceTypeSchema, type).success).toBe(true);
    },
  );

  it("rejects push types", () => {
    expect(v.safeParse(machinePullResourceTypeSchema, "match_results").success).toBe(false);
  });
});

describe("inspectionScheduleRecordSchema", () => {
  it("accepts valid minimal record", () => {
    expect(v.safeParse(inspectionScheduleRecordSchema, {
      stage: "hardware",
      status: "scheduled",
      teamNumber: "001",
    }).success).toBe(true);
  });

  it("accepts record with all optional fields", () => {
    expect(v.safeParse(inspectionScheduleRecordSchema, {
      durationMinutes: 15,
      externalInspectionItemId: "ext-1",
      stage: "hardware",
      startsAt: "2026-07-10T10:00:00.000Z",
      stationNumber: "1",
      status: "scheduled",
      teamNumber: "001",
    }).success).toBe(true);
  });

  it("rejects blank teamNumber", () => {
    expect(v.safeParse(inspectionScheduleRecordSchema, {
      stage: "hardware",
      status: "scheduled",
      teamNumber: "   ",
    }).success).toBe(false);
  });

  it("rejects durationMinutes less than 1", () => {
    expect(v.safeParse(inspectionScheduleRecordSchema, {
      durationMinutes: 0,
      stage: "hardware",
      status: "scheduled",
      teamNumber: "001",
    }).success).toBe(false);
  });
});

describe("inspectionResultsRecordSchema", () => {
  it("accepts valid record", () => {
    expect(v.safeParse(inspectionResultsRecordSchema, {
      recordedAt: "2026-07-10T10:00:00.000Z",
      stage: "hardware",
      status: "passed",
      teamNumber: "001",
    }).success).toBe(true);
  });

  it("accepts record with optional comment", () => {
    expect(v.safeParse(inspectionResultsRecordSchema, {
      comment: "Minor adjustment needed",
      recordedAt: "2026-07-10T10:00:00.000Z",
      stage: "hardware",
      status: "conditional_pass",
      teamNumber: "001",
    }).success).toBe(true);
  });

  it("rejects invalid recordedAt", () => {
    expect(v.safeParse(inspectionResultsRecordSchema, {
      recordedAt: "not-a-date",
      stage: "hardware",
      status: "passed",
      teamNumber: "001",
    }).success).toBe(false);
  });
});

describe("matchScheduleRecordSchema", () => {
  const validRecord = {
    alliances: [
      { color: "RED", teamNumbers: ["10", "20"] },
      { color: "BLUE", teamNumbers: ["30", "40"] },
    ],
    matchKey: "Q1",
    matchNumber: 1,
    phase: "QUALIFICATION",
    status: "scheduled",
  };

  it("accepts valid record", () => {
    expect(v.safeParse(matchScheduleRecordSchema, validRecord).success).toBe(true);
  });

  it("accepts all valid phases", () => {
    for (const phase of ["PRACTICE", "QUALIFICATION", "PLAYOFF"]) {
      expect(v.safeParse(matchScheduleRecordSchema, { ...validRecord, phase }).success).toBe(true);
    }
  });

  it("rejects invalid phase", () => {
    expect(v.safeParse(matchScheduleRecordSchema, { ...validRecord, phase: "FINALS" }).success).toBe(false);
  });

  it("rejects matchNumber less than 1", () => {
    expect(v.safeParse(matchScheduleRecordSchema, { ...validRecord, matchNumber: 0 }).success).toBe(false);
  });

  it("rejects blank matchKey", () => {
    expect(v.safeParse(matchScheduleRecordSchema, { ...validRecord, matchKey: "   " }).success).toBe(false);
  });
});

describe("matchResultRecordSchema", () => {
  const validRecord = {
    alliances: [
      { color: "RED", teamNumbers: ["10", "20"] },
      { color: "BLUE", teamNumbers: ["30", "40"] },
    ],
    blueScore: 3,
    matchKey: "Q1",
    phase: "QUALIFICATION",
    redScore: 5,
    status: "final",
  };

  it("accepts valid record", () => {
    expect(v.safeParse(matchResultRecordSchema, validRecord).success).toBe(true);
  });

  it("accepts record with details", () => {
    expect(v.safeParse(matchResultRecordSchema, {
      ...validRecord,
      details: {
        blueAlliance: makeMatchResultDetails(),
        redAlliance: makeMatchResultDetails(),
      },
    }).success).toBe(true);
  });

  it("accepts record with all optional fields", () => {
    expect(v.safeParse(matchResultRecordSchema, {
      ...validRecord,
      bluePenalty: 0,
      cards: ["YELLOW_10"],
      details: {
        blueAlliance: makeMatchResultDetails(),
        redAlliance: makeMatchResultDetails(),
      },
      disqualifications: [],
      externalMatchId: "ext-1",
      noShows: [],
      playedAt: "2026-07-10T10:20:00.000Z",
      redPenalty: 0,
      winnerAlliance: "RED",
    }).success).toBe(true);
  });

  it("rejects negative scores", () => {
    expect(v.safeParse(matchResultRecordSchema, { ...validRecord, redScore: -1 }).success).toBe(false);
  });

  it("rejects invalid winnerAlliance", () => {
    expect(v.safeParse(matchResultRecordSchema, { ...validRecord, winnerAlliance: "GREEN" }).success).toBe(false);
  });
});

describe("teamRankingsRecordSchema", () => {
  const validRecord = {
    losses: 1,
    matchesPlayed: 4,
    rank: 1,
    teamNumber: "010",
    ties: 0,
    wins: 3,
  };

  it("accepts valid record", () => {
    expect(v.safeParse(teamRankingsRecordSchema, validRecord).success).toBe(true);
  });

  it("accepts record with all optional fields", () => {
    expect(v.safeParse(teamRankingsRecordSchema, {
      ...validRecord,
      details: { qualifyingScore: 12 },
      modifiedAt: "2026-07-10T10:00:00.000Z",
      pointsScoredAverage: 45.5,
      pointsScoredTotal: 182,
      qualifyingScore: 12,
      rankChange: -2,
      sortOrders: [12, 45.5, 3],
    }).success).toBe(true);
  });

  it("rejects rank less than 1", () => {
    expect(v.safeParse(teamRankingsRecordSchema, { ...validRecord, rank: 0 }).success).toBe(false);
  });

  it("rejects negative wins", () => {
    expect(v.safeParse(teamRankingsRecordSchema, { ...validRecord, wins: -1 }).success).toBe(false);
  });

  it("rejects negative losses", () => {
    expect(v.safeParse(teamRankingsRecordSchema, { ...validRecord, losses: -1 }).success).toBe(false);
  });

  it("rejects negative ties", () => {
    expect(v.safeParse(teamRankingsRecordSchema, { ...validRecord, ties: -1 }).success).toBe(false);
  });

  it("rejects negative matchesPlayed", () => {
    expect(v.safeParse(teamRankingsRecordSchema, { ...validRecord, matchesPlayed: -1 }).success).toBe(false);
  });
});

describe("teamAwardsRecordSchema", () => {
  it("accepts valid record", () => {
    expect(v.safeParse(teamAwardsRecordSchema, {
      awardKey: "innovation-award",
      awardName: "Innovation Award",
    }).success).toBe(true);
  });

  it("accepts record with all optional fields", () => {
    expect(v.safeParse(teamAwardsRecordSchema, {
      awardKey: "innovation-award",
      awardName: "Innovation Award",
      comment: "Outstanding design",
      payload: { category: "engineering" },
      recipientName: "Team Alpha",
      teamNumber: "010",
    }).success).toBe(true);
  });

  it("rejects blank awardKey", () => {
    expect(v.safeParse(teamAwardsRecordSchema, {
      awardKey: "   ",
      awardName: "Innovation Award",
    }).success).toBe(false);
  });

  it("rejects blank awardName", () => {
    expect(v.safeParse(teamAwardsRecordSchema, {
      awardKey: "innovation-award",
      awardName: "   ",
    }).success).toBe(false);
  });
});

describe("pushResourceSchema", () => {
  it("accepts valid resource", () => {
    expect(v.safeParse(pushResourceSchema, {
      mode: "upsert",
      records: [{ key: "value" }],
      resourceType: "match_results",
    }).success).toBe(true);
  });

  it("accepts resource with schemaRef", () => {
    expect(v.safeParse(pushResourceSchema, {
      mode: "upsert",
      records: [{ key: "value" }],
      resourceType: "match_results",
      schemaRef: "season/2026/match_results@2026.1",
    }).success).toBe(true);
  });

  it("rejects empty records array", () => {
    expect(v.safeParse(pushResourceSchema, {
      mode: "upsert",
      records: [],
      resourceType: "match_results",
    }).success).toBe(false);
  });
});

describe("pushSyncBatchRequestSchema", () => {
  const validRequest = {
    batchId: "batch-1",
    definitionVersion: SYNC_DEFINITION_VERSION,
    producedAt: "2026-04-28T00:00:00.000Z",
    resources: [
      {
        mode: "upsert",
        records: [
          {
            alliances: [
              { color: "RED", teamNumbers: ["1"] },
              { color: "BLUE", teamNumbers: ["2"] },
            ],
            blueScore: 3,
            matchKey: "Q1",
            phase: "QUALIFICATION",
            redScore: 5,
            status: "final",
          },
        ],
        resourceType: "match_results",
      },
    ],
    schemaVersion: SYNC_SCHEMA_VERSION,
  };

  it("accepts valid request", () => {
    expect(v.safeParse(pushSyncBatchRequestSchema, validRequest).success).toBe(true);
  });

  it("accepts request with source", () => {
    expect(v.safeParse(pushSyncBatchRequestSchema, {
      ...validRequest,
      source: {
        appVersion: "1.0.0",
        databaseId: "db-1",
        deviceId: "device-1",
      },
    }).success).toBe(true);
  });

  it("rejects wrong definitionVersion", () => {
    expect(v.safeParse(pushSyncBatchRequestSchema, {
      ...validRequest,
      definitionVersion: "2024.1",
    }).success).toBe(false);
  });

  it("rejects wrong schemaVersion", () => {
    expect(v.safeParse(pushSyncBatchRequestSchema, {
      ...validRequest,
      schemaVersion: "bad",
    }).success).toBe(false);
  });

  it("rejects invalid producedAt", () => {
    expect(v.safeParse(pushSyncBatchRequestSchema, {
      ...validRequest,
      producedAt: "not-a-date",
    }).success).toBe(false);
  });

  it("rejects empty resources array", () => {
    expect(v.safeParse(pushSyncBatchRequestSchema, {
      ...validRequest,
      resources: [],
    }).success).toBe(false);
  });

  it("rejects empty batchId", () => {
    expect(v.safeParse(pushSyncBatchRequestSchema, {
      ...validRequest,
      batchId: "   ",
    }).success).toBe(false);
  });
});

describe("createSyncClientRequestSchema", () => {
  it("accepts valid request", () => {
    expect(v.safeParse(createSyncClientRequestSchema, {
      name: "NRC Sync Client",
    }).success).toBe(true);
  });

  it("accepts request with expiresAt", () => {
    expect(v.safeParse(createSyncClientRequestSchema, {
      expiresAt: "2026-12-31T23:59:59.000Z",
      name: "NRC Sync Client",
    }).success).toBe(true);
  });

  it("accepts request with null expiresAt", () => {
    expect(v.safeParse(createSyncClientRequestSchema, {
      expiresAt: null,
      name: "NRC Sync Client",
    }).success).toBe(true);
  });

  it("rejects blank name", () => {
    expect(v.safeParse(createSyncClientRequestSchema, {
      name: "   ",
    }).success).toBe(false);
  });
});

describe("revokeSyncClientRequestSchema", () => {
  it("accepts empty request", () => {
    expect(v.safeParse(revokeSyncClientRequestSchema, {}).success).toBe(true);
  });

  it("accepts request with reason", () => {
    expect(v.safeParse(revokeSyncClientRequestSchema, {
      reason: "Security incident",
    }).success).toBe(true);
  });

  it("accepts request with null reason", () => {
    expect(v.safeParse(revokeSyncClientRequestSchema, {
      reason: null,
    }).success).toBe(true);
  });
});

describe("updateSyncPolicyRequestSchema", () => {
  it("accepts empty request", () => {
    expect(v.safeParse(updateSyncPolicyRequestSchema, {}).success).toBe(true);
  });

  it("accepts request with all fields", () => {
    expect(v.safeParse(updateSyncPolicyRequestSchema, {
      allowedPushResources: ["match_results", "team_rankings"],
      isSyncEnabled: true,
      reviewMode: "AUTO_ACCEPT",
      scheduleOwner: "WEB",
    }).success).toBe(true);
  });

  it("rejects invalid allowedPushResources", () => {
    expect(v.safeParse(updateSyncPolicyRequestSchema, {
      allowedPushResources: ["invalid_type"],
    }).success).toBe(false);
  });
});

describe("reviewChangeSetRequestSchema", () => {
  it("accepts APPROVED decision", () => {
    expect(v.safeParse(reviewChangeSetRequestSchema, {
      decision: "APPROVED",
    }).success).toBe(true);
  });

  it("accepts REJECTED decision with reason", () => {
    expect(v.safeParse(reviewChangeSetRequestSchema, {
      decision: "REJECTED",
      reason: "Data quality issues",
    }).success).toBe(true);
  });

  it("rejects invalid decision", () => {
    expect(v.safeParse(reviewChangeSetRequestSchema, {
      decision: "PENDING",
    }).success).toBe(false);
  });
});
