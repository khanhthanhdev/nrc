import { relations, sql } from "drizzle-orm";
import { boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { organization, user } from "../auth/index.js";

export const teamMembershipRoleEnum = pgEnum("team_membership_role", [
  "TEAM_MENTOR",
  "TEAM_LEADER",
  "TEAM_MEMBER",
]);

export const teamInvitationStatusEnum = pgEnum("team_invitation_status", [
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "REVOKED",
]);

export const team = pgTable(
  "team",
  {
    avatarUrl: text("avatar_url"),
    cityOrProvince: text("city_or_province"),
    coverImageUrl: text("cover_image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    schoolOrOrganization: text("school_or_organization"),
    teamNumber: text("team_number").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("team_organization_id_unique")
      .on(table.organizationId)
      .where(sql`${table.deletedAt} IS NULL`),
    uniqueIndex("team_team_number_unique")
      .on(table.teamNumber)
      .where(sql`${table.deletedAt} IS NULL`),
    index("team_created_by_user_id_idx").on(table.createdByUserId),
    index("team_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("team_deleted_at_idx").on(table.deletedAt),
  ],
);

export const teamMembership = pgTable(
  "team_membership",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    id: text("id").primaryKey(),
    invitedByUserId: text("invited_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").default(true).notNull(),
    role: teamMembershipRoleEnum("role").notNull(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("team_membership_team_id_idx").on(table.teamId),
    index("team_membership_user_id_idx").on(table.userId),
    index("team_membership_role_idx").on(table.role),
    index("team_membership_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("team_membership_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("team_membership_team_user_active_unique")
      .on(table.teamId, table.userId)
      .where(sql`${table.isActive} = true AND ${table.deletedAt} IS NULL`),
    uniqueIndex("team_membership_user_non_mentor_active_unique")
      .on(table.userId)
      .where(
        sql`${table.isActive} = true AND ${table.role} IN ('TEAM_LEADER', 'TEAM_MEMBER') AND ${table.deletedAt} IS NULL`,
      ),
  ],
);

export const teamInvitation = pgTable(
  "team_invitation",
  {
    acceptedAt: timestamp("accepted_at"),
    acceptedByUserId: text("accepted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    email: text("email").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    id: text("id").primaryKey(),
    invitedByUserId: text("invited_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    revokedAt: timestamp("revoked_at"),
    revokedReason: text("revoked_reason"),
    role: teamMembershipRoleEnum("role").notNull(),
    status: teamInvitationStatusEnum("status").default("PENDING").notNull(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("team_invitation_team_id_idx").on(table.teamId),
    index("team_invitation_email_idx").on(table.email),
    index("team_invitation_status_idx").on(table.status),
    index("team_invitation_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("team_invitation_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("team_invitation_team_email_pending_unique")
      .on(table.teamId, table.email)
      .where(sql`${table.status} = 'PENDING' AND ${table.deletedAt} IS NULL`),
  ],
);

export const teamRelations = relations(team, ({ many, one }) => ({
  createdByUser: one(user, {
    fields: [team.createdByUserId],
    references: [user.id],
  }),
  deletedByUser: one(user, {
    fields: [team.deletedByUserId],
    references: [user.id],
    relationName: "teamDeletedByUser",
  }),
  invitations: many(teamInvitation),
  memberships: many(teamMembership),
}));

export const teamMembershipRelations = relations(teamMembership, ({ one }) => ({
  deletedByUser: one(user, {
    fields: [teamMembership.deletedByUserId],
    references: [user.id],
    relationName: "teamMembershipDeletedByUser",
  }),
  invitedByUser: one(user, {
    fields: [teamMembership.invitedByUserId],
    references: [user.id],
    relationName: "teamMembershipInvitedByUser",
  }),
  team: one(team, {
    fields: [teamMembership.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMembership.userId],
    references: [user.id],
    relationName: "teamMembershipUser",
  }),
}));

export const teamInvitationRelations = relations(teamInvitation, ({ one }) => ({
  acceptedByUser: one(user, {
    fields: [teamInvitation.acceptedByUserId],
    references: [user.id],
    relationName: "teamInvitationAcceptedByUser",
  }),
  deletedByUser: one(user, {
    fields: [teamInvitation.deletedByUserId],
    references: [user.id],
    relationName: "teamInvitationDeletedByUser",
  }),
  invitedByUser: one(user, {
    fields: [teamInvitation.invitedByUserId],
    references: [user.id],
    relationName: "teamInvitationInvitedByUser",
  }),
  team: one(team, {
    fields: [teamInvitation.teamId],
    references: [team.id],
  }),
}));
