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
import { eventTable } from "../event/index.js";
import { team } from "../team/index.js";

export const notificationTopicEnum = pgEnum("notification_topic", [
  "TEAM_ACTIVITY",
  "REGISTRATION_STATUS",
  "ORGANIZER_COMMENT",
  "UPCOMING_MATCH",
  "EVENT_ANNOUNCEMENT",
]);

export const notificationChannelEnum = pgEnum("notification_channel", ["IN_APP", "EMAIL"]);

export const notificationDeliveryStatusEnum = pgEnum("notification_delivery_status", [
  "PENDING",
  "SENT",
  "FAILED",
]);

export const notificationSubscription = pgTable(
  "notification_subscription",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventId: text("event_id").references(() => eventTable.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    topic: notificationTopicEnum("topic").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("notification_subscription_user_id_idx").on(table.userId),
    index("notification_subscription_topic_idx").on(table.topic),
    index("notification_subscription_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("notification_subscription_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("notification_subscription_scope_unique")
      .on(table.userId, table.topic, table.eventId, table.teamId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const notification = pgTable(
  "notification",
  {
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    bodyI18n: jsonb("body_i18n").$type<{ en: string; vi: string }>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventId: text("event_id").references(() => eventTable.id, { onDelete: "set null" }),
    id: text("id").primaryKey(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    titleI18n: jsonb("title_i18n").$type<{ en: string; vi: string }>().notNull(),
    topic: notificationTopicEnum("topic").notNull(),
    type: text("type").notNull(),
  },
  (table) => [
    index("notification_topic_idx").on(table.topic),
    index("notification_created_at_idx").on(table.createdAt),
    index("notification_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("notification_deleted_at_idx").on(table.deletedAt),
  ],
);

export const notificationDelivery = pgTable(
  "notification_delivery",
  {
    attemptCount: integer("attempt_count").default(0).notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    deliveredAt: timestamp("delivered_at"),
    id: text("id").primaryKey(),
    lastError: text("last_error"),
    notificationId: text("notification_id")
      .notNull()
      .references(() => notification.id, { onDelete: "cascade" }),
    status: notificationDeliveryStatusEnum("status").default("PENDING").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("notification_delivery_notification_id_idx").on(table.notificationId),
    index("notification_delivery_user_id_idx").on(table.userId),
    index("notification_delivery_status_idx").on(table.status),
    index("notification_delivery_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("notification_delivery_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("notification_delivery_unique")
      .on(table.notificationId, table.userId, table.channel)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const notificationSubscriptionRelations = relations(notificationSubscription, ({ one }) => ({
  deletedByUser: one(user, {
    fields: [notificationSubscription.deletedByUserId],
    references: [user.id],
    relationName: "notificationSubscriptionDeletedByUser",
  }),
  event: one(eventTable, {
    fields: [notificationSubscription.eventId],
    references: [eventTable.id],
  }),
  team: one(team, {
    fields: [notificationSubscription.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [notificationSubscription.userId],
    references: [user.id],
  }),
}));

export const notificationRelations = relations(notification, ({ many, one }) => ({
  actorUser: one(user, {
    fields: [notification.actorUserId],
    references: [user.id],
    relationName: "notificationActorUser",
  }),
  deletedByUser: one(user, {
    fields: [notification.deletedByUserId],
    references: [user.id],
    relationName: "notificationDeletedByUser",
  }),
  deliveries: many(notificationDelivery),
  event: one(eventTable, {
    fields: [notification.eventId],
    references: [eventTable.id],
  }),
  team: one(team, {
    fields: [notification.teamId],
    references: [team.id],
  }),
}));

export const notificationDeliveryRelations = relations(notificationDelivery, ({ one }) => ({
  deletedByUser: one(user, {
    fields: [notificationDelivery.deletedByUserId],
    references: [user.id],
    relationName: "notificationDeliveryDeletedByUser",
  }),
  notification: one(notification, {
    fields: [notificationDelivery.notificationId],
    references: [notification.id],
  }),
  user: one(user, {
    fields: [notificationDelivery.userId],
    references: [user.id],
  }),
}));
