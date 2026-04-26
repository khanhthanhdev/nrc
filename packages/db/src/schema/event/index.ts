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
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "../auth/index.js";
import { team } from "../team/index.js";

// ============================================================
// Season Table for Season Management
// ============================================================

export const seasonTable = pgTable(
  "season",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    gameCode: varchar("game_code", { length: 50 }).notNull(),
    id: text("id").primaryKey(),
    isActive: boolean("is_active").default(true).notNull(),
    theme: text("theme").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    year: varchar("year", { length: 4 }).notNull().unique(),
  },
  (table) => [
    index("season_is_active_idx").on(table.isActive),
    index("season_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("season_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("season_year_active_unique")
      .on(table.year)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const seasonDocumentTable = pgTable(
  "season_document",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
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
    index("season_document_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("season_document_deleted_at_idx").on(table.deletedAt),
  ],
);

export const seasonAnnouncementTable = pgTable(
  "season_announcement",
  {
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
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
    index("season_announcement_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("season_announcement_deleted_at_idx").on(table.deletedAt),
  ],
);

// ============================================================
// Event and Registration Tables
// ============================================================

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "registration_open",
  "registration_closed",
  "active",
  "completed",
  "archived",
]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "draft",
  "submitted",
  "under_review",
  "needs_revision",
  "approved",
  "denied",
  "withdrawn",
]);

export const registrationReviewActionTypeEnum = pgEnum("registration_review_action_type", [
  "submitted",
  "commented",
  "requested_changes",
  "approved",
  "denied",
  "withdrawn",
  "status_changed",
]);

