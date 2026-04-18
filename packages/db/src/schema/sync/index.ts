import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "../auth/index.js";

const machinePushResourceTypes = [
  "inspection_schedule",
  "inspection_results",
  "match_schedule",
  "match_results",
  "team_rankings",
  "team_awards",
] as const;

type MachinePushResourceType = (typeof machinePushResourceTypes)[number];

interface SyncBatchWarning {
  code: string;
  message: string;
  recordKey?: string;
  resourceType?: MachinePushResourceType;
}

interface SyncBatchSource {
  appVersion: string;
  databaseId?: string;
  deviceId?: string;
}

interface SyncChangeSummary {
  addedCount: number;
  modifiedCount: number;
  removedCount: number;
  resourceTypes: MachinePushResourceType[];
}

type PublishedInspectionPayload = Record<string, unknown>;

type PublishedMatchDetails = Record<string, unknown>;

type PublishedRankingDetails = Record<string, unknown>;

type PublishedAwardPayload = Record<string, unknown>;

export const syncReviewModeEnum = pgEnum("sync_review_mode", ["AUTO_ACCEPT", "MANUAL_REVIEW"]);

export const syncBatchStatusEnum = pgEnum("sync_batch_status", [
  "validated",
  "applied",
  "pending_review",
  "duplicate",
  "rejected",
  "failed",
]);

export const machinePushResourceTypeEnum = pgEnum(
  "machine_push_resource_type",
  machinePushResourceTypes,
);

export const syncModeEnum = pgEnum("sync_mode", ["upsert", "replace_snapshot"]);

export const matchPhaseEnum = pgEnum("match_phase", ["PRACTICE", "QUALIFICATION", "PLAYOFF"]);

export const scheduleOwnerEnum = pgEnum("schedule_owner", ["WEB", "LOCAL_APP"]);

export const reviewDecisionEnum = pgEnum("review_decision", ["APPROVED", "REJECTED"]);

export const auditActionEnum = pgEnum("audit_action", [
  "CLIENT_CREATED",
  "CLIENT_REVOKED",
  "BATCH_RECEIVED",
  "BATCH_VALIDATED",
  "BATCH_APPLIED",
  "BATCH_REJECTED",
  "POLICY_UPDATED",
  "DECISION_MADE",
]);

export const auditActorTypeEnum = pgEnum("sync_audit_actor_type", ["human", "machine", "system"]);

export const stagedOperationEnum = pgEnum("sync_staged_operation", [
  "upsert",
  "delete",
  "replace_snapshot",
]);

