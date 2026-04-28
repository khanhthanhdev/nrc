import type { RouterClient } from "@orpc/server";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppRouter } from "../../../app-router";
import type { AuthContextSession } from "../../../shared/context";
import type {
  PublicTeamProfile,
  PublicTeamSummary,
  TeamInvitationRecord,
  TeamMemberRecord,
  TeamSummary,
} from "../application/team";
import type { CreateTeamInput } from "../schemas/team";

const TEST_ENV_DEFAULTS = {
  BETTER_AUTH_SECRET: "test",
  BETTER_AUTH_URL: "http://localhost",
  CORS_ORIGIN: "http://localhost",
  DATABASE_URL: "postgresql://localhost/test",
  GOOGLE_CLIENT_ID: "test",
  GOOGLE_CLIENT_SECRET: "test",
} as const;

for (const [key, value] of Object.entries(TEST_ENV_DEFAULTS)) {
  process.env[key] ??= value;
}

const createTeamForUserMock = vi.fn();
const getPublicTeamByTeamNumberMock = vi.fn();
const getMyTeamByUserMock = vi.fn();
const inviteTeamMemberMock = vi.fn();
const listPublicTeamsMock = vi.fn();
const listTeamInvitationsMock = vi.fn();
const listTeamMembersMock = vi.fn();
const removeTeamMemberMock = vi.fn();
const revokeTeamInvitationMock = vi.fn();
const updateTeamProfileMock = vi.fn();

vi.mock("../application/team.js", () => ({
  createTeamForUser: createTeamForUserMock,
  getPublicTeamByTeamNumber: getPublicTeamByTeamNumberMock,
  getMyTeamByUser: getMyTeamByUserMock,
  inviteTeamMember: inviteTeamMemberMock,
  listPublicTeams: listPublicTeamsMock,
  listTeamInvitations: listTeamInvitationsMock,
  listTeamMembers: listTeamMembersMock,
  removeTeamMember: removeTeamMemberMock,
  revokeTeamInvitation: revokeTeamInvitationMock,
  updateTeamProfile: updateTeamProfileMock,
}));

const { appRouter } = await import("../../../app-router.js");

const TEST_SESSION: AuthContextSession = {
  session: {
    activeOrganizationId: "organization-1",
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    id: "session-1",
    userId: "user-1",
  },
  user: {
    email: "mentor@example.com",
    emailVerified: true,
    id: "user-1",
    name: "Mentor User",
  },
};

const VALID_CREATE_TEAM_INPUT: CreateTeamInput = {
  cityOrProvince: "Da Nang",
  description: "Rookie robotics team",
  name: "NRC Alpha",
  schoolOrOrganization: "NRC School",
  termsAccepted: true,
};

const TEAM_SUMMARY: TeamSummary = {
  cityOrProvince: "Da Nang",
  description: "Rookie robotics team",
  id: "team-1",
  membershipRole: "TEAM_MENTOR",
  name: "NRC Alpha",
  organizationId: "organization-1",
  schoolOrOrganization: "NRC School",
  teamNumber: "02323",
};

const PUBLIC_TEAM_SUMMARY: PublicTeamSummary = {
  avatarUrl: "https://example.com/avatar.png",
  cityOrProvince: "Da Nang",
  description: "Rookie robotics team",
  id: "team-1",
  name: "NRC Alpha",
  schoolOrOrganization: "NRC School",
  teamNumber: "02323",
};

const TEAM_MEMBER: TeamMemberRecord = {
  id: "membership-1",
  isActive: true,
  joinedAt: "2026-01-01T00:00:00.000Z",
  name: "Mentor User",
  role: "TEAM_MENTOR",
  userId: "user-1",
};

const PUBLIC_TEAM_PROFILE: PublicTeamProfile = {
  ...PUBLIC_TEAM_SUMMARY,
  coverImageUrl: "https://example.com/cover.png",
  createdAt: "2026-01-01T00:00:00.000Z",
  members: [
    {
      id: TEAM_MEMBER.id,
      joinedAt: TEAM_MEMBER.joinedAt,
      name: TEAM_MEMBER.name,
      role: TEAM_MEMBER.role,
      userId: TEAM_MEMBER.userId,
    },
  ],
};

const TEAM_INVITATION: TeamInvitationRecord = {
  createdAt: "2026-01-02T00:00:00.000Z",
  email: "student@example.com",
  expiresAt: "2026-01-09T00:00:00.000Z",
  id: "invitation-1",
  role: "TEAM_MEMBER",
  status: "PENDING",
};

