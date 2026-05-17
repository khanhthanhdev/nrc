import { describe, expect, it } from "vitest";

import {
  SEASON_PATTERN,
  EVENT_ID_PATTERN,
  MATCH_NUMBER_PATTERN,
  REGISTRATION_ID_PATTERN,
  isValidSeason,
  isValidEventId,
  isValidRegistrationId,
  isValidMatchNumber,
  isStaffSystemRole,
  isAdminSystemRole,
  getSystemRole,
  canWriteRegistration,
  canReadRegistration,
  canManageTeam,
  canInviteToTeam,
  canRemoveMember,
} from "./route-policy";

// ── Pattern constants ──────────────────────────────────────────────────

describe("SEASON_PATTERN", () => {
  it("matches 4-digit years", () => {
    expect(SEASON_PATTERN.test("2026")).toBe(true);
    expect(SEASON_PATTERN.test("1999")).toBe(true);
  });

  it("rejects non-4-digit strings", () => {
    expect(SEASON_PATTERN.test("26")).toBe(false);
    expect(SEASON_PATTERN.test("20260")).toBe(false);
    expect(SEASON_PATTERN.test("abcd")).toBe(false);
    expect(SEASON_PATTERN.test("")).toBe(false);
  });
});

describe("EVENT_ID_PATTERN", () => {
  it("accepts valid event IDs", () => {
    expect(EVENT_ID_PATTERN.test("HANOI")).toBe(true);
    expect(EVENT_ID_PATTERN.test("HCM-2026")).toBe(true);
    expect(EVENT_ID_PATTERN.test("A1")).toBe(true);
  });

  it("rejects invalid event IDs", () => {
    expect(EVENT_ID_PATTERN.test("")).toBe(false);
    expect(EVENT_ID_PATTERN.test("a")).toBe(false); // must start with uppercase/digit
    expect(EVENT_ID_PATTERN.test("-BAD")).toBe(false); // must start with alphanumeric
    expect(EVENT_ID_PATTERN.test("A")).toBe(false); // too short (min 2 chars)
  });
});

describe("MATCH_NUMBER_PATTERN", () => {
  it("accepts positive integers", () => {
    expect(MATCH_NUMBER_PATTERN.test("1")).toBe(true);
    expect(MATCH_NUMBER_PATTERN.test("42")).toBe(true);
    expect(MATCH_NUMBER_PATTERN.test("100")).toBe(true);
  });

  it("rejects zero and negative numbers", () => {
    expect(MATCH_NUMBER_PATTERN.test("0")).toBe(false);
    expect(MATCH_NUMBER_PATTERN.test("-1")).toBe(false);
  });

  it("rejects leading zeros", () => {
    expect(MATCH_NUMBER_PATTERN.test("01")).toBe(false);
    expect(MATCH_NUMBER_PATTERN.test("007")).toBe(false);
  });
});

describe("REGISTRATION_ID_PATTERN", () => {
  it("accepts valid registration IDs", () => {
    expect(REGISTRATION_ID_PATTERN.test("abc123")).toBe(true);
    expect(REGISTRATION_ID_PATTERN.test("reg_123-456")).toBe(true);
    expect(REGISTRATION_ID_PATTERN.test("A".repeat(64))).toBe(true);
  });

  it("rejects too-short IDs", () => {
    expect(REGISTRATION_ID_PATTERN.test("abc")).toBe(false);
    expect(REGISTRATION_ID_PATTERN.test("12345")).toBe(false);
  });

  it("rejects too-long IDs", () => {
    expect(REGISTRATION_ID_PATTERN.test("A".repeat(65))).toBe(false);
  });

  it("rejects invalid characters", () => {
    expect(REGISTRATION_ID_PATTERN.test("abc@123")).toBe(false);
    expect(REGISTRATION_ID_PATTERN.test("abc 123")).toBe(false);
  });
});

// ── Validation functions ───────────────────────────────────────────────

describe("isValidSeason", () => {
  it("returns true for valid seasons", () => {
    expect(isValidSeason("2026")).toBe(true);
    expect(isValidSeason("2025")).toBe(true);
  });

  it("returns false for invalid seasons", () => {
    expect(isValidSeason("26")).toBe(false);
    expect(isValidSeason("abc")).toBe(false);
    expect(isValidSeason("")).toBe(false);
  });
});

describe("isValidEventId", () => {
  it("returns true for valid event IDs", () => {
    expect(isValidEventId("HANOI")).toBe(true);
    expect(isValidEventId("HCM-2026")).toBe(true);
  });

  it("returns false for invalid event IDs", () => {
    expect(isValidEventId("a")).toBe(false);
    expect(isValidEventId("")).toBe(false);
  });
});

describe("isValidRegistrationId", () => {
  it("returns true for valid registration IDs", () => {
    expect(isValidRegistrationId("abc123")).toBe(true);
    expect(isValidRegistrationId("reg_123")).toBe(true);
  });

  it("returns false for invalid registration IDs", () => {
    expect(isValidRegistrationId("abc")).toBe(false);
    expect(isValidRegistrationId("")).toBe(false);
  });
});

describe("isValidMatchNumber", () => {
  it("returns true for valid match numbers", () => {
    expect(isValidMatchNumber("1")).toBe(true);
    expect(isValidMatchNumber("42")).toBe(true);
  });

  it("returns false for invalid match numbers", () => {
    expect(isValidMatchNumber("0")).toBe(false);
    expect(isValidMatchNumber("abc")).toBe(false);
    expect(isValidMatchNumber("")).toBe(false);
  });
});

