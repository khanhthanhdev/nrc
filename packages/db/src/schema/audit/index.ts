import { relations } from "drizzle-orm";
import { index, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "../auth/index.js";

export const featureAuditActionEnum = pgEnum("feature_audit_action", [
  "CREATE",
  "UPDATE",
  "SOFT_DELETE",
  "RESTORE",
]);

export const featureAuditActorTypeEnum = pgEnum("feature_audit_actor_type", [
  "USER",
  "SYSTEM",
  "SYNC_CLIENT",
]);

export const featureAuditLog = pgTable(
  "feature_audit_log",
  {
    action: featureAuditActionEnum("action").notNull(),
    actorLabel: text("actor_label"),
    actorType: featureAuditActorTypeEnum("actor_type").default("USER").notNull(),
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    afterSnapshot: jsonb("after_snapshot").$type<Record<string, unknown>>(),
    beforeSnapshot: jsonb("before_snapshot").$type<Record<string, unknown>>(),
    entityId: text("entity_id").notNull(),
    entityType: text("entity_type").notNull(),
    id: text("id").primaryKey(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(),
    requestId: text("request_id"),
  },
  (table) => [
    index("feature_audit_log_entity_idx").on(table.entityType, table.entityId),
    index("feature_audit_log_action_idx").on(table.action),
    index("feature_audit_log_actor_user_id_idx").on(table.actorUserId),
    index("feature_audit_log_occurred_at_idx").on(table.occurredAt),
  ],
);

export const featureAuditLogRelations = relations(featureAuditLog, ({ one }) => ({
  actorUser: one(user, {
    fields: [featureAuditLog.actorUserId],
    references: [user.id],
  }),
}));
