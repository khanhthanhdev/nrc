import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppRouter } from "../../../app-router";
import type { AuthContextSession } from "../../../shared/context";
import type { OnboardingProfile } from "../application/onboarding";
import type { CompleteOnboardingInput } from "../schemas/onboarding";

const getOnboardingProfileByUserIdMock = vi.fn();
const completeOnboardingByUserIdMock = vi.fn();

vi.mock("../application/onboarding.js", () => ({
  completeOnboardingByUserId: completeOnboardingByUserIdMock,
  getOnboardingProfileByUserId: getOnboardingProfileByUserIdMock,
}));

const { appRouter } = await import("../../../app-router.js");

const TEST_SESSION: AuthContextSession = {
  session: {
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    id: "session-1",
    userId: "user-1",
  },
  user: {
    email: "user@example.com",
    emailVerified: true,
    id: "user-1",
    name: "Test User",
  },
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

describe("authRouter e2e", () => {
  beforeEach(() => {
    completeOnboardingByUserIdMock.mockReset();
    getOnboardingProfileByUserIdMock.mockReset();
  });

  it("rejects unauthenticated onboarding profile access", async () => {
    const client = createClient(null);

    await expect(client.auth.getOnboardingProfile()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource.",
    });
  });

  it("returns onboarding profile for authenticated user", async () => {
    const expected: OnboardingProfile = {
      address: "123 Nguyen Trai",
      city: "Thành phố Hà Nội",
      dateOfBirth: "2001-09-20",
      onboardingCompleted: false,
      organizationOrSchool: "NRC University",
      phone: "0909000000",
    };

    getOnboardingProfileByUserIdMock.mockResolvedValue(expected);

    const client = createClient(TEST_SESSION);
    const profile = await client.auth.getOnboardingProfile();

    expect(getOnboardingProfileByUserIdMock).toHaveBeenCalledWith("user-1");
    expect(profile).toEqual(expected);
  });

  it("completes onboarding then returns completed profile", async () => {
    let persisted: OnboardingProfile = {
      address: "",
      city: "Thành phố Hà Nội",
      dateOfBirth: "1970-01-01",
      onboardingCompleted: false,
      organizationOrSchool: "",
      phone: "",
    };

    completeOnboardingByUserIdMock.mockImplementation(
      async (_userId: string, input: CompleteOnboardingInput) => {
        persisted = {
          ...input,
          onboardingCompleted: true,
        };
      },
    );

    getOnboardingProfileByUserIdMock.mockImplementation(async () => persisted);

    const client = createClient(TEST_SESSION);
    const input: CompleteOnboardingInput = {
      address: "225 Le Loi",
      city: "Thành phố Hồ Chí Minh",
      dateOfBirth: "2000-10-10",
      organizationOrSchool: "NRC Academy",
      phone: "0911222333",
    };

    const completion = await client.auth.completeOnboarding(input);
    expect(completion).toEqual({ success: true });
    expect(completeOnboardingByUserIdMock).toHaveBeenCalledWith("user-1", input);

    const profile = await client.auth.getOnboardingProfile();
    expect(profile.onboardingCompleted).toBe(true);
    expect(profile.address).toBe("225 Le Loi");
  });

  it("returns NOT_FOUND when profile does not exist", async () => {
    getOnboardingProfileByUserIdMock.mockResolvedValue(null);

    const client = createClient(TEST_SESSION);

    try {
      await client.auth.getOnboardingProfile();
      throw new Error("Expected ORPCError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect(error).toMatchObject({
        code: "NOT_FOUND",
        message: "User profile not found.",
      });
    }
  });
});
