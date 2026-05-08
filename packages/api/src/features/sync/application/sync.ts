import {
  db,
  eventTable,
  eventTeamProfileTable,
  publishedAward,
  publishedInspection,
  publishedMatch,
  publishedRanking,
  registrationTable,
  syncAuditLog,
  syncChangeSet,
  syncClient,
  syncClientSecret,
  syncEventPolicy,
  syncPushBatch,
  syncPushResource,
  syncReviewDecision,
  syncStagedItem,
  team,
} from "@nrc-full/db";
import { and, desc, eq, inArray, isNull, notInArray } from "drizzle-orm";
import * as v from "valibot";

import {
  DEFAULT_ALLOWED_PUSH_RESOURCES,
  MACHINE_PULL_RESOURCE_TYPES,
  SUPPORTED_SYNC_SEASON,
  SYNC_DEFINITION_VERSION,
  SYNC_SCHEMA_VERSION,
} from "../domain/constants.js";
import type { MachinePushResourceType } from "../domain/constants.js";
import { hashCanonicalPayload } from "../domain/hash.js";
import { DuplicateSyncRecordKeyError, parsePushResourceRecords } from "../domain/resources.js";
import type { StagedResourceItem, SyncBatchWarning } from "../domain/resources.js";
import {
  decryptMachineSecret,
  encryptMachineSecret,
  generateMachineSecret,
  getMachineSecretPrefix,
  hashMachineSecret,
} from "../domain/secrets.js";
import type {
  CreateSyncClientRequest,
  PushSyncBatchRequest,
  ReviewChangeSetRequest,
  UpdateSyncPolicyRequest,
} from "../schemas/sync.js";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type SyncClientRecord = typeof syncClient.$inferSelect;
type SyncClientSecretRecord = typeof syncClientSecret.$inferSelect;
type SyncPolicyRecord = typeof syncEventPolicy.$inferSelect;
type SyncPushResourceRecord = typeof syncPushResource.$inferSelect;
type SyncStagedItemRecord = typeof syncStagedItem.$inferSelect;
type SyncBatchStatus =
  | "validated"
  | "applied"
  | "pending_review"
  | "duplicate"
  | "rejected"
  | "failed";

interface SyncBatchSource {
  appVersion: string;
  databaseId?: string;
  deviceId?: string;
}

interface SyncBatchListItem {
  batchId: string;
  definitionVersion: string;
  deletedAt: Date | null;
  deletedByUserId: string | null;
  eventKey: string;
  id: string;
  payloadHash: string;
  rawPayload: Record<string, unknown> | null;
  receivedAt: Date;
  reviewReason: string | null;
  reviewedAt: Date | null;
  reviewerId: string | null;
  schemaVersion: string;
  source: SyncBatchSource | null;
  status: SyncBatchStatus;
  syncClientId: string;
  warnings: SyncBatchWarning[] | null;
}

interface SyncChangeSummary {
  addedCount: number;
  modifiedCount: number;
  removedCount: number;
  resourceTypes: MachinePushResourceType[];
}

interface SyncChangeSetDetail {
  createdAt: Date;
  deletedAt: Date | null;
  deletedByUserId: string | null;
  eventKey: string;
  id: string;
  publishedAt: Date | null;
  pushBatchId: string;
  status: SyncBatchStatus;
  summary: SyncChangeSummary | null;
}

interface PushSyncBatchResult {
  changeSetId?: string;
  pushBatchId: string;
  status: "applied" | "duplicate" | "pending_review";
  warnings: SyncBatchWarning[];
}

interface SyncClientAdminDto {
  canCopy: boolean;
  createdAt: Date;
  deletedAt: Date | null;
  deletedByUserId: string | null;
  eventKey: string;
  expiresAt: Date | null;
  id: string;
  isActive: boolean;
  isRevoked: boolean;
  lastUsedAt: Date | null;
  machineSecret: string | null;
  name: string;
  revokedAt: Date | null;
  revokedReason: string | null;
  secret: {
    expiresAt: Date | null;
    id: string;
    isActive: boolean;
    lastUsedAt: Date | null;
    revokedAt: Date | null;
    tokenPrefix: string;
  } | null;
  tokenPrefix: string | null;
  updatedAt: Date;
}

interface SyncBatchDetail {
  batch: SyncBatchListItem;
  changeSet: SyncChangeSetDetail | null;
  resources: SyncPushResourceRecord[];
  stagedItems: SyncStagedItemRecord[];
}

const normalizeBatchWarning = (warning: SyncBatchWarning): SyncBatchWarning => ({
  code: warning.code,
  message: warning.message,
  recordKey: warning.recordKey,
  resourceType: warning.resourceType as MachinePushResourceType | undefined,
});

