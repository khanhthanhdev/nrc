import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { DuplicateSyncRecordKeyError, parsePushResourceRecords } from "../domain/resources.js";
import { pushSyncBatchRequestSchema } from "./sync.js";
import type { PushResource } from "./sync.js";

const details = {
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
};

describe("sync schemas", () => {
  it("accepts valid push payloads", () => {
    const parsed = v.parse(pushSyncBatchRequestSchema, {
      batchId: "batch-1",
      definitionVersion: "2026.1",
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
              details: { blueAlliance: details, redAlliance: details },
              matchKey: "Q1",
              phase: "QUALIFICATION",
              redScore: 5,
              status: "final",
            },
          ],
          resourceType: "match_results",
          schemaRef: "season/2026/match_results@2026.1",
        },
      ],
      schemaVersion: "2026-05-09",
    });

    expect(parsed.resources[0]?.resourceType).toBe("match_results");
  });

  it("rejects invalid versions, timestamps, and enums", () => {
    expect(
      v.safeParse(pushSyncBatchRequestSchema, {
        batchId: "batch-1",
        definitionVersion: "2024.1",
        producedAt: "not-a-date",
        resources: [{ mode: "upsert", records: [{}], resourceType: "bad" }],
        schemaVersion: "bad",
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate record keys within a resource", () => {
    const resource: PushResource = {
      mode: "replace_snapshot",
      records: [
        { rank: 1, teamNumber: "10", wins: 1, losses: 0, ties: 0, matchesPlayed: 1 },
        { rank: 2, teamNumber: "10", wins: 0, losses: 1, ties: 0, matchesPlayed: 1 },
      ],
      resourceType: "team_rankings",
    };

    expect(() => parsePushResourceRecords(resource)).toThrow(DuplicateSyncRecordKeyError);
  });

  it("emits guardrail warnings for match result issues", () => {
    const resource: PushResource = {
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
    };

    expect(parsePushResourceRecords(resource).warnings.map((warning) => warning.code)).toEqual([
      "MATCH_RESULT_DETAILS_REQUIRED",
      "MATCH_TEAM_DUPLICATE",
    ]);
  });
});