export const syncClient = pgTable(
  "sync_client",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventKey: text("event_key").notNull(),
    expiresAt: timestamp("expires_at"),
    id: text("id").primaryKey(),
    isActive: boolean("is_active").default(true).notNull(),
    isRevoked: boolean("is_revoked").default(false).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    name: text("name").notNull(),
    revokedAt: timestamp("revoked_at"),
    revokedReason: text("revoked_reason"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sync_client_event_key_idx").on(table.eventKey),
    index("sync_client_is_active_idx").on(table.isActive),
    index("sync_client_is_revoked_idx").on(table.isRevoked),
    index("sync_client_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("sync_client_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("sync_client_event_key_active_unique")
      .on(table.eventKey)
      .where(
        sql`${table.isActive} = true AND ${table.isRevoked} = false AND ${table.deletedAt} IS NULL`,
      ),
  ],
);

export const syncClientSecret = pgTable(
  "sync_client_secret",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at"),
    id: text("id").primaryKey(),
    isActive: boolean("is_active").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    revokedAt: timestamp("revoked_at"),
    secretHash: text("secret_hash").notNull(),
    syncClientId: text("sync_client_id")
      .notNull()
      .references(() => syncClient.id, { onDelete: "cascade" }),
    tokenPrefix: text("token_prefix").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sync_client_secret_sync_client_id_idx").on(table.syncClientId),
    index("sync_client_secret_is_active_idx").on(table.isActive),
    index("sync_client_secret_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("sync_client_secret_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("sync_client_secret_token_prefix_unique")
      .on(table.tokenPrefix)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const syncEventPolicy = pgTable(
  "sync_event_policy",
  {
    allowedPushResources: jsonb("allowed_push_resources")
      .$type<MachinePushResourceType[]>()
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventKey: text("event_key").notNull(),
    id: text("id").primaryKey(),
    isSyncEnabled: boolean("is_sync_enabled").default(false).notNull(),
    reviewMode: syncReviewModeEnum("review_mode").default("AUTO_ACCEPT").notNull(),
    scheduleOwner: scheduleOwnerEnum("schedule_owner").default("WEB").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sync_event_policy_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("sync_event_policy_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("sync_event_policy_event_key_unique")
      .on(table.eventKey)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const syncPushBatch = pgTable(
  "sync_push_batch",
  {
    batchId: text("batch_id").notNull(),
    definitionVersion: text("definition_version").notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventKey: text("event_key").notNull(),
    id: text("id").primaryKey(),
    payloadHash: text("payload_hash").notNull(),
    rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>(),
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    reviewReason: text("review_reason"),
    reviewedAt: timestamp("reviewed_at"),
    reviewerId: text("reviewer_id"),
    schemaVersion: text("schema_version").notNull(),
    source: jsonb("source").$type<SyncBatchSource>(),
    status: syncBatchStatusEnum("status").default("validated").notNull(),
    syncClientId: text("sync_client_id")
      .notNull()
      .references(() => syncClient.id, { onDelete: "cascade" }),
    warnings: jsonb("warnings").$type<SyncBatchWarning[]>(),
  },
  (table) => [
    index("sync_push_batch_sync_client_id_idx").on(table.syncClientId),
    index("sync_push_batch_event_key_idx").on(table.eventKey),
    index("sync_push_batch_status_idx").on(table.status),
    index("sync_push_batch_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("sync_push_batch_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("sync_push_batch_client_batch_unique")
      .on(table.syncClientId, table.batchId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const syncPushResource = pgTable(
  "sync_push_resource",
  {
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    id: text("id").primaryKey(),
    mode: syncModeEnum("mode").notNull(),
    pushBatchId: text("push_batch_id")
      .notNull()
      .references(() => syncPushBatch.id, { onDelete: "cascade" }),
    recordCount: integer("record_count").notNull(),
    resourceType: machinePushResourceTypeEnum("resource_type").notNull(),
    schemaRef: text("schema_ref"),
  },
  (table) => [
    index("sync_push_resource_push_batch_id_idx").on(table.pushBatchId),
    index("sync_push_resource_resource_type_idx").on(table.resourceType),
    index("sync_push_resource_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("sync_push_resource_deleted_at_idx").on(table.deletedAt),
  ],
);

export const syncChangeSet = pgTable(
  "sync_change_set",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventKey: text("event_key").notNull(),
    id: text("id").primaryKey(),
    publishedAt: timestamp("published_at"),
    pushBatchId: text("push_batch_id")
      .notNull()
      .references(() => syncPushBatch.id, { onDelete: "cascade" }),
    status: syncBatchStatusEnum("status").default("pending_review").notNull(),
    summary: jsonb("summary").$type<SyncChangeSummary>(),
  },
  (table) => [
    index("sync_change_set_event_key_idx").on(table.eventKey),
    index("sync_change_set_status_idx").on(table.status),
    index("sync_change_set_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("sync_change_set_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("sync_change_set_push_batch_unique")
      .on(table.pushBatchId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const syncStagedItem = pgTable(
  "sync_staged_item",
  {
    changeSetId: text("change_set_id")
      .notNull()
      .references(() => syncChangeSet.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventKey: text("event_key").notNull(),
    id: text("id").primaryKey(),
    operation: stagedOperationEnum("operation").notNull(),
    payload: jsonb("payload").notNull(),
    processedAt: timestamp("processed_at"),
    recordKey: text("record_key").notNull(),
    resourceType: machinePushResourceTypeEnum("resource_type").notNull(),
  },
  (table) => [
    index("sync_staged_item_change_set_id_idx").on(table.changeSetId),
    index("sync_staged_item_event_key_idx").on(table.eventKey),
    index("sync_staged_item_resource_type_idx").on(table.resourceType),
    index("sync_staged_item_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("sync_staged_item_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("sync_staged_item_change_resource_record_unique")
      .on(table.changeSetId, table.resourceType, table.recordKey)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const syncReviewDecision = pgTable(
  "sync_review_decision",
  {
    changeSetId: text("change_set_id")
      .notNull()
      .references(() => syncChangeSet.id, { onDelete: "cascade" }),
    decision: reviewDecisionEnum("decision").notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    id: text("id").primaryKey(),
    reason: text("reason"),
    reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
    reviewerId: text("reviewer_id").notNull(),
  },
  (table) => [
    index("sync_review_decision_change_set_id_idx").on(table.changeSetId),
    index("sync_review_decision_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("sync_review_decision_deleted_at_idx").on(table.deletedAt),
  ],
);

export const syncAuditLog = pgTable(
  "sync_audit_log",
  {
    action: auditActionEnum("action").notNull(),
    actorId: text("actor_id"),
    actorType: auditActorTypeEnum("actor_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventKey: text("event_key").notNull(),
    id: text("id").primaryKey(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    pushBatchId: text("push_batch_id").references(() => syncPushBatch.id, {
      onDelete: "set null",
    }),
    requestId: text("request_id"),
    syncClientId: text("sync_client_id").references(() => syncClient.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("sync_audit_log_event_key_idx").on(table.eventKey),
    index("sync_audit_log_action_idx").on(table.action),
    index("sync_audit_log_created_at_idx").on(table.createdAt),
    index("sync_audit_log_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("sync_audit_log_deleted_at_idx").on(table.deletedAt),
  ],
);

export const publishedInspection = pgTable(
  "published_inspection",
  {
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventKey: text("event_key").notNull(),
    id: text("id").primaryKey(),
    inspectionType: text("inspection_type").notNull(),
    payload: jsonb("payload").$type<PublishedInspectionPayload>(),
    scheduleAt: timestamp("schedule_at"),
    sourceChangeSetId: text("source_change_set_id").references(() => syncChangeSet.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull(),
    teamNumber: text("team_number").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("published_inspection_event_key_idx").on(table.eventKey),
    index("published_inspection_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("published_inspection_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("published_inspection_event_team_type_unique")
      .on(table.eventKey, table.teamNumber, table.inspectionType)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const publishedMatch = pgTable(
  "published_match",
  {
    blueAlliance: jsonb("blue_alliance").$type<string[]>(),
    blueScore: integer("blue_score"),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    details: jsonb("details").$type<PublishedMatchDetails>(),
    eventKey: text("event_key").notNull(),
    field: text("field"),
    id: text("id").primaryKey(),
    matchKey: text("match_key").notNull(),
    phase: matchPhaseEnum("phase").notNull(),
    playedAt: timestamp("played_at"),
    redAlliance: jsonb("red_alliance").$type<string[]>(),
    redScore: integer("red_score"),
    resultStatus: text("result_status"),
    scheduledStartAt: timestamp("scheduled_start_at"),
    sourceChangeSetId: text("source_change_set_id").references(() => syncChangeSet.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("published_match_event_key_idx").on(table.eventKey),
    index("published_match_phase_idx").on(table.phase),
    index("published_match_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("published_match_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("published_match_event_match_key_unique")
      .on(table.eventKey, table.matchKey)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const publishedRanking = pgTable(
  "published_ranking",
  {
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    details: jsonb("details").$type<PublishedRankingDetails>(),
    eventKey: text("event_key").notNull(),
    id: text("id").primaryKey(),
    losses: integer("losses").default(0).notNull(),
    matchesPlayed: integer("matches_played").default(0).notNull(),
    rank: integer("rank").notNull(),
    sourceChangeSetId: text("source_change_set_id").references(() => syncChangeSet.id, {
      onDelete: "set null",
    }),
    summary: jsonb("summary").$type<Record<string, unknown>>(),
    teamNumber: text("team_number").notNull(),
    ties: integer("ties").default(0).notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    wins: integer("wins").default(0).notNull(),
  },
  (table) => [
    index("published_ranking_event_key_idx").on(table.eventKey),
    index("published_ranking_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("published_ranking_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("published_ranking_event_team_unique")
      .on(table.eventKey, table.teamNumber)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const publishedAward = pgTable(
  "published_award",
  {
    awardKey: text("award_key").notNull(),
    awardName: text("award_name").notNull(),
    comment: text("comment"),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventKey: text("event_key").notNull(),
    id: text("id").primaryKey(),
    payload: jsonb("payload").$type<PublishedAwardPayload>(),
    recipientName: text("recipient_name"),
    sourceChangeSetId: text("source_change_set_id").references(() => syncChangeSet.id, {
      onDelete: "set null",
    }),
    teamNumber: text("team_number"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("published_award_event_key_idx").on(table.eventKey),
    index("published_award_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("published_award_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("published_award_event_award_key_unique")
      .on(table.eventKey, table.awardKey)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const syncClientRelations = relations(syncClient, ({ many, one }) => ({
  auditLogs: many(syncAuditLog),
  batches: many(syncPushBatch),
  deletedByUser: one(user, {
    fields: [syncClient.deletedByUserId],
    references: [user.id],
    relationName: "syncClientDeletedByUser",
  }),
  secrets: many(syncClientSecret),
}));

export const syncClientSecretRelations = relations(syncClientSecret, ({ one }) => ({
  client: one(syncClient, {
    fields: [syncClientSecret.syncClientId],
    references: [syncClient.id],
  }),
  deletedByUser: one(user, {
    fields: [syncClientSecret.deletedByUserId],
    references: [user.id],
    relationName: "syncClientSecretDeletedByUser",
  }),
}));

export const syncPushBatchRelations = relations(syncPushBatch, ({ many, one }) => ({
  auditLogs: many(syncAuditLog),
  changeSet: one(syncChangeSet, {
    fields: [syncPushBatch.id],
    references: [syncChangeSet.pushBatchId],
  }),
  client: one(syncClient, {
    fields: [syncPushBatch.syncClientId],
    references: [syncClient.id],
  }),
  deletedByUser: one(user, {
    fields: [syncPushBatch.deletedByUserId],
    references: [user.id],
    relationName: "syncPushBatchDeletedByUser",
  }),
  resources: many(syncPushResource),
}));

export const syncPushResourceRelations = relations(syncPushResource, ({ one }) => ({
  deletedByUser: one(user, {
    fields: [syncPushResource.deletedByUserId],
    references: [user.id],
    relationName: "syncPushResourceDeletedByUser",
  }),
  pushBatch: one(syncPushBatch, {
    fields: [syncPushResource.pushBatchId],
    references: [syncPushBatch.id],
  }),
}));

export const syncChangeSetRelations = relations(syncChangeSet, ({ many, one }) => ({
  batch: one(syncPushBatch, {
    fields: [syncChangeSet.pushBatchId],
    references: [syncPushBatch.id],
  }),
  deletedByUser: one(user, {
    fields: [syncChangeSet.deletedByUserId],
    references: [user.id],
    relationName: "syncChangeSetDeletedByUser",
  }),
  reviewDecisions: many(syncReviewDecision),
  stagedItems: many(syncStagedItem),
}));

export const syncStagedItemRelations = relations(syncStagedItem, ({ one }) => ({
  changeSet: one(syncChangeSet, {
    fields: [syncStagedItem.changeSetId],
    references: [syncChangeSet.id],
  }),
  deletedByUser: one(user, {
    fields: [syncStagedItem.deletedByUserId],
    references: [user.id],
    relationName: "syncStagedItemDeletedByUser",
  }),
}));

export const syncReviewDecisionRelations = relations(syncReviewDecision, ({ one }) => ({
  changeSet: one(syncChangeSet, {
    fields: [syncReviewDecision.changeSetId],
    references: [syncChangeSet.id],
  }),
  deletedByUser: one(user, {
    fields: [syncReviewDecision.deletedByUserId],
    references: [user.id],
    relationName: "syncReviewDecisionDeletedByUser",
  }),
}));

export const syncAuditLogRelations = relations(syncAuditLog, ({ one }) => ({
  client: one(syncClient, {
    fields: [syncAuditLog.syncClientId],
    references: [syncClient.id],
  }),
  deletedByUser: one(user, {
    fields: [syncAuditLog.deletedByUserId],
    references: [user.id],
    relationName: "syncAuditLogDeletedByUser",
  }),
  pushBatch: one(syncPushBatch, {
    fields: [syncAuditLog.pushBatchId],
    references: [syncPushBatch.id],
  }),
}));