const normalizeChangeSummary = (
  summary: SyncChangeSummary | null | undefined,
): SyncChangeSummary | null =>
  summary
    ? {
        addedCount: summary.addedCount,
        modifiedCount: summary.modifiedCount,
        removedCount: summary.removedCount,
        resourceTypes: summary.resourceTypes,
      }
    : null;

const normalizeBatchListItem = (batch: typeof syncPushBatch.$inferSelect): SyncBatchListItem => ({
  ...batch,
  warnings:
    batch.warnings?.map((warning) => normalizeBatchWarning(warning as SyncBatchWarning)) ?? null,
});

const normalizeChangeSetDetail = (
  changeSet: typeof syncChangeSet.$inferSelect,
): SyncChangeSetDetail => ({
  ...changeSet,
  summary: normalizeChangeSummary(changeSet.summary as SyncChangeSummary | null | undefined),
});

const toSyncClientAdminDto = async (
  client: SyncClientRecord,
  secret: SyncClientSecretRecord | null,
): Promise<SyncClientAdminDto> => {
  let machineSecret: string | null = null;

  try {
    machineSecret = await decryptMachineSecret(
      secret?.machineSecretCiphertext && secret.machineSecretIv
        ? {
            machineSecretCiphertext: secret.machineSecretCiphertext,
            machineSecretIv: secret.machineSecretIv,
          }
        : null,
    );
  } catch {
    machineSecret = null;
  }

  return {
    ...client,
    canCopy: Boolean(machineSecret) && client.isActive && !client.isRevoked && Boolean(secret?.isActive),
    machineSecret:
      client.isActive && !client.isRevoked && secret?.isActive ? machineSecret : null,
    secret: secret
      ? {
          expiresAt: secret.expiresAt,
          id: secret.id,
          isActive: secret.isActive,
          lastUsedAt: secret.lastUsedAt,
          revokedAt: secret.revokedAt,
          tokenPrefix: secret.tokenPrefix,
        }
      : null,
    tokenPrefix: secret?.tokenPrefix ?? null,
  };
};

export class SyncApiError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "SyncApiError";
    this.status = status;
    this.code = code;
  }
}

const eventKeyFor = (season: string, eventCode: string): string => `${season}/${eventCode}`;

const toDateOrNull = (value: string | null | undefined): Date | null =>
  value ? new Date(value) : null;

const ensureEvent = async (eventKey: string) => {
  const [event] = await db
    .select()
    .from(eventTable)
    .where(and(eq(eventTable.eventKey, eventKey), isNull(eventTable.deletedAt)))
    .limit(1);

  if (!event) {
    throw new SyncApiError(404, "NOT_FOUND", "Event not found.");
  }

  return event;
};

const getOrCreatePolicy = async (tx: Tx, eventKey: string): Promise<SyncPolicyRecord> => {
  const [existing] = await tx
    .select()
    .from(syncEventPolicy)
    .where(and(eq(syncEventPolicy.eventKey, eventKey), isNull(syncEventPolicy.deletedAt)))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await tx
    .insert(syncEventPolicy)
    .values({
      allowedPushResources: DEFAULT_ALLOWED_PUSH_RESOURCES,
      eventKey,
      id: crypto.randomUUID(),
      isSyncEnabled: false,
      reviewMode: "AUTO_ACCEPT",
      scheduleOwner: "WEB",
    })
    .returning();

  if (!created) {
    throw new SyncApiError(500, "POLICY_CREATE_FAILED", "Failed to create sync policy.");
  }

  return created;
};

export const authenticateMachineClient = async (authorizationHeader: string | null) => {
  const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new SyncApiError(401, "UNAUTHORIZED", "Missing bearer token.");
  }

  const secret = match[1]?.trim();
  if (!secret) {
    throw new SyncApiError(401, "UNAUTHORIZED", "Missing bearer token.");
  }

  const tokenPrefix = getMachineSecretPrefix(secret);
  const secretHash = await hashMachineSecret(secret);

  const [row] = await db
    .select({
      client: syncClient,
      secret: syncClientSecret,
    })
    .from(syncClientSecret)
    .innerJoin(syncClient, eq(syncClientSecret.syncClientId, syncClient.id))
    .where(
      and(
        eq(syncClientSecret.tokenPrefix, tokenPrefix),
        eq(syncClientSecret.secretHash, secretHash),
        isNull(syncClientSecret.deletedAt),
        isNull(syncClient.deletedAt),
      ),
    )
    .limit(1);

  if (!row) {
    throw new SyncApiError(401, "UNAUTHORIZED", "Invalid bearer token.");
  }

  const now = new Date();
  if (row.client.isRevoked || row.secret.revokedAt) {
    throw new SyncApiError(403, "CLIENT_REVOKED", "Client was revoked.");
  }
  if (!row.client.isActive || !row.secret.isActive) {
    throw new SyncApiError(403, "CLIENT_REVOKED", "Client is inactive.");
  }
  if (
    (row.client.expiresAt && row.client.expiresAt <= now) ||
    (row.secret.expiresAt && row.secret.expiresAt <= now)
  ) {
    throw new SyncApiError(403, "CLIENT_EXPIRED", "Client expired.");
  }

  await db.transaction(async (tx) => {
    await tx.update(syncClient).set({ lastUsedAt: now }).where(eq(syncClient.id, row.client.id));
    await tx
      .update(syncClientSecret)
      .set({ lastUsedAt: now })
      .where(eq(syncClientSecret.id, row.secret.id));
  });

  return row.client;
};

