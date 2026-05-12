/**
 * Sync integration tests.
 *
 * Tests: machine client lifecycle, authentication, bootstrap, push batch processing,
 * policy management, change set review.
 *
 * Run:
 *   cd /home/thanhkt/code/steam/nrc-full
 *   DATABASE_URL='postgresql://...' bun x vitest run packages/api/src/features/sync/application/sync.integration.test.ts
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  db,
  eventTable,
  seasonTable,
  syncAuditLog,
  syncChangeSet,
  syncClient,
  syncClientSecret,
  syncEventPolicy,
  syncPushBatch,
  syncPushResource,
  syncReviewDecision,
  syncStagedItem,
} from "@nrc-full/db";
import { eq } from "drizzle-orm";

import {
  authenticateMachineClient,
  createSyncClient,
  getBatchDetail,
  getBootstrap,
  getSyncPolicy,
  listBatches,
  listSyncClients,
  pushSyncBatch,
  revokeSyncClient,
  updateSyncPolicy,
  SyncApiError,
} from "./sync.js";

import { SYNC_DEFINITION_VERSION, SYNC_SCHEMA_VERSION } from "../domain/constants.js";

const SEASON = "2026";
const EVENT_CODE = "SYNCINT";
const EVENT_KEY = `${SEASON}/${EVENT_CODE}`;
const EVENT_ID = "int-sync-event";

const cleanSync = async () => {
  // Order matters for FK constraints
  await db.delete(syncReviewDecision).where(eq(syncReviewDecision.id, "int-sync-review"));
  await db.delete(syncAuditLog).where(eq(syncAuditLog.eventKey, EVENT_KEY));
  await db.delete(syncStagedItem).where(eq(syncStagedItem.eventKey, EVENT_KEY));
  await db.delete(syncChangeSet).where(eq(syncChangeSet.eventKey, EVENT_KEY));
  await db.delete(syncPushResource).where(eq(syncPushResource.pushBatchId, "int-sync-batch-id"));
  await db.delete(syncPushBatch).where(eq(syncPushBatch.eventKey, EVENT_KEY));
  await db.delete(syncEventPolicy).where(eq(syncEventPolicy.eventKey, EVENT_KEY));
  // Delete client secrets first (FK to client)
  const clients = await db.select({ id: syncClient.id }).from(syncClient).where(eq(syncClient.eventKey, EVENT_KEY));
  for (const c of clients) {
    await db.delete(syncClientSecret).where(eq(syncClientSecret.syncClientId, c.id));
  }
  await db.delete(syncClient).where(eq(syncClient.eventKey, EVENT_KEY));
  await db.delete(eventTable).where(eq(eventTable.id, EVENT_ID));
  await db.delete(seasonTable).where(eq(seasonTable.year, SEASON));
};

const setupFixtures = async () => {
  const now = new Date();

  await db.insert(seasonTable).values({
    createdAt: now,
    gameCode: `SYNC-${SEASON}`,
    id: crypto.randomUUID(),
    isActive: true,
    theme: "Sync Test Season",
    updatedAt: now,
    year: SEASON,
  });

  await db.insert(eventTable).values({
    createdAt: now,
    eventCode: EVENT_CODE,
    eventEndsAt: new Date("2026-07-12"),
    eventKey: EVENT_KEY,
    eventStartsAt: new Date("2026-07-10"),
    id: EVENT_ID,
    name: "Sync Integration Championship",
    season: SEASON,
    status: "active",
    updatedAt: now,
  });
};

describe("sync integration", () => {
  beforeAll(async () => {
    await cleanSync();
    await setupFixtures();
  });

  beforeEach(async () => {
    // Clean sync data between tests but keep event/season
    await db.delete(syncAuditLog).where(eq(syncAuditLog.eventKey, EVENT_KEY));
    const clients = await db.select({ id: syncClient.id }).from(syncClient).where(eq(syncClient.eventKey, EVENT_KEY));
    await db.delete(syncStagedItem).where(eq(syncStagedItem.eventKey, EVENT_KEY));
    await db.delete(syncReviewDecision).where(eq(syncReviewDecision.changeSetId, "int-sync-cs"));
    await db.delete(syncChangeSet).where(eq(syncChangeSet.eventKey, EVENT_KEY));
    await db.delete(syncPushResource);
    await db.delete(syncPushBatch).where(eq(syncPushBatch.eventKey, EVENT_KEY));
    await db.delete(syncEventPolicy).where(eq(syncEventPolicy.eventKey, EVENT_KEY));
    for (const c of clients) {
      await db.delete(syncClientSecret).where(eq(syncClientSecret.syncClientId, c.id));
    }
    await db.delete(syncClient).where(eq(syncClient.eventKey, EVENT_KEY));
  });

  afterAll(async () => {
    await cleanSync();
  });

  // ── Client Lifecycle ────────────────────────────────────────────

  it("creates a sync client and returns machine secret", async () => {
    const result = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Test Machine",
    }, "admin-user");

    expect(result.clientId).toBeDefined();
    expect(result.machineSecret).toMatch(/^nrc_[0-9a-f]{64}$/);
  });

  it("authenticates machine client with valid bearer token", async () => {
    const { machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Auth Test Machine",
    }, "admin-user");

    const client = await authenticateMachineClient(`Bearer ${machineSecret}`);
    expect(client.name).toBe("Auth Test Machine");
    expect(client.eventKey).toBe(EVENT_KEY);
    expect(client.isActive).toBe(true);
    expect(client.isRevoked).toBe(false);
  });

  it("rejects authentication with invalid token", async () => {
    await createSyncClient(SEASON, EVENT_CODE, {
      name: "Invalid Token Test",
    }, "admin-user");

    await expect(
      authenticateMachineClient("Bearer nrc_000000000000000000000000000000000000000000000000000000000000000000"),
    ).rejects.toThrow("Invalid bearer token");
  });

  it("rejects authentication without bearer prefix", async () => {
    await expect(authenticateMachineClient("not-a-bearer-token")).rejects.toThrow(
      "Missing bearer token",
    );
  });

  it("rejects authentication with null header", async () => {
    await expect(authenticateMachineClient(null)).rejects.toThrow("Missing bearer token");
  });

  it("revokes a sync client and rejects subsequent auth", async () => {
    const { clientId, machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Revoke Test",
    }, "admin-user");

    // Verify auth works
    await authenticateMachineClient(`Bearer ${machineSecret}`);

    // Revoke
    const revoked = await revokeSyncClient(clientId, "Test revocation", "admin-user");
    expect(revoked.clientId).toBe(clientId);

    // Auth should now fail
    await expect(
      authenticateMachineClient(`Bearer ${machineSecret}`),
    ).rejects.toThrow("revoked");
  });

  it("replaces previous active client when creating new one", async () => {
    const first = await createSyncClient(SEASON, EVENT_CODE, {
      name: "First Machine",
    }, "admin-user");

    const second = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Second Machine",
    }, "admin-user");

    // First client should be revoked
    const clients = await listSyncClients(SEASON, EVENT_CODE);
    const firstClient = clients.find((c) => c.id === first.clientId);
    const secondClient = clients.find((c) => c.id === second.clientId);

    expect(firstClient?.isRevoked).toBe(true);
    expect(secondClient?.isActive).toBe(true);
    expect(secondClient?.name).toBe("Second Machine");
  });

  // ── Policy Management ───────────────────────────────────────────

  it("gets sync policy (creates default if not exists)", async () => {
    const policy = await getSyncPolicy(SEASON, EVENT_CODE);
    expect(policy.eventKey).toBe(EVENT_KEY);
    expect(policy.isSyncEnabled).toBe(false);
    expect(policy.reviewMode).toBe("AUTO_ACCEPT");
    expect(policy.scheduleOwner).toBe("WEB");
  });

  it("updates sync policy", async () => {
    // Ensure policy exists first
    await getSyncPolicy(SEASON, EVENT_CODE);

    const updated = await updateSyncPolicy(SEASON, EVENT_CODE, {
      isSyncEnabled: true,
      scheduleOwner: "LOCAL_APP",
    }, "admin-user");

    expect(updated.isSyncEnabled).toBe(true);
    expect(updated.scheduleOwner).toBe("LOCAL_APP");

    // Verify persistence
    const policy = await getSyncPolicy(SEASON, EVENT_CODE);
    expect(policy.isSyncEnabled).toBe(true);
    expect(policy.scheduleOwner).toBe("LOCAL_APP");
  });

  // ── Bootstrap ───────────────────────────────────────────────────

  it("returns bootstrap data for authenticated client", async () => {
    // Enable sync first
    await getSyncPolicy(SEASON, EVENT_CODE);
    await updateSyncPolicy(SEASON, EVENT_CODE, { isSyncEnabled: true }, "admin-user");

    const { machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Bootstrap Test",
    }, "admin-user");

    const client = await authenticateMachineClient(`Bearer ${machineSecret}`);
    const bootstrap = await getBootstrap(client);

    expect(bootstrap.schemaVersion).toBe(SYNC_SCHEMA_VERSION);
    expect(bootstrap.resources.eventManifest.eventKey).toBe(EVENT_KEY);
    expect(bootstrap.resources.eventManifest.eventCode).toBe(EVENT_CODE);
    expect(bootstrap.resources.eventManifest.season).toBe(SEASON);
    expect(bootstrap.resources.syncPolicy.eventKey).toBe(EVENT_KEY);
    expect(bootstrap.resources.seasonDefinition.season).toBe(SEASON);
  });

  // ── Push Batch ──────────────────────────────────────────────────

  it("pushes a sync batch with team rankings", async () => {
    // Enable sync
    await getSyncPolicy(SEASON, EVENT_CODE);
    await updateSyncPolicy(SEASON, EVENT_CODE, { isSyncEnabled: true }, "admin-user");

    const { machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Push Test",
    }, "admin-user");

    const client = await authenticateMachineClient(`Bearer ${machineSecret}`);

    const result = await pushSyncBatch(client, {
      batchId: "batch-001",
      definitionVersion: SYNC_DEFINITION_VERSION,
      producedAt: new Date().toISOString(),
      resources: [
        {
          mode: "replace_snapshot",
          records: [
            {
              losses: 2,
              matchesPlayed: 10,
              rank: 1,
              teamNumber: "00001",
              ties: 0,
              wins: 8,
            },
            {
              losses: 3,
              matchesPlayed: 10,
              rank: 2,
              teamNumber: "00002",
              ties: 1,
              wins: 6,
            },
          ],
          resourceType: "team_rankings",
        },
      ],
      schemaVersion: SYNC_SCHEMA_VERSION,
    });

    expect(result.status).toBe("applied");
    expect(result.pushBatchId).toBeDefined();
    expect(result.changeSetId).toBeDefined();
    expect(result.warnings).toEqual([]);
  });

  it("returns duplicate for same batch id with same payload", async () => {
    await getSyncPolicy(SEASON, EVENT_CODE);
    await updateSyncPolicy(SEASON, EVENT_CODE, { isSyncEnabled: true }, "admin-user");

    const { machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Dup Test",
    }, "admin-user");

    const client = await authenticateMachineClient(`Bearer ${machineSecret}`);

    const payload = {
      batchId: "batch-dup",
      definitionVersion: SYNC_DEFINITION_VERSION,
      producedAt: new Date().toISOString(),
      resources: [
        {
          mode: "replace_snapshot" as const,
          records: [
            { losses: 0, matchesPlayed: 5, rank: 1, teamNumber: "00100", ties: 0, wins: 5 },
          ],
          resourceType: "team_rankings" as const,
        },
      ],
      schemaVersion: SYNC_SCHEMA_VERSION,
    };

    const first = await pushSyncBatch(client, payload);
    expect(first.status).toBe("applied");

    const second = await pushSyncBatch(client, payload);
    expect(second.status).toBe("duplicate");
  });

  it("rejects push when sync is disabled", async () => {
    // Policy defaults to disabled
    await getSyncPolicy(SEASON, EVENT_CODE);

    const { machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Disabled Test",
    }, "admin-user");

    const client = await authenticateMachineClient(`Bearer ${machineSecret}`);

    await expect(
      pushSyncBatch(client, {
        batchId: "batch-disabled",
        definitionVersion: SYNC_DEFINITION_VERSION,
        producedAt: new Date().toISOString(),
        resources: [
          {
            mode: "replace_snapshot",
            records: [
              { losses: 0, matchesPlayed: 1, rank: 1, teamNumber: "00200", ties: 0, wins: 1 },
            ],
            resourceType: "team_rankings",
          },
        ],
        schemaVersion: SYNC_SCHEMA_VERSION,
      }),
    ).rejects.toThrow("Sync is disabled");
  });

  it("rejects push with disallowed resource type", async () => {
    await getSyncPolicy(SEASON, EVENT_CODE);
    // Enable sync but restrict allowed resources
    await updateSyncPolicy(SEASON, EVENT_CODE, {
      allowedPushResources: ["match_results"],
      isSyncEnabled: true,
    }, "admin-user");

    const { machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Disallowed Test",
    }, "admin-user");

    const client = await authenticateMachineClient(`Bearer ${machineSecret}`);

    await expect(
      pushSyncBatch(client, {
        batchId: "batch-disallowed",
        definitionVersion: SYNC_DEFINITION_VERSION,
        producedAt: new Date().toISOString(),
        resources: [
          {
            mode: "replace_snapshot",
            records: [
              { losses: 0, matchesPlayed: 1, rank: 1, teamNumber: "00300", ties: 0, wins: 1 },
            ],
            resourceType: "team_rankings",
          },
        ],
        schemaVersion: SYNC_SCHEMA_VERSION,
      }),
    ).rejects.toThrow("not allowed");
  });

  // ── Batch Listing and Detail ────────────────────────────────────

  it("lists batches and gets batch detail", async () => {
    await getSyncPolicy(SEASON, EVENT_CODE);
    await updateSyncPolicy(SEASON, EVENT_CODE, { isSyncEnabled: true }, "admin-user");

    const { machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Batch Detail Test",
    }, "admin-user");

    const client = await authenticateMachineClient(`Bearer ${machineSecret}`);

    await pushSyncBatch(client, {
      batchId: "batch-detail",
      definitionVersion: SYNC_DEFINITION_VERSION,
      producedAt: new Date().toISOString(),
      resources: [
        {
          mode: "replace_snapshot",
          records: [
            { losses: 1, matchesPlayed: 8, rank: 3, teamNumber: "00400", ties: 0, wins: 7 },
          ],
          resourceType: "team_rankings",
        },
      ],
      schemaVersion: SYNC_SCHEMA_VERSION,
    });

    const batches = await listBatches(SEASON, EVENT_CODE);
    expect(batches.length).toBeGreaterThanOrEqual(1);

    const batch = batches.find((b) => b.batchId === "batch-detail");
    expect(batch).toBeDefined();

    const detail = await getBatchDetail(batch!.id);
    expect(detail.batch.batchId).toBe("batch-detail");
    expect(detail.resources).toHaveLength(1);
    expect(detail.changeSet).not.toBeNull();
    expect(detail.stagedItems.length).toBeGreaterThanOrEqual(1);
  });

  // ── Match Results Push ──────────────────────────────────────────

  it("pushes match results with upsert mode", async () => {
    await getSyncPolicy(SEASON, EVENT_CODE);
    await updateSyncPolicy(SEASON, EVENT_CODE, { isSyncEnabled: true }, "admin-user");

    const { machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Match Results Test",
    }, "admin-user");

    const client = await authenticateMachineClient(`Bearer ${machineSecret}`);

    const result = await pushSyncBatch(client, {
      batchId: "batch-match-results",
      definitionVersion: SYNC_DEFINITION_VERSION,
      producedAt: new Date().toISOString(),
      resources: [
        {
          mode: "upsert",
          records: [
            {
              alliances: [
                { color: "RED", teamNumbers: ["00001", "00002"] },
                { color: "BLUE", teamNumbers: ["00003", "00004"] },
              ],
              blueScore: 45,
              matchKey: "Q1",
              phase: "QUALIFICATION",
              redScore: 52,
              status: "completed",
            },
          ],
          resourceType: "match_results",
        },
      ],
      schemaVersion: SYNC_SCHEMA_VERSION,
    });

    expect(result.status).toBe("applied");
  });

  // ── Inspection Schedule Push ────────────────────────────────────

  it("pushes inspection schedule with replace_snapshot mode", async () => {
    await getSyncPolicy(SEASON, EVENT_CODE);
    await updateSyncPolicy(SEASON, EVENT_CODE, { isSyncEnabled: true }, "admin-user");

    const { machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Inspection Test",
    }, "admin-user");

    const client = await authenticateMachineClient(`Bearer ${machineSecret}`);

    const result = await pushSyncBatch(client, {
      batchId: "batch-inspection",
      definitionVersion: SYNC_DEFINITION_VERSION,
      producedAt: new Date().toISOString(),
      resources: [
        {
          mode: "replace_snapshot",
          records: [
            {
              stage: "Pit Inspection",
              startsAt: "2026-07-10T08:00:00.000Z",
              status: "scheduled",
              teamNumber: "00001",
            },
          ],
          resourceType: "inspection_schedule",
        },
      ],
      schemaVersion: SYNC_SCHEMA_VERSION,
    });

    expect(result.status).toBe("applied");
  });

  // ── Team Awards Push ────────────────────────────────────────────

  it("pushes team awards with replace_snapshot mode", async () => {
    await getSyncPolicy(SEASON, EVENT_CODE);
    await updateSyncPolicy(SEASON, EVENT_CODE, { isSyncEnabled: true }, "admin-user");

    const { machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Awards Test",
    }, "admin-user");

    const client = await authenticateMachineClient(`Bearer ${machineSecret}`);

    const result = await pushSyncBatch(client, {
      batchId: "batch-awards",
      definitionVersion: SYNC_DEFINITION_VERSION,
      producedAt: new Date().toISOString(),
      resources: [
        {
          mode: "replace_snapshot",
          records: [
            {
              awardKey: "champion",
              awardName: "Champion Award",
              recipientName: "Team Alpha",
              teamNumber: "00001",
            },
          ],
          resourceType: "team_awards",
        },
      ],
      schemaVersion: SYNC_SCHEMA_VERSION,
    });

    expect(result.status).toBe("applied");
  });

  // ── Audit Log ───────────────────────────────────────────────────

  it("creates audit log entries for client operations", async () => {
    await createSyncClient(SEASON, EVENT_CODE, {
      name: "Audit Test",
    }, "admin-user");

    const auditLogs = await db
      .select()
      .from(syncAuditLog)
      .where(eq(syncAuditLog.eventKey, EVENT_KEY));

    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
    expect(auditLogs.some((log) => log.action === "CLIENT_CREATED")).toBe(true);
  });

  // ── Error Cases ─────────────────────────────────────────────────

  it("throws NOT_FOUND for nonexistent event", async () => {
    await expect(
      createSyncClient("9999", "NOPE", { name: "No Event" }, "admin-user"),
    ).rejects.toThrow();
  });

  it("throws NOT_FOUND when revoking nonexistent client", async () => {
    await expect(
      revokeSyncClient("nonexistent-client", "reason", "admin-user"),
    ).rejects.toThrow("not found");
  });

  it("throws NOT_FOUND when getting batch detail for nonexistent batch", async () => {
    await expect(getBatchDetail("nonexistent-batch")).rejects.toThrow("not found");
  });

  it("rejects batch id reuse with different payload hash", async () => {
    await getSyncPolicy(SEASON, EVENT_CODE);
    await updateSyncPolicy(SEASON, EVENT_CODE, { isSyncEnabled: true }, "admin-user");

    const { machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Hash Mismatch Test",
    }, "admin-user");

    const client = await authenticateMachineClient(`Bearer ${machineSecret}`);

    await pushSyncBatch(client, {
      batchId: "batch-hash-test",
      definitionVersion: SYNC_DEFINITION_VERSION,
      producedAt: new Date().toISOString(),
      resources: [
        {
          mode: "replace_snapshot",
          records: [
            { losses: 0, matchesPlayed: 1, rank: 1, teamNumber: "00500", ties: 0, wins: 1 },
          ],
          resourceType: "team_rankings",
        },
      ],
      schemaVersion: SYNC_SCHEMA_VERSION,
    });

    // Same batchId, different payload
    await expect(
      pushSyncBatch(client, {
        batchId: "batch-hash-test",
        definitionVersion: SYNC_DEFINITION_VERSION,
        producedAt: new Date().toISOString(),
        resources: [
          {
            mode: "replace_snapshot",
            records: [
              { losses: 5, matchesPlayed: 10, rank: 10, teamNumber: "00500", ties: 0, wins: 5 },
            ],
            resourceType: "team_rankings",
          },
        ],
        schemaVersion: SYNC_SCHEMA_VERSION,
      }),
    ).rejects.toThrow("Batch id was reused with different payload");
  });

  it("rejects replace_snapshot mode for match_results", async () => {
    await getSyncPolicy(SEASON, EVENT_CODE);
    await updateSyncPolicy(SEASON, EVENT_CODE, { isSyncEnabled: true }, "admin-user");

    const { machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Invalid Mode Test",
    }, "admin-user");

    const client = await authenticateMachineClient(`Bearer ${machineSecret}`);

    await expect(
      pushSyncBatch(client, {
        batchId: "batch-invalid-mode",
        definitionVersion: SYNC_DEFINITION_VERSION,
        producedAt: new Date().toISOString(),
        resources: [
          {
            mode: "replace_snapshot",
            records: [
              {
                alliances: [
                  { color: "RED", teamNumbers: ["00001"] },
                  { color: "BLUE", teamNumbers: ["00002"] },
                ],
                blueScore: 10,
                matchKey: "Q99",
                phase: "QUALIFICATION",
                redScore: 20,
                status: "completed",
              },
            ],
            resourceType: "match_results",
          },
        ],
        schemaVersion: SYNC_SCHEMA_VERSION,
      }),
    ).rejects.toThrow("upsert");
  });

  it("rejects upsert mode for team_rankings", async () => {
    await getSyncPolicy(SEASON, EVENT_CODE);
    await updateSyncPolicy(SEASON, EVENT_CODE, { isSyncEnabled: true }, "admin-user");

    const { machineSecret } = await createSyncClient(SEASON, EVENT_CODE, {
      name: "Invalid Mode Rankings",
    }, "admin-user");

    const client = await authenticateMachineClient(`Bearer ${machineSecret}`);

    await expect(
      pushSyncBatch(client, {
        batchId: "batch-invalid-rankings",
        definitionVersion: SYNC_DEFINITION_VERSION,
        producedAt: new Date().toISOString(),
        resources: [
          {
            mode: "upsert",
            records: [
              { losses: 0, matchesPlayed: 1, rank: 1, teamNumber: "00600", ties: 0, wins: 1 },
            ],
            resourceType: "team_rankings",
          },
        ],
        schemaVersion: SYNC_SCHEMA_VERSION,
      }),
    ).rejects.toThrow("replace_snapshot");
  });
});
