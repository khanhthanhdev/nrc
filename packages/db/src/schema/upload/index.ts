import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "../auth/index.js";

export const uploadedFiles = pgTable(
  "uploaded_files",
  {
    category: text("category", {
      enum: ["profile", "attachment", "event", "team_logo"],
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    fileName: text("file_name").notNull(),
    fileSize: text("file_size").notNull(),
    fileType: text("file_type").notNull(),
    id: uuid("id").primaryKey().defaultRandom(),
    metadata: jsonb("metadata").$type<{
      uploadedAt: string;
      uploadedBy: string;
      userType: string;
      email: string;
      contextId?: string | null;
    }>(),
    s3Key: text("s3_key").notNull(),
    s3Url: text("s3_url").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("idx_uploaded_files_user_id").on(table.userId),
    index("idx_uploaded_files_category").on(table.category),
    index("idx_uploaded_files_s3_key").on(table.s3Key),
    index("idx_uploaded_files_created_at").on(table.createdAt),
    index("idx_uploaded_files_deleted_by_user_id").on(table.deletedByUserId),
    index("idx_uploaded_files_deleted_at").on(table.deletedAt),
  ],
);

export const uploadedFilesRelations = relations(uploadedFiles, ({ one }) => ({
  deletedByUser: one(user, {
    fields: [uploadedFiles.deletedByUserId],
    references: [user.id],
    relationName: "uploadedFilesDeletedByUser",
  }),
  user: one(user, {
    fields: [uploadedFiles.userId],
    references: [user.id],
  }),
}));