export const getBootstrap = async (client: SyncClientRecord) => {
  const event = await ensureEvent(client.eventKey);
  const policy = await db.transaction((tx) => getOrCreatePolicy(tx, event.eventKey));

  const registrations = await db
    .select({
      registration: registrationTable,
      team,
    })
    .from(registrationTable)
    .innerJoin(team, eq(registrationTable.teamId, team.id))
    .where(
      and(
        eq(registrationTable.eventId, event.id),
        eq(registrationTable.status, "approved"),
        isNull(registrationTable.deletedAt),
        isNull(team.deletedAt),
      ),
    );

  const profiles = await db
    .select({
      profile: eventTeamProfileTable,
      team,
    })
    .from(eventTeamProfileTable)
    .innerJoin(team, eq(eventTeamProfileTable.teamId, team.id))
    .where(
      and(eq(eventTeamProfileTable.eventId, event.id), isNull(eventTeamProfileTable.deletedAt)),
    );

  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    resources: {
      approvedRegistrations: registrations.map(({ registration, team: teamRecord }) => ({
        organizationName: teamRecord.schoolOrOrganization ?? "",
        registrationId: registration.id,
        status: registration.status,
        teamId: teamRecord.id,
        teamName: teamRecord.name,
        teamNumber: teamRecord.teamNumber,
      })),
      eventManifest: {
        canonicalPath: `/${event.season}/${event.eventCode}`,
        definitionVersion: SYNC_DEFINITION_VERSION,
        endsAt: event.eventEndsAt.toISOString(),
        eventCode: event.eventCode,
        eventKey: event.eventKey,
        isSyncEnabled: policy.isSyncEnabled,
        name: event.name,
        scheduleOwner: policy.scheduleOwner,
        season: event.season,
        startsAt: event.eventStartsAt.toISOString(),
        syncReviewMode: "AUTO_ACCEPT" as const,
        timezone: event.timezone ?? undefined,
        venue: event.venue ?? event.location ?? undefined,
      },
      seasonDefinition: {
        definitionVersion: SYNC_DEFINITION_VERSION,
        diffLabels: {},
        gameCode: "nrc-2025",
        gameName: "NRC 2025",
        generatedAt,
        matchResultDetailsVersion: SYNC_DEFINITION_VERSION,
        publicViews: {},
        rankingDetailsVersion: SYNC_DEFINITION_VERSION,
        schemaVersion: SYNC_SCHEMA_VERSION,
        season: SUPPORTED_SYNC_SEASON,
      },
      syncPolicy: {
        allowedPullResources: MACHINE_PULL_RESOURCE_TYPES,
        allowedPushResources: policy.allowedPushResources,
        eventKey: event.eventKey,
        reviewMode: "AUTO_ACCEPT" as const,
        scheduleOwner: policy.scheduleOwner,
        updatedAt: policy.updatedAt.toISOString(),
      },
      teamOperationalProfiles: profiles.map(({ profile, team: teamRecord }) => ({
        contactSummary: profile.contactSummary ?? undefined,
        pitLabel: profile.pitLabel ?? undefined,
        specialRequirements: profile.specialRequirements ?? undefined,
        teamId: teamRecord.id,
        teamName: teamRecord.name,
        teamNumber: teamRecord.teamNumber,
      })),
    },
    schemaVersion: SYNC_SCHEMA_VERSION,
  };
};

