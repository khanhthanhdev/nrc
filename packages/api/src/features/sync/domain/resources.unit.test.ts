import { describe, expect, it } from "vitest";

import {
  DuplicateSyncRecordKeyError,
  getRecordKey,
  parsePushResourceRecords,
} from "./resources.js";

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

describe("getRecordKey", () => {
  it("returns externalInspectionItemId for inspection_schedule when present", () => {
    const key = getRecordKey("inspection_schedule", {
      externalInspectionItemId: "ext-123",
      stage: "hardware",
      teamNumber: "001",
    });
    expect(key).toBe("ext-123");
  });

  it("falls back to teamNumber_stage for inspection_schedule", () => {
    const key = getRecordKey("inspection_schedule", {
      stage: "hardware",
      teamNumber: "001",
    });
    expect(key).toBe("001_hardware");
  });

  it("returns teamNumber_stage for inspection_results", () => {
    const key = getRecordKey("inspection_results", {
      stage: "software",
      teamNumber: "002",
    });
    expect(key).toBe("002_software");
  });

  it("returns externalScheduleDetailId for match_schedule when present", () => {
    const key = getRecordKey("match_schedule", {
      externalScheduleDetailId: "sched-1",
      matchKey: "Q1",
    });
    expect(key).toBe("sched-1");
  });

  it("falls back to matchKey for match_schedule", () => {
    const key = getRecordKey("match_schedule", { matchKey: "Q1" });
    expect(key).toBe("Q1");
  });

  it("returns externalMatchId for match_results when present", () => {
    const key = getRecordKey("match_results", {
      externalMatchId: "match-1",
      matchKey: "Q1",
    });
    expect(key).toBe("match-1");
  });

  it("falls back to matchKey for match_results", () => {
    const key = getRecordKey("match_results", { matchKey: "Q1" });
    expect(key).toBe("Q1");
  });

  it("returns teamNumber for team_rankings", () => {
    const key = getRecordKey("team_rankings", { teamNumber: "010" });
    expect(key).toBe("010");
  });

  it("returns awardKey for team_awards", () => {
    const key = getRecordKey("team_awards", { awardKey: "innovation-award" });
    expect(key).toBe("innovation-award");
  });
});