const createClient = (session: AuthContextSession | null): RouterClient<AppRouter> => {
  const handler = new RPCHandler(appRouter);

  const fetchAdapter = async (
    request: Request | URL | string,
    init?: RequestInit,
  ): Promise<Response> => {
    const requestInput = request instanceof URL ? request.toString() : request;
    const normalizedRequest =
      requestInput instanceof Request ? requestInput : new Request(requestInput, init);

    const result = await handler.handle(normalizedRequest, {
      context: { session },
      prefix: "/rpc",
    });

    if (!result.matched) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(result.response.body, result.response);
  };

  const link = new RPCLink({
    fetch: fetchAdapter,
    url: "http://localhost/rpc",
  });

  return createORPCClient(link) as RouterClient<AppRouter>;
};

describe("teamRouter e2e", () => {
  beforeEach(() => {
    createTeamForUserMock.mockReset();
    getPublicTeamByTeamNumberMock.mockReset();
    getMyTeamByUserMock.mockReset();
    inviteTeamMemberMock.mockReset();
    listPublicTeamsMock.mockReset();
    listTeamInvitationsMock.mockReset();
    listTeamMembersMock.mockReset();
    removeTeamMemberMock.mockReset();
    revokeTeamInvitationMock.mockReset();
    updateTeamProfileMock.mockReset();
  });

  it("allows unauthenticated public team listings", async () => {
    listPublicTeamsMock.mockResolvedValue({
      teams: [PUBLIC_TEAM_SUMMARY],
      total: 1,
    });

    const client = createClient(null);
    const input = {
      limit: 10,
      page: 2,
      search: "NRC",
    };
    const result = await client.team.listPublicTeams(input);

    expect(listPublicTeamsMock).toHaveBeenCalledWith(input);
    expect(result).toEqual({
      teams: [PUBLIC_TEAM_SUMMARY],
      total: 1,
    });
  });

  it("allows unauthenticated public team profile reads", async () => {
    getPublicTeamByTeamNumberMock.mockResolvedValue(PUBLIC_TEAM_PROFILE);

    const client = createClient(null);
    const result = await client.team.getPublicTeam({ teamNumber: "02323" });

    expect(getPublicTeamByTeamNumberMock).toHaveBeenCalledWith({ teamNumber: "02323" });
    expect(result).toEqual(PUBLIC_TEAM_PROFILE);
  });

  it("rejects invalid public team numbers before the application layer", async () => {
    const client = createClient(null);

    await expect(client.team.getPublicTeam({ teamNumber: "ABC" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(getPublicTeamByTeamNumberMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated createTeam", async () => {
    const client = createClient(null);

    await expect(client.team.createTeam(VALID_CREATE_TEAM_INPUT)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource.",
    });
    expect(createTeamForUserMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated getMyTeam", async () => {
    const client = createClient(null);

    await expect(client.team.getMyTeam()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource.",
    });
    expect(getMyTeamByUserMock).not.toHaveBeenCalled();
  });

  it("rejects createTeam when termsAccepted is false", async () => {
    const client = createClient(TEST_SESSION);

    await expect(
      client.team.createTeam({
        ...VALID_CREATE_TEAM_INPUT,
        termsAccepted: false as true,
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(createTeamForUserMock).not.toHaveBeenCalled();
  });

  it("rejects createTeam when name is blank after trim", async () => {
    const client = createClient(TEST_SESSION);

    await expect(
      client.team.createTeam({
        ...VALID_CREATE_TEAM_INPUT,
        name: "   ",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(createTeamForUserMock).not.toHaveBeenCalled();
  });

  it("forwards createTeam request to application layer", async () => {
    createTeamForUserMock.mockResolvedValue(TEAM_SUMMARY);

    const client = createClient(TEST_SESSION);
    const result = await client.team.createTeam(VALID_CREATE_TEAM_INPUT);

    expect(createTeamForUserMock).toHaveBeenCalledWith(
      "user-1",
      "session-1",
      VALID_CREATE_TEAM_INPUT,
    );
    expect(result).toEqual(TEAM_SUMMARY);
  });

  it("passes a null active organization to getMyTeam when not set on session", async () => {
    const sessionWithoutActiveOrganization: AuthContextSession = {
      ...TEST_SESSION,
      session: {
        ...TEST_SESSION.session,
        activeOrganizationId: null,
      },
    };

    getMyTeamByUserMock.mockResolvedValue(null);

    const client = createClient(sessionWithoutActiveOrganization);
    const result = await client.team.getMyTeam();

    expect(getMyTeamByUserMock).toHaveBeenCalledWith("user-1", null);
    expect(result).toBeNull();
  });

  it("uses active organization context when fetching my team", async () => {
    getMyTeamByUserMock.mockResolvedValue({
      ...TEAM_SUMMARY,
      membershipRole: "TEAM_LEADER",
    });

    const client = createClient(TEST_SESSION);
    const result = await client.team.getMyTeam();

    expect(getMyTeamByUserMock).toHaveBeenCalledWith("user-1", "organization-1");
    expect(result).toEqual({
      ...TEAM_SUMMARY,
      membershipRole: "TEAM_LEADER",
    });
  });

  it("rejects unauthenticated team management endpoints", async () => {
    const client = createClient(null);

    await expect(client.team.listTeamMembers({ teamId: "team-1" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource.",
    });
    await expect(
      client.team.updateTeamProfile({
        name: "NRC Alpha Prime",
        teamId: "team-1",
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource.",
    });
    expect(listTeamMembersMock).not.toHaveBeenCalled();
    expect(updateTeamProfileMock).not.toHaveBeenCalled();
  });

  it("forwards authenticated team profile updates", async () => {
    updateTeamProfileMock.mockResolvedValue({
      ...TEAM_SUMMARY,
      name: "NRC Alpha Prime",
    });

    const client = createClient(TEST_SESSION);
    const input = {
      cityOrProvince: null,
      name: "NRC Alpha Prime",
      teamId: "team-1",
    };
    const result = await client.team.updateTeamProfile(input);

    expect(updateTeamProfileMock).toHaveBeenCalledWith("user-1", input);
    expect(result).toEqual({
      ...TEAM_SUMMARY,
      name: "NRC Alpha Prime",
    });
  });

  it("forwards authenticated team invitation calls", async () => {
    inviteTeamMemberMock.mockResolvedValue(TEAM_INVITATION);
    listTeamInvitationsMock.mockResolvedValue([TEAM_INVITATION]);
    revokeTeamInvitationMock.mockImplementation(() => Promise.resolve());

    const client = createClient(TEST_SESSION);

    await expect(
      client.team.inviteTeamMember({
        email: "student@example.com",
        role: "TEAM_MEMBER",
        teamId: "team-1",
      }),
    ).resolves.toEqual(TEAM_INVITATION);
    await expect(client.team.listTeamInvitations({ teamId: "team-1" })).resolves.toEqual([
      TEAM_INVITATION,
    ]);
    await expect(client.team.revokeTeamInvitation({ invitationId: "invitation-1" })).resolves.toBe(
      undefined,
    );
    expect(inviteTeamMemberMock).toHaveBeenCalledWith("user-1", {
      email: "student@example.com",
      role: "TEAM_MEMBER",
      teamId: "team-1",
    });
    expect(listTeamInvitationsMock).toHaveBeenCalledWith("user-1", { teamId: "team-1" });
    expect(revokeTeamInvitationMock).toHaveBeenCalledWith("user-1", {
      invitationId: "invitation-1",
    });
  });

  it("forwards authenticated team member calls", async () => {
    listTeamMembersMock.mockResolvedValue([TEAM_MEMBER]);
    removeTeamMemberMock.mockImplementation(() => Promise.resolve());

    const client = createClient(TEST_SESSION);

    await expect(client.team.listTeamMembers({ teamId: "team-1" })).resolves.toEqual([TEAM_MEMBER]);
    await expect(client.team.removeTeamMember({ membershipId: "membership-1" })).resolves.toBe(
      undefined,
    );
    expect(listTeamMembersMock).toHaveBeenCalledWith("user-1", { teamId: "team-1" });
    expect(removeTeamMemberMock).toHaveBeenCalledWith("user-1", {
      membershipId: "membership-1",
    });
  });

  it("surfaces application errors from createTeam", async () => {
    createTeamForUserMock.mockRejectedValue(
      new ORPCError("FORBIDDEN", { message: "Complete onboarding before creating a team." }),
    );

    const client = createClient(TEST_SESSION);

    await expect(client.team.createTeam(VALID_CREATE_TEAM_INPUT)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Complete onboarding before creating a team.",
    });
  });

  it("surfaces application errors from getMyTeam", async () => {
    getMyTeamByUserMock.mockRejectedValue(
      new ORPCError("INTERNAL_SERVER_ERROR", { message: "Unexpected database error." }),
    );

    const client = createClient(TEST_SESSION);

    await expect(client.team.getMyTeam()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected database error.",
    });
  });
});