const parsePayloadResources = (
  payload: PushSyncBatchRequest,
): { stagedItems: StagedResourceItem[]; warnings: SyncBatchWarning[] } => {
  const stagedItems: StagedResourceItem[] = [];
  const warnings: SyncBatchWarning[] = [];
  const recordKeysByType = new Map<MachinePushResourceType, Set<string>>();

  try {
    for (const resource of payload.resources) {
      if (resource.schemaRef) {
        const [, version] = resource.schemaRef.split("@");
        if (version !== payload.definitionVersion) {
          throw new SyncApiError(
            400,
            "SCHEMA_REF_VERSION_MISMATCH",
            "Resource schemaRef version mismatch.",
          );
        }
      }

      if (
        (resource.resourceType.endsWith("_schedule") ||
          resource.resourceType === "team_rankings" ||
          resource.resourceType === "team_awards") &&
        resource.mode !== "replace_snapshot"
      ) {
        throw new SyncApiError(
          400,
          "INVALID_RESOURCE_MODE",
          "Resource requires replace_snapshot mode.",
        );
      }

      if (
        (resource.resourceType === "inspection_results" ||
          resource.resourceType === "match_results") &&
        resource.mode !== "upsert"
      ) {
        throw new SyncApiError(400, "INVALID_RESOURCE_MODE", "Resource requires upsert mode.");
      }

      const parsed = parsePushResourceRecords(resource);
      const resourceKeys = recordKeysByType.get(resource.resourceType) ?? new Set<string>();

      for (const item of parsed.stagedItems) {
        if (resourceKeys.has(item.recordKey)) {
          throw new DuplicateSyncRecordKeyError(item.resourceType, item.recordKey);
        }
        resourceKeys.add(item.recordKey);
      }

      recordKeysByType.set(resource.resourceType, resourceKeys);
      stagedItems.push(...parsed.stagedItems);
      warnings.push(...parsed.warnings);
    }
  } catch (error) {
    if (error instanceof SyncApiError) {
      throw error;
    }
    if (error instanceof DuplicateSyncRecordKeyError) {
      throw new SyncApiError(400, "DUPLICATE_RECORD_KEY", error.message);
    }
    if (error instanceof v.ValiError) {
      throw new SyncApiError(400, "VALIDATION_ERROR", "Invalid sync resource payload.");
    }
    throw error;
  }

  return { stagedItems, warnings };
};