// ── System role functions ──────────────────────────────────────────────

describe("isStaffSystemRole", () => {
  it("returns true for MANAGER and ADMIN", () => {
    expect(isStaffSystemRole("MANAGER")).toBe(true);
    expect(isStaffSystemRole("ADMIN")).toBe(true);
  });

  it("returns false for USER", () => {
    expect(isStaffSystemRole("USER")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isStaffSystemRole(null)).toBe(false);
    expect(isStaffSystemRole(undefined)).toBe(false);
  });
});

describe("isAdminSystemRole", () => {
  it("returns true for ADMIN", () => {
    expect(isAdminSystemRole("ADMIN")).toBe(true);
  });

  it("returns false for MANAGER and USER", () => {
    expect(isAdminSystemRole("MANAGER")).toBe(false);
    expect(isAdminSystemRole("USER")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isAdminSystemRole(null)).toBe(false);
    expect(isAdminSystemRole(undefined)).toBe(false);
  });
});

describe("getSystemRole", () => {
  it("extracts systemRole from session", () => {
    expect(getSystemRole({ user: { systemRole: "ADMIN" } } as any)).toBe("ADMIN");
    expect(getSystemRole({ user: { systemRole: "MANAGER" } } as any)).toBe("MANAGER");
    expect(getSystemRole({ user: { systemRole: "USER" } } as any)).toBe("USER");
  });

  it("returns undefined for missing session or user", () => {
    expect(getSystemRole(null)).toBeUndefined();
    expect(getSystemRole(undefined)).toBeUndefined();
    expect(getSystemRole({} as any)).toBeUndefined();
    expect(getSystemRole({ user: {} } as any)).toBeUndefined();
  });
});

// ── Permission functions ───────────────────────────────────────────────

describe("canWriteRegistration", () => {
  it("allows staff roles regardless of membership", () => {
    expect(canWriteRegistration({ systemRole: "ADMIN" })).toBe(true);
    expect(canWriteRegistration({ systemRole: "MANAGER" })).toBe(true);
  });

  it("allows TEAM_MENTOR", () => {
    expect(canWriteRegistration({ membershipRole: "TEAM_MENTOR" })).toBe(true);
  });

  it("denies TEAM_LEADER and TEAM_MEMBER", () => {
    expect(canWriteRegistration({ membershipRole: "TEAM_LEADER" })).toBe(false);
    expect(canWriteRegistration({ membershipRole: "TEAM_MEMBER" })).toBe(false);
  });

  it("denies when no roles provided", () => {
    expect(canWriteRegistration({})).toBe(false);
    expect(canWriteRegistration({ membershipRole: null, systemRole: null })).toBe(false);
  });
});

describe("canReadRegistration", () => {
  it("allows staff roles regardless of membership", () => {
    expect(canReadRegistration({ systemRole: "ADMIN" })).toBe(true);
    expect(canReadRegistration({ systemRole: "MANAGER" })).toBe(true);
  });

  it("allows any team member", () => {
    expect(canReadRegistration({ membershipRole: "TEAM_MENTOR" })).toBe(true);
    expect(canReadRegistration({ membershipRole: "TEAM_LEADER" })).toBe(true);
    expect(canReadRegistration({ membershipRole: "TEAM_MEMBER" })).toBe(true);
  });

  it("denies when no roles provided", () => {
    expect(canReadRegistration({})).toBe(false);
    expect(canReadRegistration({ membershipRole: null, systemRole: null })).toBe(false);
  });
});

describe("canManageTeam", () => {
  it("allows TEAM_MENTOR and TEAM_LEADER", () => {
    expect(canManageTeam("TEAM_MENTOR")).toBe(true);
    expect(canManageTeam("TEAM_LEADER")).toBe(true);
  });

  it("denies TEAM_MEMBER", () => {
    expect(canManageTeam("TEAM_MEMBER")).toBe(false);
  });

  it("denies null/undefined", () => {
    expect(canManageTeam(null)).toBe(false);
    expect(canManageTeam(undefined)).toBe(false);
  });
});

describe("canInviteToTeam", () => {
  it("allows TEAM_MENTOR and TEAM_LEADER", () => {
    expect(canInviteToTeam("TEAM_MENTOR")).toBe(true);
    expect(canInviteToTeam("TEAM_LEADER")).toBe(true);
  });

  it("denies TEAM_MEMBER", () => {
    expect(canInviteToTeam("TEAM_MEMBER")).toBe(false);
  });

  it("denies null/undefined", () => {
    expect(canInviteToTeam(null)).toBe(false);
    expect(canInviteToTeam(undefined)).toBe(false);
  });
});

describe("canRemoveMember", () => {
  it("allows only TEAM_MENTOR", () => {
    expect(canRemoveMember("TEAM_MENTOR")).toBe(true);
  });

  it("denies TEAM_LEADER and TEAM_MEMBER", () => {
    expect(canRemoveMember("TEAM_LEADER")).toBe(false);
    expect(canRemoveMember("TEAM_MEMBER")).toBe(false);
  });

  it("denies null/undefined", () => {
    expect(canRemoveMember(null)).toBe(false);
    expect(canRemoveMember(undefined)).toBe(false);
  });
});
