import { describe, expect, it } from "vitest";

import {
  normalizeEmailForLookup,
  shouldBlockCredentialSignUpForGoogleOnlyAccount,
} from "./duplicate-email-policy";
import { resolveStaffRoleAssignmentForEmail } from "./staff-role-policy";

describe("normalizeEmailForLookup", () => {
  it("returns lowercase trimmed email", () => {
    expect(normalizeEmailForLookup("  USER@Example.COM  ")).toBe("user@example.com");
  });

  it("returns null for empty string-like values", () => {
    expect(normalizeEmailForLookup("   ")).toBeNull();
  });

  it("returns null for non-string values", () => {
    expect(normalizeEmailForLookup(null)).toBeNull();
    expect(normalizeEmailForLookup()).toBeNull();
    expect(normalizeEmailForLookup(123)).toBeNull();
  });
});

describe("shouldBlockCredentialSignUpForGoogleOnlyAccount", () => {
  it("blocks when account has google provider but no credential provider", () => {
    expect(
      shouldBlockCredentialSignUpForGoogleOnlyAccount([
        { providerId: "google" },
        { providerId: "github" },
      ]),
    ).toBe(true);
  });

  it("does not block when credential provider exists", () => {
    expect(
      shouldBlockCredentialSignUpForGoogleOnlyAccount([
        { providerId: "google" },
        { providerId: "credential" },
      ]),
    ).toBe(false);
  });

  it("does not block when google provider is absent", () => {
    expect(
      shouldBlockCredentialSignUpForGoogleOnlyAccount([
        { providerId: "credential" },
        { providerId: "github" },
      ]),
    ).toBe(false);
  });
});

describe("resolveStaffRoleAssignmentForEmail", () => {
  it("returns admin assignment for the configured admin email", () => {
    expect(
      resolveStaffRoleAssignmentForEmail(" Admin2@Example.com ", {
        adminEmail: "admin@example.com, admin2@example.com",
        managerEmail: "manager@example.com",
      }),
    ).toEqual({
      systemRole: "ADMIN",
      userType: "STAFF",
    });
  });

  it("returns manager assignment for the configured manager email", () => {
    expect(
      resolveStaffRoleAssignmentForEmail("manager2@example.com", {
        adminEmail: "admin@example.com",
        managerEmail: "manager@example.com, manager2@example.com",
      }),
    ).toEqual({
      systemRole: "MANAGER",
      userType: "STAFF",
    });
  });

  it("prefers admin when both env values match the same email", () => {
    expect(
      resolveStaffRoleAssignmentForEmail("staff@example.com", {
        adminEmail: "staff@example.com",
        managerEmail: "staff@example.com",
      }),
    ).toEqual({
      systemRole: "ADMIN",
      userType: "STAFF",
    });
  });

  it("returns null for non-matching emails", () => {
    expect(
      resolveStaffRoleAssignmentForEmail("user@example.com", {
        adminEmail: "admin@example.com",
        managerEmail: "manager@example.com",
      }),
    ).toBeNull();
  });

  it("ignores empty entries in comma-separated lists", () => {
    expect(
      resolveStaffRoleAssignmentForEmail("staff@example.com", {
        adminEmail: " , staff@example.com, ",
        managerEmail: " , ",
      }),
    ).toEqual({
      systemRole: "ADMIN",
      userType: "STAFF",
    });
  });
});