describe("DuplicateSyncRecordKeyError", () => {
  it("sets name, message, recordKey, and resourceType", () => {
    const error = new DuplicateSyncRecordKeyError("match_results", "Q1");

    expect(error.name).toBe("DuplicateSyncRecordKeyError");
    expect(error.message).toBe("Duplicate record key Q1 for match_results.");
    expect(error.recordKey).toBe("Q1");
    expect(error.resourceType).toBe("match_results");
  });

  it("is an instance of Error", () => {
    const error = new DuplicateSyncRecordKeyError("team_rankings", "010");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("parsePushResourceRecords", () => {
  it("parses match results and returns stagedItems", () => {
    const result = parsePushResourceRecords({
      mode: "upsert",
      records: [
        {
          alliances: [
            { color: "RED", teamNumbers: ["1"] },
            { color: "BLUE", teamNumbers: ["2"] },
          ],
          blueScore: 3,
          details: { blueAlliance: makeMatchResultDetails(), redAlliance: makeMatchResultDetails() },
          matchKey: "Q1",
          phase: "QUALIFICATION",
          redScore: 5,
          status: "final",
        },
      ],
      resourceType: "match_results",
    });

    expect(result.records).toHaveLength(1);
    expect(result.stagedItems).toHaveLength(1);
    expect(result.stagedItems[0]?.recordKey).toBe("Q1");
    expect(result.stagedItems[0]?.operation).toBe("upsert");
    expect(result.stagedItems[0]?.resourceType).toBe("match_results");
  });

  it("throws DuplicateSyncRecordKeyError for duplicate keys", () => {
    expect(() =>
      parsePushResourceRecords({
        mode: "replace_snapshot",
        records: [
          { rank: 1, teamNumber: "10", wins: 1, losses: 0, ties: 0, matchesPlayed: 1 },
          { rank: 2, teamNumber: "10", wins: 0, losses: 1, ties: 0, matchesPlayed: 1 },
        ],
        resourceType: "team_rankings",
      }),
    ).toThrow(DuplicateSyncRecordKeyError);
  });

  it("warns about missing match result details for qualification", () => {
    const result = parsePushResourceRecords({
      mode: "upsert",
      records: [
        {
          alliances: [
            { color: "RED", teamNumbers: ["10"] },
            { color: "BLUE", teamNumbers: ["20"] },
          ],
          blueScore: 1,
          matchKey: "Q1",
          phase: "QUALIFICATION",
          redScore: 2,
          status: "final",
        },
      ],
      resourceType: "match_results",
    });

    const warningCodes = result.warnings.map((w) => w.code);
    expect(warningCodes).toContain("MATCH_RESULT_DETAILS_REQUIRED");
  });

  it("does not warn about missing details for practice matches", () => {
    const result = parsePushResourceRecords({
      mode: "upsert",
      records: [
        {
          alliances: [
            { color: "RED", teamNumbers: ["10"] },
            { color: "BLUE", teamNumbers: ["20"] },
          ],
          blueScore: 1,
          matchKey: "P1",
          phase: "PRACTICE",
          redScore: 2,
          status: "final",
        },
      ],
      resourceType: "match_results",
    });

    const warningCodes = result.warnings.map((w) => w.code);
    expect(warningCodes).not.toContain("MATCH_RESULT_DETAILS_REQUIRED");
  });

  it("warns about duplicate teams in match", () => {
    const result = parsePushResourceRecords({
      mode: "upsert",
      records: [
        {
          alliances: [
            { color: "RED", teamNumbers: ["10", "10"] },
            { color: "BLUE", teamNumbers: ["20"] },
          ],
          blueScore: 1,
          matchKey: "Q1",
          phase: "QUALIFICATION",
          redScore: 2,
          status: "final",
        },
      ],
      resourceType: "match_results",
    });

    const warningCodes = result.warnings.map((w) => w.code);
    expect(warningCodes).toContain("MATCH_TEAM_DUPLICATE");
  });

  it("warns about incomplete alliances", () => {
    const result = parsePushResourceRecords({
      mode: "upsert",
      records: [
        {
          alliances: [{ color: "RED", teamNumbers: ["10"] }],
          blueScore: 1,
          matchKey: "Q1",
          phase: "QUALIFICATION",
          redScore: 2,
          status: "final",
        },
      ],
      resourceType: "match_results",
    });

    const warningCodes = result.warnings.map((w) => w.code);
    expect(warningCodes).toContain("MATCH_ALLIANCE_INCOMPLETE");
  });

  it("warns about incomplete alliances for match_schedule", () => {
    const result = parsePushResourceRecords({
      mode: "replace_snapshot",
      records: [
        {
          alliances: [{ color: "RED", teamNumbers: ["10"] }],
          matchKey: "Q1",
          matchNumber: 1,
          phase: "QUALIFICATION",
          status: "scheduled",
        },
      ],
      resourceType: "match_schedule",
    });

    const warningCodes = result.warnings.map((w) => w.code);
    expect(warningCodes).toContain("MATCH_ALLIANCE_INCOMPLETE");
  });

  it("parses team_rankings records", () => {
    const result = parsePushResourceRecords({
      mode: "replace_snapshot",
      records: [
        { rank: 1, teamNumber: "010", wins: 3, losses: 1, ties: 0, matchesPlayed: 4 },
        { rank: 2, teamNumber: "020", wins: 2, losses: 2, ties: 0, matchesPlayed: 4 },
      ],
      resourceType: "team_rankings",
    });

    expect(result.records).toHaveLength(2);
    expect(result.stagedItems).toHaveLength(2);
    expect(result.stagedItems[0]?.recordKey).toBe("010");
    expect(result.stagedItems[1]?.recordKey).toBe("020");
    expect(result.warnings).toHaveLength(0);
  });

  it("parses inspection_schedule records", () => {
    const result = parsePushResourceRecords({
      mode: "replace_snapshot",
      records: [
        {
          stage: "hardware",
          status: "scheduled",
          teamNumber: "001",
        },
      ],
      resourceType: "inspection_schedule",
    });

    expect(result.records).toHaveLength(1);
    expect(result.stagedItems[0]?.recordKey).toBe("001_hardware");
  });

  it("parses inspection_results records", () => {
    const result = parsePushResourceRecords({
      mode: "upsert",
      records: [
        {
          recordedAt: "2026-07-10T10:00:00.000Z",
          stage: "hardware",
          status: "passed",
          teamNumber: "001",
        },
      ],
      resourceType: "inspection_results",
    });

    expect(result.records).toHaveLength(1);
    expect(result.stagedItems[0]?.recordKey).toBe("001_hardware");
  });

  it("parses team_awards records", () => {
    const result = parsePushResourceRecords({
      mode: "replace_snapshot",
      records: [
        {
          awardKey: "innovation-award",
          awardName: "Innovation Award",
          comment: "Outstanding design",
          recipientName: "Team Alpha",
          teamNumber: "010",
        },
      ],
      resourceType: "team_awards",
    });

    expect(result.records).toHaveLength(1);
    expect(result.stagedItems[0]?.recordKey).toBe("innovation-award");
  });

  it("parses match_schedule records", () => {
    const result = parsePushResourceRecords({
      mode: "replace_snapshot",
      records: [
        {
          alliances: [
            { color: "RED", teamNumbers: ["10", "20"] },
            { color: "BLUE", teamNumbers: ["30", "40"] },
          ],
          matchKey: "Q1",
          matchNumber: 1,
          phase: "QUALIFICATION",
          status: "scheduled",
        },
      ],
      resourceType: "match_schedule",
    });

    expect(result.records).toHaveLength(1);
    expect(result.stagedItems[0]?.recordKey).toBe("Q1");
  });

  it("returns empty results for empty records", () => {
    const result = parsePushResourceRecords({
      mode: "replace_snapshot",
      records: [],
      resourceType: "team_rankings",
    });

    expect(result.records).toHaveLength(0);
    expect(result.stagedItems).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});