const publishItems = async (
  tx: Tx,
  changeSetId: string,
  eventKey: string,
  items: StagedResourceItem[],
) => {
  for (const resourceType of new Set(items.map((item) => item.resourceType))) {
    const resourceItems = items.filter((item) => item.resourceType === resourceType);
    const snapshot = resourceItems.some((item) => item.operation === "replace_snapshot");

    if (resourceType === "inspection_schedule" || resourceType === "inspection_results") {
      const isSchedule = resourceType === "inspection_schedule";
      for (const item of resourceItems) {
        const payload = item.payload;
        await tx
          .insert(publishedInspection)
          .values({
            eventKey,
            id: crypto.randomUUID(),
            inspectionType: String(payload.stage),
            payload,
            scheduleAt: payload.startsAt ? new Date(String(payload.startsAt)) : null,
            sourceChangeSetId: changeSetId,
            status: String(payload.status),
            teamNumber: String(payload.teamNumber),
          })
          .onConflictDoUpdate({
            target: [
              publishedInspection.eventKey,
              publishedInspection.teamNumber,
              publishedInspection.inspectionType,
            ],
            targetWhere: isNull(publishedInspection.deletedAt),
            set: isSchedule
              ? {
                  deletedAt: null,
                  scheduleAt: payload.startsAt ? new Date(String(payload.startsAt)) : null,
                  sourceChangeSetId: changeSetId,
                  updatedAt: new Date(),
                }
              : {
                  deletedAt: null,
                  payload,
                  sourceChangeSetId: changeSetId,
                  status: String(payload.status),
                  updatedAt: new Date(),
                },
          });
      }
      if (snapshot) {
        await tx
          .update(publishedInspection)
          .set({ deletedAt: new Date(), sourceChangeSetId: changeSetId })
          .where(
            and(
              eq(publishedInspection.eventKey, eventKey),
              isNull(publishedInspection.deletedAt),
              notInArray(
                publishedInspection.teamNumber,
                resourceItems.map((item) => String(item.payload.teamNumber)),
              ),
            ),
          );
      }
    }

    if (resourceType === "match_schedule" || resourceType === "match_results") {
      const isSchedule = resourceType === "match_schedule";
      for (const item of resourceItems) {
        const payload = item.payload;
        const red = Array.isArray(payload.alliances)
          ? (payload.alliances as { color: string; teamNumbers: string[] }[]).find(
              (a) => a.color === "RED",
            )
          : undefined;
        const blue = Array.isArray(payload.alliances)
          ? (payload.alliances as { color: string; teamNumbers: string[] }[]).find(
              (a) => a.color === "BLUE",
            )
          : undefined;
        await tx
          .insert(publishedMatch)
          .values({
            blueAlliance: blue?.teamNumbers,
            blueScore: typeof payload.blueScore === "number" ? payload.blueScore : null,
            details: payload.details as Record<string, unknown> | undefined,
            eventKey,
            id: crypto.randomUUID(),
            matchKey: String(payload.matchKey),
            phase: payload.phase as "PRACTICE" | "QUALIFICATION" | "PLAYOFF",
            playedAt: payload.playedAt ? new Date(String(payload.playedAt)) : null,
            redAlliance: red?.teamNumbers,
            redScore: typeof payload.redScore === "number" ? payload.redScore : null,
            resultStatus: String(payload.status),
            scheduledStartAt: payload.scheduledAt ? new Date(String(payload.scheduledAt)) : null,
            sourceChangeSetId: changeSetId,
          })
          .onConflictDoUpdate({
            target: [publishedMatch.eventKey, publishedMatch.matchKey],
            targetWhere: isNull(publishedMatch.deletedAt),
            set: isSchedule
              ? {
                  blueAlliance: blue?.teamNumbers,
                  deletedAt: null,
                  phase: payload.phase as "PRACTICE" | "QUALIFICATION" | "PLAYOFF",
                  redAlliance: red?.teamNumbers,
                  scheduledStartAt: payload.scheduledAt
                    ? new Date(String(payload.scheduledAt))
                    : null,
                  sourceChangeSetId: changeSetId,
                  updatedAt: new Date(),
                }
              : {
                  blueScore: typeof payload.blueScore === "number" ? payload.blueScore : null,
                  deletedAt: null,
                  details: payload.details as Record<string, unknown> | undefined,
                  playedAt: payload.playedAt ? new Date(String(payload.playedAt)) : null,
                  redScore: typeof payload.redScore === "number" ? payload.redScore : null,
                  resultStatus: String(payload.status),
                  sourceChangeSetId: changeSetId,
                  updatedAt: new Date(),
                },
          });
      }
      if (snapshot) {
        await tx
          .update(publishedMatch)
          .set({ deletedAt: new Date(), sourceChangeSetId: changeSetId })
          .where(
            and(
              eq(publishedMatch.eventKey, eventKey),
              isNull(publishedMatch.deletedAt),
              notInArray(
                publishedMatch.matchKey,
                resourceItems.map((item) => String(item.payload.matchKey)),
              ),
            ),
          );
      }
    }

    if (resourceType === "team_rankings") {
      for (const item of resourceItems) {
        const payload = item.payload;
        await tx
          .insert(publishedRanking)
          .values({
            details: payload.details as Record<string, unknown> | undefined,
            eventKey,
            id: crypto.randomUUID(),
            losses: Number(payload.losses),
            matchesPlayed: Number(payload.matchesPlayed),
            rank: Number(payload.rank),
            sourceChangeSetId: changeSetId,
            summary: payload,
            teamNumber: String(payload.teamNumber),
            ties: Number(payload.ties),
            wins: Number(payload.wins),
          })
          .onConflictDoUpdate({
            target: [publishedRanking.eventKey, publishedRanking.teamNumber],
            targetWhere: isNull(publishedRanking.deletedAt),
            set: {
              deletedAt: null,
              details: payload.details as Record<string, unknown> | undefined,
              losses: Number(payload.losses),
              matchesPlayed: Number(payload.matchesPlayed),
              rank: Number(payload.rank),
              sourceChangeSetId: changeSetId,
              summary: payload,
              ties: Number(payload.ties),
              updatedAt: new Date(),
              wins: Number(payload.wins),
            },
          });
      }
      if (snapshot) {
        await tx
          .update(publishedRanking)
          .set({ deletedAt: new Date(), sourceChangeSetId: changeSetId })
          .where(
            and(
              eq(publishedRanking.eventKey, eventKey),
              isNull(publishedRanking.deletedAt),
              notInArray(
                publishedRanking.teamNumber,
                resourceItems.map((item) => String(item.payload.teamNumber)),
              ),
            ),
          );
      }
    }

    if (resourceType === "team_awards") {
      for (const item of resourceItems) {
        const payload = item.payload;
        await tx
          .insert(publishedAward)
          .values({
            awardKey: String(payload.awardKey),
            awardName: String(payload.awardName),
            comment: typeof payload.comment === "string" ? payload.comment : null,
            eventKey,
            id: crypto.randomUUID(),
            payload,
            recipientName: typeof payload.recipientName === "string" ? payload.recipientName : null,
            sourceChangeSetId: changeSetId,
            teamNumber: typeof payload.teamNumber === "string" ? payload.teamNumber : null,
          })
          .onConflictDoUpdate({
            target: [publishedAward.eventKey, publishedAward.awardKey],
            targetWhere: isNull(publishedAward.deletedAt),
            set: {
              awardName: String(payload.awardName),
              comment: typeof payload.comment === "string" ? payload.comment : null,
              deletedAt: null,
              payload,
              recipientName:
                typeof payload.recipientName === "string" ? payload.recipientName : null,
              sourceChangeSetId: changeSetId,
              teamNumber: typeof payload.teamNumber === "string" ? payload.teamNumber : null,
              updatedAt: new Date(),
            },
          });
      }
      if (snapshot) {
        await tx
          .update(publishedAward)
          .set({ deletedAt: new Date(), sourceChangeSetId: changeSetId })
          .where(
            and(
              eq(publishedAward.eventKey, eventKey),
              isNull(publishedAward.deletedAt),
              notInArray(
                publishedAward.awardKey,
                resourceItems.map((item) => String(item.payload.awardKey)),
              ),
            ),
          );
      }
    }
  }

  await tx
    .update(syncStagedItem)
    .set({ processedAt: new Date() })
    .where(eq(syncStagedItem.changeSetId, changeSetId));
};

