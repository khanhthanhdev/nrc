import { describe, expect, it } from "vitest";

import {
  createStaffRoleEmailConfig,
  resolveStaffRoleAssignmentForEmail,
} from "./staff-role-policy.js";

describe("resolveStaffRoleAssignmentForEmail", () => {
  it("resolves admin emails case-insensitively", () => {
    const config = createStaffRoleEmailConfig({
      adminEmail: " Admin@Example.com ",
      managerEmail: null,
    });

    expect(resolveStaffRoleAssignmentForEmail("admin@example.com", config)).toEqual({
      systemRole: "ADMIN",
      userType: "STAFF",
    });
  });

  it("resolves manager emails from comma-separated allowlists", () => {
    const config = createStaffRoleEmailConfig({
      adminEmail: null,
      managerEmail: "first@example.com, MANAGER@example.com",
    });

    expect(resolveStaffRoleAssignmentForEmail("manager@example.com", config)).toEqual({
      systemRole: "MANAGER",
      userType: "STAFF",
    });
  });

  it("gives admin precedence when an email appears in both allowlists", () => {
    const config = createStaffRoleEmailConfig({
      adminEmail: "staff@example.com",
      managerEmail: "staff@example.com",
    });

    expect(resolveStaffRoleAssignmentForEmail("staff@example.com", config)).toEqual({
      systemRole: "ADMIN",
      userType: "STAFF",
    });
  });

  it("returns null for emails outside the allowlists", () => {
    const config = createStaffRoleEmailConfig({
      adminEmail: "admin@example.com",
      managerEmail: "manager@example.com",
    });

    expect(resolveStaffRoleAssignmentForEmail("user@example.com", config)).toBeNull();
  });

  it("ignores blank allowlist entries and invalid lookup values", () => {
    const config = createStaffRoleEmailConfig({
      adminEmail: "admin@example.com, ,",
      managerEmail: undefined,
    });

    expect(resolveStaffRoleAssignmentForEmail("", config)).toBeNull();
    expect(resolveStaffRoleAssignmentForEmail(null, config)).toBeNull();
  });
});
