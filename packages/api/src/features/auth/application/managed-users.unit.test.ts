import { describe, expect, it } from "vitest";

import { resolvePersistedRoleState } from "./managed-users.js";

describe("resolvePersistedRoleState", () => {
  it("keeps participant users as non-staff when the target role is USER", () => {
    expect(
      resolvePersistedRoleState({
        currentUserType: "PARTICIPANT",
        targetSystemRole: "USER",
      }),
    ).toEqual({
      systemRole: "USER",
      userType: "PARTICIPANT",
    });
  });

  it("keeps mentor users as non-staff when the target role is USER", () => {
    expect(
      resolvePersistedRoleState({
        currentUserType: "MENTOR",
        targetSystemRole: "USER",
      }),
    ).toEqual({
      systemRole: "USER",
      userType: "MENTOR",
    });
  });

  it("promotes users to STAFF when the target role is MANAGER", () => {
    expect(
      resolvePersistedRoleState({
        currentUserType: "PARTICIPANT",
        targetSystemRole: "MANAGER",
      }),
    ).toEqual({
      systemRole: "MANAGER",
      userType: "STAFF",
    });
  });

  it("promotes users to STAFF when the target role is ADMIN", () => {
    expect(
      resolvePersistedRoleState({
        currentUserType: "MENTOR",
        targetSystemRole: "ADMIN",
      }),
    ).toEqual({
      systemRole: "ADMIN",
      userType: "STAFF",
    });
  });

  it("falls back to PARTICIPANT when demoting a staff account to USER", () => {
    expect(
      resolvePersistedRoleState({
        currentUserType: "STAFF",
        targetSystemRole: "USER",
      }),
    ).toEqual({
      systemRole: "USER",
      userType: "PARTICIPANT",
    });
  });

  it("defaults new USER accounts to PARTICIPANT", () => {
    expect(
      resolvePersistedRoleState({
        targetSystemRole: "USER",
      }),
    ).toEqual({
      systemRole: "USER",
      userType: "PARTICIPANT",
    });
  });
});