export const pushSyncBatch = async (
  client: SyncClientRecord,
  payload: PushSyncBatchRequest,
): Promise<PushSyncBatchResult> => {
  const event = await ensureEvent(client.eventKey);
  const policy = await db.transaction((tx) => getOrCreatePolicy(tx, event.eventKey));
  if (!policy.isSyncEnabled) {
    throw new SyncApiError(403, "SYNC_DISABLED", "Sync is disabled for this event.");
  }

  const disallowed = payload.resources.find(
    (resource) => !policy.allowedPushResources.includes(resource.resourceType),
  );
  if (disallowed) {
    throw new SyncApiError(403, "RESOURCE_NOT_ALLOWED", "Resource type is not allowed.");
  }

  const payloadHash = await hashCanonicalPayload(payload);
  const [existing] = await db
    .select()
    .from(syncPushBatch)
    .where(
      and(
        eq(syncPushBatch.syncClientId, client.id),
        eq(syncPushBatch.batchId, payload.batchId),
        isNull(syncPushBatch.deletedAt),
      ),
    )
    .limit(1);

  if (existing) {
    if (existing.payloadHash === payloadHash) {
      return {
        pushBatchId: existing.id,
        status: "duplicate" as const,
        warnings:
          existing.warnings?.map((warning) => normalizeBatchWarning(warning as SyncBatchWarning)) ??
          [],
      };
    }
    throw new SyncApiError(
      409,
      "BATCH_HASH_MISMATCH",
      "Batch id was reused with different payload.",
    );
  }

  const { stagedItems, warnings } = parsePayloadResources(payload);
  const status = "applied";
  const batchId = crypto.randomUUID();
  const changeSetId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(syncPushBatch).values({
      batchId: payload.batchId,
      definitionVersion: payload.definitionVersion,
      eventKey: event.eventKey,
      id: batchId,
      payloadHash,
      rawPayload: payload as unknown as Record<string, unknown>,
      reviewReason: warnings.length > 0 ? "Guardrail warnings were recorded." : null,
      schemaVersion: payload.schemaVersion,
      source: payload.source,
      status,
      syncClientId: client.id,
      warnings,
    });

    await tx.insert(syncPushResource).values(
      payload.resources.map((resource) => ({
        id: crypto.randomUUID(),
        mode: resource.mode,
        pushBatchId: batchId,
        recordCount: resource.records.length,
        resourceType: resource.resourceType,
        schemaRef: resource.schemaRef,
      })),
    );

    await tx.insert(syncChangeSet).values({
      eventKey: event.eventKey,
      id: changeSetId,
      publishedAt: new Date(),
      pushBatchId: batchId,
      status,
      summary: {
        addedCount: stagedItems.length,
        modifiedCount: 0,
        removedCount: 0,
        resourceTypes: [...new Set(stagedItems.map((item) => item.resourceType))],
      },
    });

    await tx.insert(syncStagedItem).values(
      stagedItems.map((item) => ({
        changeSetId,
        eventKey: event.eventKey,
        id: crypto.randomUUID(),
        operation: item.operation,
        payload: item.payload,
        processedAt: new Date(),
        recordKey: item.recordKey,
        resourceType: item.resourceType,
      })),
    );

    await publishItems(tx, changeSetId, event.eventKey, stagedItems);

    await tx.insert(syncAuditLog).values({
      action: "BATCH_APPLIED",
      actorType: "machine",
      eventKey: event.eventKey,
      id: crypto.randomUUID(),
      metadata: { batchId: payload.batchId, warnings },
      pushBatchId: batchId,
      syncClientId: client.id,
    });
  });

  return { changeSetId, pushBatchId: batchId, status, warnings };
};