export const eventTable = pgTable(
  "event",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    eventCode: varchar("event_code", { length: 50 }).notNull(),
    eventEndsAt: timestamp("event_ends_at").notNull(),
    eventKey: varchar("event_key", { length: 100 }).notNull(),
    eventStartsAt: timestamp("event_starts_at").notNull(),
    id: text("id").primaryKey(),
    location: text("location"),
    maxParticipants: integer("max_participants"),
    name: text("name").notNull(),
    registrationEndsAt: timestamp("registration_ends_at"),
    registrationStartsAt: timestamp("registration_starts_at"),
    season: varchar("season", { length: 10 }).notNull(),
    status: eventStatusEnum("status").default("draft").notNull(),
    summary: text("summary"),
    timezone: text("timezone").default("UTC"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    venue: text("venue"),
  },
  (table) => [
    uniqueIndex("event_key_unique")
      .on(table.eventKey)
      .where(sql`${table.deletedAt} IS NULL`),
    uniqueIndex("event_season_event_code_unique")
      .on(table.season, table.eventCode)
      .where(sql`${table.deletedAt} IS NULL`),
    index("event_season_idx").on(table.season),
    index("event_status_idx").on(table.status),
    index("event_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("event_deleted_at_idx").on(table.deletedAt),
  ],
);

export const eventDocumentTable = pgTable(
  "event_document",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventId: text("event_id")
      .notNull()
      .references(() => eventTable.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    isPublic: boolean("is_public").default(true).notNull(),
    kind: text("kind").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    title: text("title").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    url: text("url").notNull(),
  },
  (table) => [
    index("event_document_event_id_idx").on(table.eventId),
    index("event_document_sort_order_idx").on(table.sortOrder),
    index("event_document_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("event_document_deleted_at_idx").on(table.deletedAt),
  ],
);

export const eventAnnouncementTable = pgTable(
  "event_announcement",
  {
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventId: text("event_id")
      .notNull()
      .references(() => eventTable.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    publishedAt: timestamp("published_at").defaultNow().notNull(),
    title: text("title").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("event_announcement_event_id_idx").on(table.eventId),
    index("event_announcement_published_at_idx").on(table.publishedAt),
    index("event_announcement_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("event_announcement_deleted_at_idx").on(table.deletedAt),
  ],
);

export const managerEventScope = pgTable(
  "manager_event_scope",
  {
    assignedByUserId: text("assigned_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventId: text("event_id")
      .notNull()
      .references(() => eventTable.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    isActive: boolean("is_active").default(true).notNull(),
    permissionSet: jsonb("permission_set").$type<Record<string, boolean>>().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("manager_event_scope_event_id_idx").on(table.eventId),
    index("manager_event_scope_user_id_idx").on(table.userId),
    index("manager_event_scope_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("manager_event_scope_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("manager_event_scope_event_user_active_unique")
      .on(table.eventId, table.userId)
      .where(sql`${table.isActive} = true AND ${table.deletedAt} IS NULL`),
  ],
);

export const eventRegistrationFormVersionTable = pgTable(
  "event_registration_form_version",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    definition: jsonb("definition").$type<Record<string, unknown>>().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventId: text("event_id")
      .notNull()
      .references(() => eventTable.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    isPublished: boolean("is_published").default(false).notNull(),
    publishedAt: timestamp("published_at"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    versionNumber: integer("version_number").notNull(),
  },
  (table) => [
    index("event_registration_form_version_event_id_idx").on(table.eventId),
    index("event_registration_form_version_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("event_registration_form_version_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("event_registration_form_version_event_version_unique")
      .on(table.eventId, table.versionNumber)
      .where(sql`${table.deletedAt} IS NULL`),
    uniqueIndex("event_registration_form_version_event_published_unique")
      .on(table.eventId)
      .where(sql`${table.isPublished} = true AND ${table.deletedAt} IS NULL`),
  ],
);

export const registrationTable = pgTable(
  "registration",
  {
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    currentRevisionNumber: integer("current_revision_number").default(0).notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    deniedAt: timestamp("denied_at"),
    eventId: text("event_id")
      .notNull()
      .references(() => eventTable.id, { onDelete: "cascade" }),
    formVersionId: text("form_version_id")
      .notNull()
      .references(() => eventRegistrationFormVersionTable.id, { onDelete: "restrict" }),
    id: text("id").primaryKey(),
    reviewedAt: timestamp("reviewed_at"),
    status: registrationStatusEnum("status").default("draft").notNull(),
    submittedAt: timestamp("submitted_at"),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    withdrawnAt: timestamp("withdrawn_at"),
  },
  (table) => [
    index("registration_event_id_idx").on(table.eventId),
    index("registration_team_id_idx").on(table.teamId),
    index("registration_status_idx").on(table.status),
    index("registration_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("registration_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("registration_event_team_unique")
      .on(table.eventId, table.teamId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const registrationRevisionTable = pgTable(
  "registration_revision",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    id: text("id").primaryKey(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    registrationId: text("registration_id")
      .notNull()
      .references(() => registrationTable.id, { onDelete: "cascade" }),
    revisionNumber: integer("revision_number").notNull(),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    submittedByUserId: text("submitted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("registration_revision_registration_id_idx").on(table.registrationId),
    index("registration_revision_submitted_at_idx").on(table.submittedAt),
    index("registration_revision_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("registration_revision_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("registration_revision_registration_revision_unique")
      .on(table.registrationId, table.revisionNumber)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const registrationReviewActionTable = pgTable(
  "registration_review_action",
  {
    actionType: registrationReviewActionTypeEnum("action_type").notNull(),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    id: text("id").primaryKey(),
    isVisibleToTeam: boolean("is_visible_to_team").default(true).notNull(),
    nextStatus: registrationStatusEnum("next_status"),
    previousStatus: registrationStatusEnum("previous_status"),
    registrationId: text("registration_id")
      .notNull()
      .references(() => registrationTable.id, { onDelete: "cascade" }),
    revisionId: text("revision_id").references(() => registrationRevisionTable.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("registration_review_action_registration_id_idx").on(table.registrationId),
    index("registration_review_action_created_at_idx").on(table.createdAt),
    index("registration_review_action_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("registration_review_action_deleted_at_idx").on(table.deletedAt),
  ],
);

export const eventTeamProfileTable = pgTable(
  "event_team_profile",
  {
    contactSummary: text("contact_summary"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventId: text("event_id")
      .notNull()
      .references(() => eventTable.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    pitLabel: text("pit_label"),
    specialRequirements: text("special_requirements"),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("event_team_profile_event_id_idx").on(table.eventId),
    index("event_team_profile_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("event_team_profile_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("event_team_profile_event_team_unique")
      .on(table.eventId, table.teamId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

// Relations
export const seasonTableRelations = relations(seasonTable, ({ many, one }) => ({
  announcements: many(seasonAnnouncementTable),
  deletedByUser: one(user, {
    fields: [seasonTable.deletedByUserId],
    references: [user.id],
    relationName: "seasonDeletedByUser",
  }),
  documents: many(seasonDocumentTable),
  events: many(eventTable),
}));

export const seasonDocumentTableRelations = relations(seasonDocumentTable, ({ one }) => ({
  deletedByUser: one(user, {
    fields: [seasonDocumentTable.deletedByUserId],
    references: [user.id],
    relationName: "seasonDocumentDeletedByUser",
  }),
  season: one(seasonTable, {
    fields: [seasonDocumentTable.seasonYear],
    references: [seasonTable.year],
  }),
}));

export const seasonAnnouncementTableRelations = relations(seasonAnnouncementTable, ({ one }) => ({
  deletedByUser: one(user, {
    fields: [seasonAnnouncementTable.deletedByUserId],
    references: [user.id],
    relationName: "seasonAnnouncementDeletedByUser",
  }),
  season: one(seasonTable, {
    fields: [seasonAnnouncementTable.seasonYear],
    references: [seasonTable.year],
  }),
}));

export const eventTableRelations = relations(eventTable, ({ one, many }) => ({
  announcements: many(eventAnnouncementTable),
  deletedByUser: one(user, {
    fields: [eventTable.deletedByUserId],
    references: [user.id],
    relationName: "eventDeletedByUser",
  }),
  documents: many(eventDocumentTable),
  formVersions: many(eventRegistrationFormVersionTable),
  managerScopes: many(managerEventScope),
  profiles: many(eventTeamProfileTable),
  registrations: many(registrationTable),
  season: one(seasonTable, {
    fields: [eventTable.season],
    references: [seasonTable.year],
  }),
}));

export const teamTableRelations = relations(team, ({ many }) => ({
  profiles: many(eventTeamProfileTable),
  registrations: many(registrationTable),
}));

export const registrationTableRelations = relations(registrationTable, ({ one, many }) => ({
  createdByUser: one(user, {
    fields: [registrationTable.createdByUserId],
    references: [user.id],
    relationName: "registrationCreatedByUser",
  }),
  deletedByUser: one(user, {
    fields: [registrationTable.deletedByUserId],
    references: [user.id],
    relationName: "registrationDeletedByUser",
  }),
  event: one(eventTable, {
    fields: [registrationTable.eventId],
    references: [eventTable.id],
  }),
  formVersion: one(eventRegistrationFormVersionTable, {
    fields: [registrationTable.formVersionId],
    references: [eventRegistrationFormVersionTable.id],
  }),
  reviewActions: many(registrationReviewActionTable),
  revisions: many(registrationRevisionTable),
  team: one(team, {
    fields: [registrationTable.teamId],
    references: [team.id],
  }),
}));

export const eventTeamProfileTableRelations = relations(eventTeamProfileTable, ({ one }) => ({
  deletedByUser: one(user, {
    fields: [eventTeamProfileTable.deletedByUserId],
    references: [user.id],
    relationName: "eventTeamProfileDeletedByUser",
  }),
  event: one(eventTable, {
    fields: [eventTeamProfileTable.eventId],
    references: [eventTable.id],
  }),
  team: one(team, {
    fields: [eventTeamProfileTable.teamId],
    references: [team.id],
  }),
}));

export const eventDocumentTableRelations = relations(eventDocumentTable, ({ one }) => ({
  deletedByUser: one(user, {
    fields: [eventDocumentTable.deletedByUserId],
    references: [user.id],
    relationName: "eventDocumentDeletedByUser",
  }),
  event: one(eventTable, {
    fields: [eventDocumentTable.eventId],
    references: [eventTable.id],
  }),
}));

export const eventAnnouncementTableRelations = relations(eventAnnouncementTable, ({ one }) => ({
  deletedByUser: one(user, {
    fields: [eventAnnouncementTable.deletedByUserId],
    references: [user.id],
    relationName: "eventAnnouncementDeletedByUser",
  }),
  event: one(eventTable, {
    fields: [eventAnnouncementTable.eventId],
    references: [eventTable.id],
  }),
}));

export const managerEventScopeRelations = relations(managerEventScope, ({ one }) => ({
  assignedByUser: one(user, {
    fields: [managerEventScope.assignedByUserId],
    references: [user.id],
    relationName: "managerEventScopeAssignedByUser",
  }),
  deletedByUser: one(user, {
    fields: [managerEventScope.deletedByUserId],
    references: [user.id],
    relationName: "managerEventScopeDeletedByUser",
  }),
  event: one(eventTable, {
    fields: [managerEventScope.eventId],
    references: [eventTable.id],
  }),
  user: one(user, {
    fields: [managerEventScope.userId],
    references: [user.id],
    relationName: "managerEventScopeUser",
  }),
}));

export const eventRegistrationFormVersionTableRelations = relations(
  eventRegistrationFormVersionTable,
  ({ many, one }) => ({
    createdByUser: one(user, {
      fields: [eventRegistrationFormVersionTable.createdByUserId],
      references: [user.id],
      relationName: "eventRegistrationFormVersionCreatedByUser",
    }),
    deletedByUser: one(user, {
      fields: [eventRegistrationFormVersionTable.deletedByUserId],
      references: [user.id],
      relationName: "eventRegistrationFormVersionDeletedByUser",
    }),
    event: one(eventTable, {
      fields: [eventRegistrationFormVersionTable.eventId],
      references: [eventTable.id],
    }),
    registrations: many(registrationTable),
  }),
);

export const registrationRevisionTableRelations = relations(
  registrationRevisionTable,
  ({ many, one }) => ({
    deletedByUser: one(user, {
      fields: [registrationRevisionTable.deletedByUserId],
      references: [user.id],
      relationName: "registrationRevisionDeletedByUser",
    }),
    registration: one(registrationTable, {
      fields: [registrationRevisionTable.registrationId],
      references: [registrationTable.id],
    }),
    reviewActions: many(registrationReviewActionTable),
    submittedByUser: one(user, {
      fields: [registrationRevisionTable.submittedByUserId],
      references: [user.id],
      relationName: "registrationRevisionSubmittedByUser",
    }),
  }),
);

export const registrationReviewActionTableRelations = relations(
  registrationReviewActionTable,
  ({ one }) => ({
    actorUser: one(user, {
      fields: [registrationReviewActionTable.actorUserId],
      references: [user.id],
      relationName: "registrationReviewActionActorUser",
    }),
    deletedByUser: one(user, {
      fields: [registrationReviewActionTable.deletedByUserId],
      references: [user.id],
      relationName: "registrationReviewActionDeletedByUser",
    }),
    registration: one(registrationTable, {
      fields: [registrationReviewActionTable.registrationId],
      references: [registrationTable.id],
    }),
    revision: one(registrationRevisionTable, {
      fields: [registrationReviewActionTable.revisionId],
      references: [registrationRevisionTable.id],
    }),
  }),
);
