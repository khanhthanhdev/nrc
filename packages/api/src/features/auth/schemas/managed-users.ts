import * as v from "valibot";

export const managedUserSystemRoleSchema = v.picklist(["USER", "MANAGER", "ADMIN"]);
export const managedUserSearchFieldSchema = v.picklist(["email", "name"]);
export const managedUserStatusFilterSchema = v.picklist(["all", "active", "banned"]);
export const managedUserSortSchema = v.picklist(["newest", "updated", "name", "email"]);
export const managedUserRoleFilterSchema = v.picklist(["all", "USER", "MANAGER", "ADMIN"]);

export const getManagedUsersInputSchema = v.object({
  includeExampleAccounts: v.boolean(),
  page: v.pipe(v.number(), v.integer(), v.minValue(1)),
  pageSize: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
  roleFilter: managedUserRoleFilterSchema,
  searchField: managedUserSearchFieldSchema,
  searchValue: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(255))),
  sort: managedUserSortSchema,
  statusFilter: managedUserStatusFilterSchema,
});

export const createManagedUserInputSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email()),
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255)),
  password: v.pipe(v.string(), v.minLength(8), v.maxLength(128)),
  systemRole: managedUserSystemRoleSchema,
});

export const saveManagedUserInputSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255)),
  systemRole: managedUserSystemRoleSchema,
  userId: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255)),
});

export const getManagedUserInputSchema = v.object({
  userId: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255)),
});

export type GetManagedUsersInput = v.InferOutput<typeof getManagedUsersInputSchema>;
export type GetManagedUserInput = v.InferOutput<typeof getManagedUserInputSchema>;
export type CreateManagedUserInput = v.InferOutput<typeof createManagedUserInputSchema>;
export type SaveManagedUserInput = v.InferOutput<typeof saveManagedUserInputSchema>;
export type ManagedUserSystemRole = v.InferOutput<typeof managedUserSystemRoleSchema>;
export type ManagedUserRoleFilter = v.InferOutput<typeof managedUserRoleFilterSchema>;
export type ManagedUserSearchField = v.InferOutput<typeof managedUserSearchFieldSchema>;
export type ManagedUserSort = v.InferOutput<typeof managedUserSortSchema>;
export type ManagedUserStatusFilter = v.InferOutput<typeof managedUserStatusFilterSchema>;
