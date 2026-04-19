import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export const userTypeEnum = pgEnum("user_type", ["PARTICIPANT", "MENTOR", "STAFF"]);

export const systemRoleEnum = pgEnum("system_role", ["USER", "MANAGER", "ADMIN"]);

export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "LOCKED", "DISABLED"]);

export const userPreferredLocaleEnum = pgEnum("user_preferred_locale", ["en", "vi"]);

export const user = pgTable(
  "user",
  {
    address: text("address").default("").notNull(),
    banExpires: timestamp("ban_expires"),
    banReason: text("ban_reason"),
    banned: boolean("banned").default(false).notNull(),
    city: text("city").default("").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    dateOfBirth: date("date_of_birth").default("1970-01-01").notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references((): AnyPgColumn => user.id, {
      onDelete: "set null",
    }),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    id: text("id").primaryKey(),
    image: text("image"),
    lockedAt: timestamp("locked_at"),
    lockedByUserId: text("locked_by_user_id"),
    lockedReason: text("locked_reason"),
    name: text("name").notNull(),
    onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
    organizationOrSchool: text("organization_or_school").default("").notNull(),
    phone: text("phone").default("").notNull(),
    preferredLocale: userPreferredLocaleEnum("preferred_locale").default("en").notNull(),
    status: userStatusEnum("status").default("ACTIVE").notNull(),
    systemRole: systemRoleEnum("system_role").default("USER").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    userType: userTypeEnum("user_type").default("PARTICIPANT").notNull(),
  },
  (table) => [
    check(
      "user_type_system_role_consistency_check",
      sql`(${table.userType} = 'STAFF' AND ${table.systemRole} IN ('ADMIN', 'MANAGER'))
      OR (${table.userType} IN ('PARTICIPANT', 'MENTOR') AND ${table.systemRole} = 'USER')`,
    ),
    index("user_system_role_idx").on(table.systemRole),
    index("user_deleted_at_idx").on(table.deletedAt),
    index("user_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("user_status_idx").on(table.status),
    index("user_type_idx").on(table.userType),
  ],
);

export const staffRoleAssignmentLog = pgTable(
  "staff_role_assignment_log",
  {
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    id: text("id").primaryKey(),
    newSystemRole: systemRoleEnum("new_system_role").notNull(),
    oldSystemRole: systemRoleEnum("old_system_role"),
    reason: text("reason"),
    targetUserId: text("target_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("staff_role_assignment_log_actor_user_id_idx").on(table.actorUserId),
    index("staff_role_assignment_log_target_user_id_idx").on(table.targetUserId),
    index("staff_role_assignment_log_created_at_idx").on(table.createdAt),
    index("staff_role_assignment_log_deleted_by_user_id_idx").on(table.deletedByUserId),
    index("staff_role_assignment_log_deleted_at_idx").on(table.deletedAt),
  ],
);

export const organization = pgTable(
  "organization",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    logo: text("logo"),
    metadata: text("metadata"),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    teamNumber: text("team_number"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("organization_slug_idx").on(table.slug)],
);

export const member = pgTable(
  "member",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("member_organization_id_idx").on(table.organizationId),
    index("member_user_id_idx").on(table.userId),
    uniqueIndex("member_organization_user_unique").on(table.organizationId, table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    email: text("email").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    id: text("id").primaryKey(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    status: text("status").default("pending").notNull(),
  },
  (table) => [
    index("invitation_organization_id_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
    index("invitation_status_idx").on(table.status),
  ],
);

export const session = pgTable(
  "session",
  {
    activeOrganizationId: text("active_organization_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    id: text("id").primaryKey(),
    impersonatedBy: text("impersonated_by"),
    ipAddress: text("ip_address"),
    token: text("token").notNull().unique(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    accessToken: text("access_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    accountId: text("account_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    idToken: text("id_token"),
    password: text("password"),
    providerId: text("provider_id").notNull(),
    refreshToken: text("refresh_token"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    value: text("value").notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many, one }) => ({
  accounts: many(account),
  actorRoleAssignments: many(staffRoleAssignmentLog, {
    relationName: "actorRoleAssignments",
  }),
  deletedByUser: one(user, {
    fields: [user.deletedByUserId],
    references: [user.id],
    relationName: "userDeletedByUser",
  }),
  deletedUsers: many(user, {
    relationName: "userDeletedByUser",
  }),
  memberships: many(member),
  sentInvitations: many(invitation),
  sessions: many(session),
  targetRoleAssignments: many(staffRoleAssignmentLog, {
    relationName: "targetRoleAssignments",
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  activeOrganization: one(organization, {
    fields: [session.activeOrganizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  invitations: many(invitation),
  members: many(member),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const staffRoleAssignmentLogRelations = relations(staffRoleAssignmentLog, ({ one }) => ({
  actorUser: one(user, {
    fields: [staffRoleAssignmentLog.actorUserId],
    references: [user.id],
    relationName: "actorRoleAssignments",
  }),
  deletedByUser: one(user, {
    fields: [staffRoleAssignmentLog.deletedByUserId],
    references: [user.id],
    relationName: "staffRoleAssignmentLogDeletedByUser",
  }),
  targetUser: one(user, {
    fields: [staffRoleAssignmentLog.targetUserId],
    references: [user.id],
    relationName: "targetRoleAssignments",
  }),
}));