export const listSyncClients = async (
  season: string,
  eventCode: string,
): Promise<SyncClientAdminDto[]> => {
  const eventKey = eventKeyFor(season, eventCode);
  await ensureEvent(eventKey);
  const clients = await db
    .select()
    .from(syncClient)
    .where(and(eq(syncClient.eventKey, eventKey), isNull(syncClient.deletedAt)))
    .orderBy(desc(syncClient.createdAt));
  const secrets =
    clients.length > 0
      ? await db
          .select()
          .from(syncClientSecret)
          .where(
            and(
              inArray(
                syncClientSecret.syncClientId,
                clients.map((client) => client.id),
              ),
              isNull(syncClientSecret.deletedAt),
            ),
          )
          .orderBy(desc(syncClientSecret.createdAt))
      : [];
  const secretByClientId = new Map<string, SyncClientSecretRecord>();

  for (const secret of secrets) {
    if (!secretByClientId.has(secret.syncClientId)) {
      secretByClientId.set(secret.syncClientId, secret);
    }
  }

  return Promise.all(
    clients.map((client) => toSyncClientAdminDto(client, secretByClientId.get(client.id) ?? null)),
  );
};

export const createSyncClient = async (
  season: string,
  eventCode: string,
  input: CreateSyncClientRequest,
  actorId: string,
) => {
  const eventKey = eventKeyFor(season, eventCode);
  await ensureEvent(eventKey);
  const secret = generateMachineSecret();
  const encryptedSecret = await encryptMachineSecret(secret);
  const now = new Date();
  const clientId = crypto.randomUUID();
  const secretId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    const replacedClients = await tx
      .select({ id: syncClient.id })
      .from(syncClient)
      .where(
        and(
          eq(syncClient.eventKey, eventKey),
          eq(syncClient.isActive, true),
          isNull(syncClient.deletedAt),
        ),
      );

    await tx
      .update(syncClient)
      .set({
        isActive: false,
        isRevoked: true,
        revokedAt: now,
        revokedReason: "Replaced by new sync client.",
      })
      .where(
        and(
          eq(syncClient.eventKey, eventKey),
          eq(syncClient.isActive, true),
          isNull(syncClient.deletedAt),
        ),
      );

    if (replacedClients.length > 0) {
      await tx
        .update(syncClientSecret)
        .set({ isActive: false, revokedAt: now })
        .where(
          inArray(
            syncClientSecret.syncClientId,
            replacedClients.map((client) => client.id),
          ),
        );
    }

    await tx.insert(syncClient).values({
      eventKey,
      expiresAt: toDateOrNull(input.expiresAt),
      id: clientId,
      name: input.name,
    });

    await tx.insert(syncClientSecret).values({
      expiresAt: toDateOrNull(input.expiresAt),
      id: secretId,
      machineSecretCiphertext: encryptedSecret.machineSecretCiphertext,
      machineSecretIv: encryptedSecret.machineSecretIv,
      secretHash: await hashMachineSecret(secret),
      syncClientId: clientId,
      tokenPrefix: getMachineSecretPrefix(secret),
    });

    await tx.insert(syncAuditLog).values({
      action: "CLIENT_CREATED",
      actorId,
      actorType: "human",
      eventKey,
      id: crypto.randomUUID(),
      syncClientId: clientId,
    });
  });

  return { clientId, machineSecret: secret };
};

export const revokeSyncClient = async (
  clientId: string,
  reason: string | null | undefined,
  actorId: string,
) => {
  const [client] = await db
    .select()
    .from(syncClient)
    .where(and(eq(syncClient.id, clientId), isNull(syncClient.deletedAt)))
    .limit(1);
  if (!client) {
    throw new SyncApiError(404, "NOT_FOUND", "Client not found.");
  }
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(syncClient)
      .set({ isActive: false, isRevoked: true, revokedAt: now, revokedReason: reason ?? null })
      .where(eq(syncClient.id, clientId));
    await tx
      .update(syncClientSecret)
      .set({ isActive: false, revokedAt: now })
      .where(eq(syncClientSecret.syncClientId, clientId));
    await tx.insert(syncAuditLog).values({
      action: "CLIENT_REVOKED",
      actorId,
      actorType: "human",
      eventKey: client.eventKey,
      id: crypto.randomUUID(),
      syncClientId: clientId,
    });
  });

  return { clientId, revokedAt: now.toISOString() };
};

export const getSyncPolicy = async (season: string, eventCode: string) => {
  const eventKey = eventKeyFor(season, eventCode);
  await ensureEvent(eventKey);
  return db.transaction((tx) => getOrCreatePolicy(tx, eventKey));
};

