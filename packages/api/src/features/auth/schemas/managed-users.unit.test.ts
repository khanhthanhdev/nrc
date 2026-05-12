import { describe, expect, it } from "vitest";
import * as v from "valibot";

import {
  createManagedUserInputSchema,
  getManagedUserInputSchema,
  getManagedUsersInputSchema,
  managedUserRoleFilterSchema,
  managedUserSearchFieldSchema,
  managedUserSortSchema,
  managedUserStatusFilterSchema,
  managedUserSystemRoleSchema,
  saveManagedUserInputSchema,
} from "./managed-users.js";

describe("managedUserSystemRoleSchema", () => {
  it.each(["USER", "MANAGER", "ADMIN"] as const)("accepts %s", (role) => {
    expect(v.safeParse(managedUserSystemRoleSchema, role).success).toBe(true);
  });

  it("rejects invalid roles", () => {
    expect(v.safeParse(managedUserSystemRoleSchema, "SUPERADMIN").success).toBe(false);
    expect(v.safeParse(managedUserSystemRoleSchema, "").success).toBe(false);
    expect(v.safeParse(managedUserSystemRoleSchema, null).success).toBe(false);
  });
});

describe("managedUserSearchFieldSchema", () => {
  it.each(["email", "name"] as const)("accepts %s", (field) => {
    expect(v.safeParse(managedUserSearchFieldSchema, field).success).toBe(true);
  });

  it("rejects invalid search fields", () => {
    expect(v.safeParse(managedUserSearchFieldSchema, "phone").success).toBe(false);
  });
});

describe("managedUserStatusFilterSchema", () => {
  it.each(["all", "active", "banned"] as const)("accepts %s", (status) => {
    expect(v.safeParse(managedUserStatusFilterSchema, status).success).toBe(true);
  });

  it("rejects invalid status filters", () => {
    expect(v.safeParse(managedUserStatusFilterSchema, "inactive").success).toBe(false);
  });
});

describe("managedUserSortSchema", () => {
  it.each(["newest", "updated", "name", "email"] as const)("accepts %s", (sort) => {
    expect(v.safeParse(managedUserSortSchema, sort).success).toBe(true);
  });

  it("rejects invalid sort values", () => {
    expect(v.safeParse(managedUserSortSchema, "oldest").success).toBe(false);
  });
});

describe("managedUserRoleFilterSchema", () => {
  it.each(["all", "USER", "MANAGER", "ADMIN"] as const)("accepts %s", (role) => {
    expect(v.safeParse(managedUserRoleFilterSchema, role).success).toBe(true);
  });

  it("rejects invalid role filters", () => {
    expect(v.safeParse(managedUserRoleFilterSchema, "STAFF").success).toBe(false);
  });
});

