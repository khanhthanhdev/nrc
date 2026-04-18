import { relations } from "drizzle-orm";
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
  varchar,
} from "drizzle-orm/pg-core";

// ============================================================
// Season Table for Season Management
// ============================================================

export const seasonTable = pgTable(
  "season",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    description: text("description"),
    gameCode: varchar("game_code", { length: 50 }).notNull(),
    id: text("id").primaryKey(),
    isActive: boolean("is_active").default(true).notNull(),
    theme: text("theme").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    year: varchar("year", { length: 4 }).notNull().unique("season_year_unique"),
  },
  (table) => [index("season_is_active_idx").on(table.isActive)],
);

export const seasonDocumentTable = pgTable(
  "season_document",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    seasonYear: varchar("season_year", { length: 4 })
      .notNull()
      .references(() => seasonTable.year, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    title: text("title").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    url: text("url").notNull(),
  },
  (table) => [
    index("season_document_season_year_idx").on(table.seasonYear),
    index("season_document_sort_order_idx").on(table.sortOrder),
  ],
);

export const seasonAnnouncementTable = pgTable(
  "season_announcement",
  {
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    publishedAt: timestamp("published_at").defaultNow().notNull(),
    seasonYear: varchar("season_year", { length: 4 })
      .notNull()
      .references(() => seasonTable.year, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    title: text("title").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("season_announcement_season_year_idx").on(table.seasonYear),
    index("season_announcement_published_at_idx").on(table.publishedAt),
    index("season_announcement_sort_order_idx").on(table.sortOrder),
  ],
);

// ============================================================
// Event, Registration, Team Tables for Sync Bootstrap
// ============================================================

export const eventStatusEnum = pgEnum("event_status", [
  "DRAFT",
  "PUBLISHED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export const eventTable = pgTable(
  "event",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    description: text("description"),
    endsAt: timestamp("ends_at").notNull(),
    eventCode: varchar("event_code", { length: 50 }).notNull(),
    eventKey: varchar("event_key", { length: 100 }).notNull(),
    id: text("id").primaryKey(),
    location: text("location"),
    maxParticipants: integer("max_participants"),
    name: text("name").notNull(),
    season: varchar("season", { length: 10 }).notNull(),
    startsAt: timestamp("starts_at").notNull(),
    status: eventStatusEnum("status").default("DRAFT").notNull(),
    timezone: text("timezone").default("UTC"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    venue: text("venue"),
  },
  (table) => [
    index("event_season_idx").on(table.season),
    index("event_status_idx").on(table.status),
    uniqueIndex("event_key_unique").on(table.eventKey),
  ],
);

export const teamTable = pgTable(
  "team",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    description: text("description"),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    organizationName: text("organization_name"),
    teamNumber: varchar("team_number", { length: 20 }).notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("team_number_unique").on(table.teamNumber)],
);

export const registrationTable = pgTable(
  "registration",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => eventTable.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    mentorContacts: jsonb("mentor_contacts").$type<string[]>(),
    operationalNotes: text("operational_notes"),
    registeredAt: timestamp("registered_at").defaultNow().notNull(),
    status: registrationStatusEnum("status").default("PENDING").notNull(),
    teamId: text("team_id")
      .notNull()
      .references(() => teamTable.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("registration_event_id_idx").on(table.eventId),
    index("registration_team_id_idx").on(table.teamId),
    index("registration_status_idx").on(table.status),
    uniqueIndex("registration_event_team_unique").on(table.eventId, table.teamId),
  ],
);

// ============================================================
// Registration Steps & Submissions Tables
// ============================================================

export const registrationStepTypeEnum = pgEnum("registration_step_type", [
  "INFO",
  "FILE_UPLOAD",
  "CONSENT",
]);

export const registrationSubmissionStatusEnum = pgEnum("registration_submission_status", [
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
]);

export const registrationStepTable = pgTable(
  "registration_step",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    description: text("description"),
    eventId: text("event_id")
      .notNull()
      .references(() => eventTable.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    isRequired: boolean("is_required").default(true).notNull(),
    metadata: jsonb("metadata"),
    stepOrder: integer("step_order").notNull(),
    stepType: registrationStepTypeEnum("step_type").notNull(),
    title: text("title").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("registration_step_event_id_idx").on(table.eventId),
    index("registration_step_order_idx").on(table.stepOrder),
  ],
);

export const registrationSubmissionTable = pgTable(
  "registration_submission",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    payload: text("payload"),
    registrationId: text("registration_id")
      .notNull()
      .references(() => registrationTable.id, { onDelete: "cascade" }),
    reviewNotes: text("review_notes"),
    reviewedAt: timestamp("reviewed_at"),
    status: registrationSubmissionStatusEnum("status").default("NOT_STARTED").notNull(),
    stepId: text("step_id")
      .notNull()
      .references(() => registrationStepTable.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("registration_submission_step_id_idx").on(table.stepId),
    index("registration_submission_registration_id_idx").on(table.registrationId),
    uniqueIndex("registration_submission_step_registration_unique").on(
      table.stepId,
      table.registrationId,
    ),
  ],
);

export const eventTeamProfileTable = pgTable(
  "event_team_profile",
  {
    contactSummary: text("contact_summary"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    eventId: text("event_id")
      .notNull()
      .references(() => eventTable.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    pitLabel: text("pit_label"),
    specialRequirements: text("special_requirements"),
    teamId: text("team_id")
      .notNull()
      .references(() => teamTable.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("event_team_profile_event_id_idx").on(table.eventId),
    uniqueIndex("event_team_profile_event_team_unique").on(table.eventId, table.teamId),
  ],
);

// Relations
export const seasonTableRelations = relations(seasonTable, ({ many }) => ({
  announcements: many(seasonAnnouncementTable),
  documents: many(seasonDocumentTable),
  events: many(eventTable),
}));

export const seasonDocumentTableRelations = relations(seasonDocumentTable, ({ one }) => ({
  season: one(seasonTable, {
    fields: [seasonDocumentTable.seasonYear],
    references: [seasonTable.year],
  }),
}));

export const seasonAnnouncementTableRelations = relations(seasonAnnouncementTable, ({ one }) => ({
  season: one(seasonTable, {
    fields: [seasonAnnouncementTable.seasonYear],
    references: [seasonTable.year],
  }),
}));

export const eventTableRelations = relations(eventTable, ({ one, many }) => ({
  profiles: many(eventTeamProfileTable),
  registrations: many(registrationTable),
  season: one(seasonTable, {
    fields: [eventTable.season],
    references: [seasonTable.year],
  }),
  steps: many(registrationStepTable),
}));

export const teamTableRelations = relations(teamTable, ({ many }) => ({
  profiles: many(eventTeamProfileTable),
  registrations: many(registrationTable),
}));

export const registrationTableRelations = relations(registrationTable, ({ one, many }) => ({
  event: one(eventTable, {
    fields: [registrationTable.eventId],
    references: [eventTable.id],
  }),
  submissions: many(registrationSubmissionTable),
  team: one(teamTable, {
    fields: [registrationTable.teamId],
    references: [teamTable.id],
  }),
}));

export const eventTeamProfileTableRelations = relations(eventTeamProfileTable, ({ one }) => ({
  event: one(eventTable, {
    fields: [eventTeamProfileTable.eventId],
    references: [eventTable.id],
  }),
  team: one(teamTable, {
    fields: [eventTeamProfileTable.teamId],
    references: [teamTable.id],
  }),
}));

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
  ],
);

export const syncClientSecret = pgTable(
  "sync_client_secret",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
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
    uniqueIndex("sync_client_secret_token_prefix_unique").on(table.tokenPrefix),
  ],
);

export const syncEventPolicy = pgTable(
  "sync_event_policy",
  {
    allowedPushResources: jsonb("allowed_push_resources")
      .$type<MachinePushResourceType[]>()
      .notNull(),
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
  (table) => [uniqueIndex("sync_event_policy_event_key_unique").on(table.eventKey)],
);

export const syncPushBatch = pgTable(
  "sync_push_batch",
  {
    batchId: text("batch_id").notNull(),
    definitionVersion: text("definition_version").notNull(),
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
    uniqueIndex("sync_push_batch_client_batch_unique").on(table.syncClientId, table.batchId),
  ],
);

export const syncPushResource = pgTable(
  "sync_push_resource",
  {
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
  ],
);

export const syncChangeSet = pgTable(
  "sync_change_set",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
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
    uniqueIndex("sync_change_set_push_batch_unique").on(table.pushBatchId),
  ],
);

export const syncStagedItem = pgTable(
  "sync_staged_item",
  {
    changeSetId: text("change_set_id")
      .notNull()
      .references(() => syncChangeSet.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
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
    uniqueIndex("sync_staged_item_change_resource_record_unique").on(
      table.changeSetId,
      table.resourceType,
      table.recordKey,
    ),
  ],
);

export const syncReviewDecision = pgTable(
  "sync_review_decision",
  {
    changeSetId: text("change_set_id")
      .notNull()
      .references(() => syncChangeSet.id, { onDelete: "cascade" }),
    decision: reviewDecisionEnum("decision").notNull(),
    id: text("id").primaryKey(),
    reason: text("reason"),
    reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
    reviewerId: text("reviewer_id").notNull(),
  },
  (table) => [index("sync_review_decision_change_set_id_idx").on(table.changeSetId)],
);

export const syncAuditLog = pgTable(
  "sync_audit_log",
  {
    action: auditActionEnum("action").notNull(),
    actorId: text("actor_id"),
    actorType: auditActorTypeEnum("actor_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
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
  ],
);

export const publishedInspection = pgTable(
  "published_inspection",
  {
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
    uniqueIndex("published_inspection_event_team_type_unique").on(
      table.eventKey,
      table.teamNumber,
      table.inspectionType,
    ),
  ],
);

export const publishedMatch = pgTable(
  "published_match",
  {
    blueAlliance: jsonb("blue_alliance").$type<string[]>(),
    blueScore: integer("blue_score"),
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
    uniqueIndex("published_match_event_match_key_unique").on(table.eventKey, table.matchKey),
  ],
);

export const publishedRanking = pgTable(
  "published_ranking",
  {
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
    uniqueIndex("published_ranking_event_team_unique").on(table.eventKey, table.teamNumber),
  ],
);

export const publishedAward = pgTable(
  "published_award",
  {
    awardKey: text("award_key").notNull(),
    awardName: text("award_name").notNull(),
    comment: text("comment"),
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
    uniqueIndex("published_award_event_award_key_unique").on(table.eventKey, table.awardKey),
  ],
);

export const syncClientRelations = relations(syncClient, ({ many }) => ({
  auditLogs: many(syncAuditLog),
  batches: many(syncPushBatch),
  secrets: many(syncClientSecret),
}));

export const syncClientSecretRelations = relations(syncClientSecret, ({ one }) => ({
  client: one(syncClient, {
    fields: [syncClientSecret.syncClientId],
    references: [syncClient.id],
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
  resources: many(syncPushResource),
}));

export const syncPushResourceRelations = relations(syncPushResource, ({ one }) => ({
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
  reviewDecisions: many(syncReviewDecision),
  stagedItems: many(syncStagedItem),
}));

export const syncStagedItemRelations = relations(syncStagedItem, ({ one }) => ({
  changeSet: one(syncChangeSet, {
    fields: [syncStagedItem.changeSetId],
    references: [syncChangeSet.id],
  }),
}));

export const syncReviewDecisionRelations = relations(syncReviewDecision, ({ one }) => ({
  changeSet: one(syncChangeSet, {
    fields: [syncReviewDecision.changeSetId],
    references: [syncChangeSet.id],
  }),
}));

export const syncAuditLogRelations = relations(syncAuditLog, ({ one }) => ({
  client: one(syncClient, {
    fields: [syncAuditLog.syncClientId],
    references: [syncClient.id],
  }),
  pushBatch: one(syncPushBatch, {
    fields: [syncAuditLog.pushBatchId],
    references: [syncPushBatch.id],
  }),
}));

export const registrationStepTableRelations = relations(registrationStepTable, ({ one, many }) => ({
  event: one(eventTable, {
    fields: [registrationStepTable.eventId],
    references: [eventTable.id],
  }),
  submissions: many(registrationSubmissionTable),
}));

export const registrationSubmissionTableRelations = relations(
  registrationSubmissionTable,
  ({ one }) => ({
    registration: one(registrationTable, {
      fields: [registrationSubmissionTable.registrationId],
      references: [registrationTable.id],
    }),
    step: one(registrationStepTable, {
      fields: [registrationSubmissionTable.stepId],
      references: [registrationStepTable.id],
    }),
  }),
);
