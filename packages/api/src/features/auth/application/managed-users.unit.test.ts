import { describe, expect, it } from "vitest";

import { resolvePersistedRoleState } from "./managed-users.js";

describe("resolvePersistedRoleState", () => {
  // ── Admin promotion ─────────────────────────────────────────────────

  it("promotes to ADMIN with STAFF userType regardless of current userType", () => {
    expect(resolvePersistedRoleState({ currentUserType: "PARTICIPANT", targetSystemRole: "ADMIN" })).toEqual({
      systemRole: "ADMIN",
      userType: "STAFF",
    });
  });

  it("promotes to ADMIN from MENTOR", () => {
    expect(resolvePersistedRoleState({ currentUserType: "MENTOR", targetSystemRole: "ADMIN" })).toEqual({
      systemRole: "ADMIN",
      userType: "STAFF",
    });
  });

  it("promotes to ADMIN from STAFF", () => {
    expect(resolvePersistedRoleState({ currentUserType: "STAFF", targetSystemRole: "ADMIN" })).toEqual({
      systemRole: "ADMIN",
      userType: "STAFF",
    });
  });

  it("promotes to ADMIN with no currentUserType", () => {
    expect(resolvePersistedRoleState({ targetSystemRole: "ADMIN" })).toEqual({
      systemRole: "ADMIN",
      userType: "STAFF",
    });
  });

  // ── Manager promotion ───────────────────────────────────────────────

  it("promotes to MANAGER with STAFF userType", () => {
    expect(resolvePersistedRoleState({ currentUserType: "PARTICIPANT", targetSystemRole: "MANAGER" })).toEqual({
      systemRole: "MANAGER",
      userType: "STAFF",
    });
  });

  it("promotes to MANAGER from MENTOR", () => {
    expect(resolvePersistedRoleState({ currentUserType: "MENTOR", targetSystemRole: "MANAGER" })).toEqual({
      systemRole: "MANAGER",
      userType: "STAFF",
    });
  });

  // ── USER demotion ───────────────────────────────────────────────────

  it("keeps PARTICIPANT userType when target is USER", () => {
    expect(resolvePersistedRoleState({ currentUserType: "PARTICIPANT", targetSystemRole: "USER" })).toEqual({
      systemRole: "USER",
      userType: "PARTICIPANT",
    });
  });

  it("keeps MENTOR userType when target is USER", () => {
    expect(resolvePersistedRoleState({ currentUserType: "MENTOR", targetSystemRole: "USER" })).toEqual({
      systemRole: "USER",
      userType: "MENTOR",
    });
  });

  it("falls back to PARTICIPANT when demoting STAFF to USER", () => {
    expect(resolvePersistedRoleState({ currentUserType: "STAFF", targetSystemRole: "USER" })).toEqual({
      systemRole: "USER",
      userType: "PARTICIPANT",
    });
  });

  it("defaults to PARTICIPANT when no currentUserType and target is USER", () => {
    expect(resolvePersistedRoleState({ targetSystemRole: "USER" })).toEqual({
      systemRole: "USER",
      userType: "PARTICIPANT",
    });
  });

  it("defaults to PARTICIPANT when currentUserType is null", () => {
    expect(resolvePersistedRoleState({ currentUserType: null, targetSystemRole: "USER" })).toEqual({
      systemRole: "USER",
      userType: "PARTICIPANT",
    });
  });

  it("defaults to PARTICIPANT when currentUserType is undefined", () => {
    expect(resolvePersistedRoleState({ currentUserType: undefined, targetSystemRole: "USER" })).toEqual({
      systemRole: "USER",
      userType: "PARTICIPANT",
    });
  });

  // ── Roundtrip scenarios ─────────────────────────────────────────────

  it("promotes PARTICIPANT → STAFF/MANAGER → USER/PARTICIPANT", () => {
    const promoted = resolvePersistedRoleState({ currentUserType: "PARTICIPANT", targetSystemRole: "MANAGER" });
    expect(promoted.userType).toBe("STAFF");

    const demoted = resolvePersistedRoleState({ currentUserType: "STAFF", targetSystemRole: "USER" });
    expect(demoted.userType).toBe("PARTICIPANT");
  });

  it("promotes PARTICIPANT → STAFF/ADMIN → USER/PARTICIPANT", () => {
    const promoted = resolvePersistedRoleState({ currentUserType: "PARTICIPANT", targetSystemRole: "ADMIN" });
    expect(promoted.userType).toBe("STAFF");

    const demoted = resolvePersistedRoleState({ currentUserType: "STAFF", targetSystemRole: "USER" });
    expect(demoted.userType).toBe("PARTICIPANT");
  });

  it("promotes MENTOR → STAFF/ADMIN → USER/MENTOR", () => {
    const promoted = resolvePersistedRoleState({ currentUserType: "MENTOR", targetSystemRole: "ADMIN" });
    expect(promoted.userType).toBe("STAFF");

    const demoted = resolvePersistedRoleState({ currentUserType: "STAFF", targetSystemRole: "USER" });
    expect(demoted.userType).toBe("PARTICIPANT");
  });
});