describe("getManagedUsersInputSchema", () => {
  it("accepts valid input with all fields", () => {
    const result = v.safeParse(getManagedUsersInputSchema, {
      includeExampleAccounts: true,
      page: 1,
      pageSize: 20,
      roleFilter: "ADMIN",
      searchField: "email",
      searchValue: "admin@example.com",
      sort: "newest",
      statusFilter: "active",
    });

    expect(result.success).toBe(true);
  });

  it("accepts input without optional searchValue", () => {
    const result = v.safeParse(getManagedUsersInputSchema, {
      includeExampleAccounts: false,
      page: 1,
      pageSize: 50,
      roleFilter: "all",
      searchField: "name",
      sort: "name",
      statusFilter: "all",
    });

    expect(result.success).toBe(true);
  });

  it("rejects page less than 1", () => {
    const result = v.safeParse(getManagedUsersInputSchema, {
      includeExampleAccounts: false,
      page: 0,
      pageSize: 20,
      roleFilter: "all",
      searchField: "email",
      sort: "newest",
      statusFilter: "all",
    });

    expect(result.success).toBe(false);
  });

  it("rejects pageSize greater than 100", () => {
    const result = v.safeParse(getManagedUsersInputSchema, {
      includeExampleAccounts: false,
      page: 1,
      pageSize: 101,
      roleFilter: "all",
      searchField: "email",
      sort: "newest",
      statusFilter: "all",
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer page", () => {
    const result = v.safeParse(getManagedUsersInputSchema, {
      includeExampleAccounts: false,
      page: 1.5,
      pageSize: 20,
      roleFilter: "all",
      searchField: "email",
      sort: "newest",
      statusFilter: "all",
    });

    expect(result.success).toBe(false);
  });

  it("trims searchValue", () => {
    const result = v.parse(getManagedUsersInputSchema, {
      includeExampleAccounts: false,
      page: 1,
      pageSize: 20,
      roleFilter: "all",
      searchField: "email",
      searchValue: "  admin@example.com  ",
      sort: "newest",
      statusFilter: "all",
    });

    expect(result.searchValue).toBe("admin@example.com");
  });

  it("rejects searchValue exceeding max length", () => {
    const result = v.safeParse(getManagedUsersInputSchema, {
      includeExampleAccounts: false,
      page: 1,
      pageSize: 20,
      roleFilter: "all",
      searchField: "email",
      searchValue: "a".repeat(256),
      sort: "newest",
      statusFilter: "all",
    });

    expect(result.success).toBe(false);
  });
});

describe("createManagedUserInputSchema", () => {
  it("accepts valid user creation input", () => {
    const result = v.safeParse(createManagedUserInputSchema, {
      email: "newuser@example.com",
      name: "New User",
      password: "SecurePass123!",
      systemRole: "USER",
    });

    expect(result.success).toBe(true);
  });

  it("trims email and name", () => {
    const result = v.parse(createManagedUserInputSchema, {
      email: "  newuser@example.com  ",
      name: "  New User  ",
      password: "SecurePass123!",
      systemRole: "USER",
    });

    expect(result.email).toBe("newuser@example.com");
    expect(result.name).toBe("New User");
  });

  it("rejects invalid email format", () => {
    const result = v.safeParse(createManagedUserInputSchema, {
      email: "not-an-email",
      name: "New User",
      password: "SecurePass123!",
      systemRole: "USER",
    });

    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = v.safeParse(createManagedUserInputSchema, {
      email: "newuser@example.com",
      name: "New User",
      password: "short",
      systemRole: "USER",
    });

    expect(result.success).toBe(false);
  });

  it("rejects password longer than 128 characters", () => {
    const result = v.safeParse(createManagedUserInputSchema, {
      email: "newuser@example.com",
      name: "New User",
      password: "a".repeat(129),
      systemRole: "USER",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty name after trim", () => {
    const result = v.safeParse(createManagedUserInputSchema, {
      email: "newuser@example.com",
      name: "   ",
      password: "SecurePass123!",
      systemRole: "USER",
    });

    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 255 characters", () => {
    const result = v.safeParse(createManagedUserInputSchema, {
      email: "newuser@example.com",
      name: "a".repeat(256),
      password: "SecurePass123!",
      systemRole: "USER",
    });

    expect(result.success).toBe(false);
  });
});

describe("saveManagedUserInputSchema", () => {
  it("accepts valid save input", () => {
    const result = v.safeParse(saveManagedUserInputSchema, {
      name: "Updated Name",
      systemRole: "MANAGER",
      userId: "user-123",
    });

    expect(result.success).toBe(true);
  });

  it("trims name and userId", () => {
    const result = v.parse(saveManagedUserInputSchema, {
      name: "  Updated Name  ",
      systemRole: "ADMIN",
      userId: "  user-123  ",
    });

    expect(result.name).toBe("Updated Name");
    expect(result.userId).toBe("user-123");
  });

  it("rejects blank name", () => {
    const result = v.safeParse(saveManagedUserInputSchema, {
      name: "   ",
      systemRole: "USER",
      userId: "user-123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects blank userId", () => {
    const result = v.safeParse(saveManagedUserInputSchema, {
      name: "Updated Name",
      systemRole: "USER",
      userId: "   ",
    });

    expect(result.success).toBe(false);
  });
});

describe("getManagedUserInputSchema", () => {
  it("accepts valid userId", () => {
    const result = v.safeParse(getManagedUserInputSchema, {
      userId: "user-123",
    });

    expect(result.success).toBe(true);
  });

  it("trims userId", () => {
    const result = v.parse(getManagedUserInputSchema, {
      userId: "  user-123  ",
    });

    expect(result.userId).toBe("user-123");
  });

  it("rejects blank userId", () => {
    const result = v.safeParse(getManagedUserInputSchema, {
      userId: "   ",
    });

    expect(result.success).toBe(false);
  });
});
