import * as v from "valibot";

import type { MachinePushResourceType } from "./constants.js";
import {
  inspectionResultsRecordSchema,
  inspectionScheduleRecordSchema,
  matchResultRecordSchema,
  matchScheduleRecordSchema,
  teamAwardsRecordSchema,
  teamRankingsRecordSchema,
} from "../schemas/sync.js";
import type { PushResource } from "../schemas/sync.js";

export interface SyncBatchWarning {
  code: string;
  message: string;
  recordKey?: string;
  resourceType?: MachinePushResourceType;
}

export interface StagedResourceItem {
  operation: "upsert" | "delete" | "replace_snapshot";
  payload: Record<string, unknown>;
  recordKey: string;
  resourceType: MachinePushResourceType;
}

export class DuplicateSyncRecordKeyError extends Error {
  public readonly recordKey: string;
  public readonly resourceType: MachinePushResourceType;

  constructor(resourceType: MachinePushResourceType, recordKey: string) {
    super(`Duplicate record key ${recordKey} for ${resourceType}.`);
    this.name = "DuplicateSyncRecordKeyError";
    this.recordKey = recordKey;
    this.resourceType = resourceType;
  }
}

const schemaByResourceType = {
  inspection_results: inspectionResultsRecordSchema,
  inspection_schedule: inspectionScheduleRecordSchema,
  match_results: matchResultRecordSchema,
  match_schedule: matchScheduleRecordSchema,
  team_awards: teamAwardsRecordSchema,
  team_rankings: teamRankingsRecordSchema,
} satisfies Record<MachinePushResourceType, v.GenericSchema>;

export const getRecordKey = (
  resourceType: MachinePushResourceType,
  record: Record<string, unknown>,
): string => {
  switch (resourceType) {
    case "inspection_schedule": {
      return String(record.externalInspectionItemId ?? `${record.teamNumber}_${record.stage}`);
    }
    case "inspection_results": {
      return `${String(record.teamNumber)}_${String(record.stage)}`;
    }
    case "match_schedule": {
      return String(record.externalScheduleDetailId ?? record.matchKey);
    }
    case "match_results": {
      return String(record.externalMatchId ?? record.matchKey);
    }
    case "team_rankings": {
      return String(record.teamNumber);
    }
    case "team_awards": {
      return String(record.awardKey);
    }
  }
};

const hasBothAlliances = (record: Record<string, unknown>): boolean => {
  const alliances = record.alliances;
  if (!Array.isArray(alliances)) {
    return false;
  }

  const colors = new Set(
    alliances
      .map((alliance) =>
        alliance && typeof alliance === "object"
          ? (alliance as { color?: unknown }).color
          : undefined,
      )
      .filter(Boolean),
  );

  return colors.has("RED") && colors.has("BLUE");
};

const hasDuplicateMatchTeams = (record: Record<string, unknown>): boolean => {
  const alliances = record.alliances;
  if (!Array.isArray(alliances)) {
    return false;
  }

  const seen = new Set<string>();
  for (const alliance of alliances) {
    const teamNumbers =
      alliance && typeof alliance === "object"
        ? (alliance as { teamNumbers?: unknown }).teamNumbers
        : undefined;
    if (!Array.isArray(teamNumbers)) {
      continue;
    }
    for (const teamNumber of teamNumbers) {
      const key = String(teamNumber);
      if (seen.has(key)) {
        return true;
      }
      seen.add(key);
    }
  }

  return false;
};

export const parsePushResourceRecords = (
  resource: PushResource,
): {
  records: Record<string, unknown>[];
  stagedItems: StagedResourceItem[];
  warnings: SyncBatchWarning[];
} => {
  const schema = schemaByResourceType[resource.resourceType];
  const warnings: SyncBatchWarning[] = [];
  const records = resource.records.map(
    (record) => v.parse(schema, record) as Record<string, unknown>,
  );
  const keys = new Set<string>();
  const stagedItems: StagedResourceItem[] = [];

  for (const record of records) {
    const recordKey = getRecordKey(resource.resourceType, record);
    if (keys.has(recordKey)) {
      throw new DuplicateSyncRecordKeyError(resource.resourceType, recordKey);
    }
    keys.add(recordKey);

    if (
      (resource.resourceType === "match_schedule" || resource.resourceType === "match_results") &&
      !hasBothAlliances(record)
    ) {
      warnings.push({
        code: "MATCH_ALLIANCE_INCOMPLETE",
        message: "Match record must include both RED and BLUE alliances.",
        recordKey,
        resourceType: resource.resourceType,
      });
    }

    if (resource.resourceType === "match_results") {
      if (record.phase !== "PRACTICE" && !record.details) {
        warnings.push({
          code: "MATCH_RESULT_DETAILS_REQUIRED",
          message: "Qualification and playoff results require details.",
          recordKey,
          resourceType: resource.resourceType,
        });
      }

      if (hasDuplicateMatchTeams(record)) {
        warnings.push({
          code: "MATCH_TEAM_DUPLICATE",
          message: "A team cannot appear more than once in the same match.",
          recordKey,
          resourceType: resource.resourceType,
        });
      }
    }

    stagedItems.push({
      operation: resource.mode,
      payload: record,
      recordKey,
      resourceType: resource.resourceType,
    });
  }

  return { records, stagedItems, warnings };
};