export const updateSyncPolicy = async (
  season: string,
  eventCode: string,
  input: UpdateSyncPolicyRequest,
  actorId: string,
) => {
  const eventKey = eventKeyFor(season, eventCode);
  await ensureEvent(eventKey);
  const current = await db.transaction((tx) => getOrCreatePolicy(tx, eventKey));
  const [updated] = await db
    .update(syncEventPolicy)
    .set({
      allowedPushResources: input.allowedPushResources ?? current.allowedPushResources,
      isSyncEnabled: input.isSyncEnabled ?? current.isSyncEnabled,
      reviewMode: "AUTO_ACCEPT",
      scheduleOwner: input.scheduleOwner ?? current.scheduleOwner,
    })
    .where(eq(syncEventPolicy.id, current.id))
    .returning();

  await db.insert(syncAuditLog).values({
    action: "POLICY_UPDATED",
    actorId,
    actorType: "human",
    eventKey,
    id: crypto.randomUUID(),
  });

  return updated;
};

export const listBatches = async (
  season: string,
  eventCode: string,
): Promise<SyncBatchListItem[]> => {
  const eventKey = eventKeyFor(season, eventCode);
  await ensureEvent(eventKey);
  const batches = await db
    .select()
    .from(syncPushBatch)
    .where(and(eq(syncPushBatch.eventKey, eventKey), isNull(syncPushBatch.deletedAt)))
    .orderBy(desc(syncPushBatch.receivedAt));

  return batches.map(normalizeBatchListItem);
};

export const getBatchDetail = async (pushBatchId: string): Promise<SyncBatchDetail> => {
  const [batch] = await db
    .select()
    .from(syncPushBatch)
    .where(and(eq(syncPushBatch.id, pushBatchId), isNull(syncPushBatch.deletedAt)))
    .limit(1);
  if (!batch) {
    throw new SyncApiError(404, "NOT_FOUND", "Batch not found.");
  }
  const resources = await db
    .select()
    .from(syncPushResource)
    .where(and(eq(syncPushResource.pushBatchId, pushBatchId), isNull(syncPushResource.deletedAt)));
  const [changeSet] = await db
    .select()
    .from(syncChangeSet)
    .where(and(eq(syncChangeSet.pushBatchId, pushBatchId), isNull(syncChangeSet.deletedAt)))
    .limit(1);
  const stagedItems = changeSet
    ? await db
        .select()
        .from(syncStagedItem)
        .where(and(eq(syncStagedItem.changeSetId, changeSet.id), isNull(syncStagedItem.deletedAt)))
    : [];

  return {
    batch: normalizeBatchListItem(batch),
    changeSet: changeSet ? normalizeChangeSetDetail(changeSet) : null,
    resources,
    stagedItems,
  };
};

export const reviewChangeSet = async (
  changeSetId: string,
  input: ReviewChangeSetRequest,
  reviewerId: string,
) => {
  const [changeSet] = await db
    .select()
    .from(syncChangeSet)
    .where(and(eq(syncChangeSet.id, changeSetId), isNull(syncChangeSet.deletedAt)))
    .limit(1);
  if (!changeSet) {
    throw new SyncApiError(404, "NOT_FOUND", "Change set not found.");
  }
  if (changeSet.status !== "pending_review") {
    throw new SyncApiError(
      409,
      "CHANGE_SET_ALREADY_REVIEWED",
      "Change set cannot be reviewed again.",
    );
  }

  const stagedItems = await db
    .select()
    .from(syncStagedItem)
    .where(and(eq(syncStagedItem.changeSetId, changeSetId), isNull(syncStagedItem.deletedAt)));

  const approved = input.decision === "APPROVED";
  const status = approved ? "applied" : "rejected";
  const now = new Date();

  await db.transaction(async (tx) => {
    if (approved) {
      await publishItems(
        tx,
        changeSetId,
        changeSet.eventKey,
        stagedItems.map((item) => ({
          operation: item.operation,
          payload: item.payload as Record<string, unknown>,
          recordKey: item.recordKey,
          resourceType: item.resourceType,
        })),
      );
    }

    await tx
      .update(syncChangeSet)
      .set({ publishedAt: approved ? now : null, status })
      .where(eq(syncChangeSet.id, changeSetId));
    await tx
      .update(syncPushBatch)
      .set({ reviewedAt: now, reviewerId, status })
      .where(eq(syncPushBatch.id, changeSet.pushBatchId));
    await tx.insert(syncReviewDecision).values({
      changeSetId,
      decision: input.decision,
      id: crypto.randomUUID(),
      reason: input.reason ?? null,
      reviewerId,
    });
    await tx.insert(syncAuditLog).values({
      action: approved ? "BATCH_APPLIED" : "BATCH_REJECTED",
      actorId: reviewerId,
      actorType: "human",
      eventKey: changeSet.eventKey,
      id: crypto.randomUUID(),
      metadata: { decision: input.decision, reason: input.reason ?? null },
      pushBatchId: changeSet.pushBatchId,
    });
  });

  return { changeSetId, status };
};
