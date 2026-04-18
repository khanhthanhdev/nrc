import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const teamProfile = pgTable(
  "team_profile",
  {
    avatarUrl: text("avatar_url"),
    coverImageUrl: text("cover_image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    organizationId: text("organization_id").notNull(),
    organizationName: text("organization_name"),
    teamNumber: text("team_number").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("team_profile_organization_id_unique").on(table.organizationId),
    uniqueIndex("team_profile_team_number_unique").on(table.teamNumber),
    index("team_profile_created_by_user_idx").on(table.createdByUserId),
  ],
);

export const teamProfileRelations = relations(teamProfile, ({ one }) => ({
  createdByUser: one(user, {
    fields: [teamProfile.createdByUserId],
    references: [user.id],
  }),
}));
