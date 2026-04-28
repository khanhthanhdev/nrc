import { describe, expect, it } from "vitest";
import * as v from "valibot";

import {
  createTeamInputSchema,
  getPublicTeamInputSchema,
  inviteTeamMemberInputSchema,
  listPublicTeamsInputSchema,
  listTeamInvitationsInputSchema,
  listTeamMembersInputSchema,
  removeTeamMemberInputSchema,
  revokeTeamInvitationInputSchema,
  updateTeamProfileInputSchema,
} from "./team";

const validInput = {
  cityOrProvince: "Da Nang",
  description: "Rookie robotics team",
  name: "NRC Alpha",
  schoolOrOrganization: "NRC School",
  termsAccepted: true as const,
};

describe("createTeamInputSchema", () => {
  it("accepts valid team creation input", () => {
    const result = v.safeParse(createTeamInputSchema, validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with optional fields omitted", () => {
    const result = v.safeParse(createTeamInputSchema, {
      name: "NRC Alpha",
      termsAccepted: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects team creation when termsAccepted is false", () => {
    const result = v.safeParse(createTeamInputSchema, {
      ...validInput,
      termsAccepted: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects names shorter than 2 characters", () => {
    const result = v.safeParse(createTeamInputSchema, {
      ...validInput,
      name: "A",
    });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only fields after trim", () => {
    const result = v.safeParse(createTeamInputSchema, {
      ...validInput,
      cityOrProvince: "   ",
      name: "   ",
      schoolOrOrganization: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects descriptions longer than 2000 characters", () => {
    const result = v.safeParse(createTeamInputSchema, {
      ...validInput,
      description: "A".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("getPublicTeamInputSchema", () => {
  it("accepts a five-digit team number", () => {
    const result = v.safeParse(getPublicTeamInputSchema, {
      teamNumber: "02323",
    });

    expect(result.success).toBe(true);
  });

  it("rejects team numbers that contain non-digit characters", () => {
    const result = v.safeParse(getPublicTeamInputSchema, {
      teamNumber: "12A45",
    });

    expect(result.success).toBe(false);
  });

  it("rejects team numbers that are not exactly five digits", () => {
    const tooShort = v.safeParse(getPublicTeamInputSchema, {
      teamNumber: "1234",
    });
    const tooLong = v.safeParse(getPublicTeamInputSchema, {
      teamNumber: "123456",
    });

    expect(tooShort.success).toBe(false);
    expect(tooLong.success).toBe(false);
  });
});

describe("listPublicTeamsInputSchema", () => {
  it("applies pagination defaults", () => {
    const result = v.safeParse(listPublicTeamsInputSchema, {});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toEqual({
        limit: 20,
        page: 1,
      });
    }
  });

  it("trims search text and accepts valid pagination", () => {
    const result = v.safeParse(listPublicTeamsInputSchema, {
      limit: 10,
      page: 2,
      search: "  Alpha  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toEqual({
        limit: 10,
        page: 2,
        search: "Alpha",
      });
    }
  });

  it("rejects invalid pagination values", () => {
    const result = v.safeParse(listPublicTeamsInputSchema, {
      limit: 101,
      page: 0,
    });

    expect(result.success).toBe(false);
  });
});

describe("updateTeamProfileInputSchema", () => {
  it("accepts profile fields and nullable media fields", () => {
    const result = v.safeParse(updateTeamProfileInputSchema, {
      avatarUrl: null,
      cityOrProvince: "  Da Nang  ",
      coverImageUrl: null,
      description: "  Updated profile  ",
      name: "  NRC Alpha Prime  ",
      schoolOrOrganization: "  NRC School  ",
      teamId: "  team-1  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toEqual({
        avatarUrl: null,
        cityOrProvince: "Da Nang",
        coverImageUrl: null,
        description: "Updated profile",
        name: "NRC Alpha Prime",
        schoolOrOrganization: "NRC School",
        teamId: "team-1",
      });
    }
  });

  it("rejects blank team ids and short names", () => {
    const result = v.safeParse(updateTeamProfileInputSchema, {
      name: "A",
      teamId: "   ",
    });

    expect(result.success).toBe(false);
  });
});

describe("inviteTeamMemberInputSchema", () => {
  it("accepts a team leader invitation", () => {
    const result = v.safeParse(inviteTeamMemberInputSchema, {
      email: "  student@example.com  ",
      role: "TEAM_LEADER",
      teamId: " team-1 ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toEqual({
        email: "student@example.com",
        role: "TEAM_LEADER",
        teamId: "team-1",
      });
    }
  });

  it("rejects invalid emails and unsupported roles", () => {
    const result = v.safeParse(inviteTeamMemberInputSchema, {
      email: "not-an-email",
      role: "TEAM_MENTOR",
      teamId: "team-1",
    });

    expect(result.success).toBe(false);
  });
});

describe("team id input schemas", () => {
  it("accept team scoped ids", () => {
    expect(v.safeParse(listTeamInvitationsInputSchema, { teamId: "team-1" }).success).toBe(true);
    expect(v.safeParse(listTeamMembersInputSchema, { teamId: "team-1" }).success).toBe(true);
    expect(
      v.safeParse(revokeTeamInvitationInputSchema, { invitationId: "invitation-1" }).success,
    ).toBe(true);
    expect(v.safeParse(removeTeamMemberInputSchema, { membershipId: "membership-1" }).success).toBe(
      true,
    );
  });

  it("reject blank ids", () => {
    expect(v.safeParse(listTeamInvitationsInputSchema, { teamId: "   " }).success).toBe(false);
    expect(v.safeParse(listTeamMembersInputSchema, { teamId: "   " }).success).toBe(false);
    expect(v.safeParse(revokeTeamInvitationInputSchema, { invitationId: "   " }).success).toBe(
      false,
    );
    expect(v.safeParse(removeTeamMemberInputSchema, { membershipId: "   " }).success).toBe(false);
  });
});
