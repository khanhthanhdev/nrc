import type { RouterClient } from "@orpc/server";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppRouter } from "../../../app-router";
import type { AuthContextSession } from "../../../shared/context";
import type { TeamSummary } from "../application/team";
import type { CreateTeamInput } from "../schemas/team";

const createTeamForUserMock = vi.fn();
const getMyTeamByUserMock = vi.fn();

vi.mock("../application/team.js", () => ({
  createTeamForUser: createTeamForUserMock,
  getMyTeamByUser: getMyTeamByUserMock,
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
    getMyTeamByUserMock.mockReset();
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
    const expectedTeam: TeamSummary = {
      cityOrProvince: "Da Nang",
      description: "Rookie robotics team",
      id: "team-1",
      membershipRole: "TEAM_MENTOR",
      name: "NRC Alpha",
      organizationId: "organization-1",
      schoolOrOrganization: "NRC School",
      teamNumber: "02323",
    };

    createTeamForUserMock.mockResolvedValue(expectedTeam);

    const client = createClient(TEST_SESSION);
    const result = await client.team.createTeam(VALID_CREATE_TEAM_INPUT);

    expect(createTeamForUserMock).toHaveBeenCalledWith(
      "user-1",
      "session-1",
      VALID_CREATE_TEAM_INPUT,
    );
    expect(result).toEqual(expectedTeam);
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
    const expectedTeam: TeamSummary = {
      cityOrProvince: "Da Nang",
      description: "Rookie robotics team",
      id: "team-1",
      membershipRole: "TEAM_LEADER",
      name: "NRC Alpha",
      organizationId: "organization-1",
      schoolOrOrganization: "NRC School",
      teamNumber: "02323",
    };

    getMyTeamByUserMock.mockResolvedValue(expectedTeam);

    const client = createClient(TEST_SESSION);
    const result = await client.team.getMyTeam();

    expect(getMyTeamByUserMock).toHaveBeenCalledWith("user-1", "organization-1");
    expect(result).toEqual(expectedTeam);
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
