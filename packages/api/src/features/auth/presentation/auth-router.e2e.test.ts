import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppRouter } from "../../../app-router";
import type { AuthAdminContext, AuthContextSession } from "../../../shared/context";
import type { OnboardingProfile } from "../application/onboarding";
import type { CompleteOnboardingInput } from "../schemas/onboarding";

const getOnboardingProfileByUserIdMock = vi.fn();
const completeOnboardingByUserIdMock = vi.fn();
const createManagedUserForAdminMock = vi.fn();
const getManagedUserForAdminMock = vi.fn();
const listManagedUsersForAdminMock = vi.fn();
const saveManagedUserForAdminMock = vi.fn();

vi.mock("../application/onboarding.js", () => ({
  completeOnboardingByUserId: completeOnboardingByUserIdMock,
  getOnboardingProfileByUserId: getOnboardingProfileByUserIdMock,
}));

vi.mock("../application/managed-users.js", () => ({
  createManagedUserForAdmin: createManagedUserForAdminMock,
  getManagedUserForAdmin: getManagedUserForAdminMock,
  listManagedUsersForAdmin: listManagedUsersForAdminMock,
  saveManagedUserForAdmin: saveManagedUserForAdminMock,
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

const VALID_ONBOARDING_INPUT: CompleteOnboardingInput = {
  address: "225 Le Loi",
  city: "Thành phố Hồ Chí Minh",
  dateOfBirth: "2000-10-10",
  organizationOrSchool: "NRC Academy",
  phone: "0911222333",
};

const ADMIN_SESSION: AuthContextSession = {
  ...TEST_SESSION,
  user: {
    ...TEST_SESSION.user,
    systemRole: "ADMIN",
  },
};

const TEST_AUTH_ADMIN: AuthAdminContext = {
  createUser: vi.fn(),
  updateUser: vi.fn(),
};

const createClient = (
  session: AuthContextSession | null,
  authAdmin?: AuthAdminContext,
): RouterClient<AppRouter> => {
  const handler = new RPCHandler(appRouter);

  const fetchAdapter = async (
    request: Request | URL | string,
    init?: RequestInit,
  ): Promise<Response> => {
    const requestInput = request instanceof URL ? request.toString() : request;
    const normalizedRequest =
      requestInput instanceof Request ? requestInput : new Request(requestInput, init);

    const result = await handler.handle(normalizedRequest, {
      context: { authAdmin, session },
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
    createManagedUserForAdminMock.mockReset();
    getOnboardingProfileByUserIdMock.mockReset();
    getManagedUserForAdminMock.mockReset();
    listManagedUsersForAdminMock.mockReset();
    saveManagedUserForAdminMock.mockReset();
    TEST_AUTH_ADMIN.createUser = vi.fn();
    TEST_AUTH_ADMIN.updateUser = vi.fn();
  });

  it("rejects unauthenticated onboarding profile access", async () => {
    const client = createClient(null);

    await expect(client.auth.getOnboardingProfile()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource.",
    });
    expect(getOnboardingProfileByUserIdMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated onboarding completion", async () => {
    const client = createClient(null);

    await expect(client.auth.completeOnboarding(VALID_ONBOARDING_INPUT)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource.",
    });
    expect(completeOnboardingByUserIdMock).not.toHaveBeenCalled();
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
      (_userId: string, input: CompleteOnboardingInput) => {
        persisted = {
          ...input,
          onboardingCompleted: true,
        };
      },
    );

    getOnboardingProfileByUserIdMock.mockImplementation(() => persisted);

    const client = createClient(TEST_SESSION);
    const completion = await client.auth.completeOnboarding(VALID_ONBOARDING_INPUT);
    expect(completion).toEqual({ success: true });
    expect(completeOnboardingByUserIdMock).toHaveBeenCalledWith("user-1", VALID_ONBOARDING_INPUT);

    const profile = await client.auth.getOnboardingProfile();
    expect(profile.onboardingCompleted).toBe(true);
    expect(profile.address).toBe("225 Le Loi");
  });

  it("trims onboarding strings before passing data to application layer", async () => {
    completeOnboardingByUserIdMock.mockResolvedValue({ success: true });

    const client = createClient(TEST_SESSION);
    await client.auth.completeOnboarding({
      ...VALID_ONBOARDING_INPUT,
      address: "  225 Le Loi  ",
      organizationOrSchool: "  NRC Academy  ",
      phone: "  0911222333  ",
    });

    expect(completeOnboardingByUserIdMock).toHaveBeenCalledWith("user-1", {
      ...VALID_ONBOARDING_INPUT,
      address: "225 Le Loi",
      organizationOrSchool: "NRC Academy",
      phone: "0911222333",
    });
  });

  it("rejects onboarding completion with invalid city payload", async () => {
    const client = createClient(TEST_SESSION);

    const invalidInput = {
      ...VALID_ONBOARDING_INPUT,
      city: "Invalid City" as CompleteOnboardingInput["city"],
    };

    await expect(client.auth.completeOnboarding(invalidInput)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(completeOnboardingByUserIdMock).not.toHaveBeenCalled();
  });

  it("rejects onboarding completion with invalid date format payload", async () => {
    const client = createClient(TEST_SESSION);

    const invalidInput = {
      ...VALID_ONBOARDING_INPUT,
      dateOfBirth: "10-10-2000",
    };

    await expect(client.auth.completeOnboarding(invalidInput)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(completeOnboardingByUserIdMock).not.toHaveBeenCalled();
  });

  it("surfaces application errors during onboarding completion", async () => {
    completeOnboardingByUserIdMock.mockRejectedValue(
      new ORPCError("FORBIDDEN", { message: "Onboarding updates are restricted." }),
    );

    const client = createClient(TEST_SESSION);

    await expect(client.auth.completeOnboarding(VALID_ONBOARDING_INPUT)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Onboarding updates are restricted.",
    });
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

  it("rejects onboarding completion with empty address", async () => {
    const client = createClient(TEST_SESSION);

    await expect(
      client.auth.completeOnboarding({ ...VALID_ONBOARDING_INPUT, address: "" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(completeOnboardingByUserIdMock).not.toHaveBeenCalled();
  });

  it("rejects onboarding completion with empty phone", async () => {
    const client = createClient(TEST_SESSION);

    await expect(
      client.auth.completeOnboarding({ ...VALID_ONBOARDING_INPUT, phone: "" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(completeOnboardingByUserIdMock).not.toHaveBeenCalled();
  });

  it("rejects onboarding completion with empty organizationOrSchool", async () => {
    const client = createClient(TEST_SESSION);

    await expect(
      client.auth.completeOnboarding({ ...VALID_ONBOARDING_INPUT, organizationOrSchool: "" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(completeOnboardingByUserIdMock).not.toHaveBeenCalled();
  });

  it("rejects onboarding completion when address exceeds max length", async () => {
    const client = createClient(TEST_SESSION);

    await expect(
      client.auth.completeOnboarding({
        ...VALID_ONBOARDING_INPUT,
        address: "A".repeat(256),
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(completeOnboardingByUserIdMock).not.toHaveBeenCalled();
  });

  it("rejects onboarding completion when organizationOrSchool exceeds max length", async () => {
    const client = createClient(TEST_SESSION);

    await expect(
      client.auth.completeOnboarding({
        ...VALID_ONBOARDING_INPUT,
        organizationOrSchool: "A".repeat(256),
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(completeOnboardingByUserIdMock).not.toHaveBeenCalled();
  });

  it("rejects onboarding completion when phone exceeds max length", async () => {
    const client = createClient(TEST_SESSION);

    await expect(
      client.auth.completeOnboarding({
        ...VALID_ONBOARDING_INPUT,
        phone: "0".repeat(31),
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(completeOnboardingByUserIdMock).not.toHaveBeenCalled();
  });

  it("rejects onboarding completion with whitespace-only address", async () => {
    const client = createClient(TEST_SESSION);

    await expect(
      client.auth.completeOnboarding({ ...VALID_ONBOARDING_INPUT, address: "   " }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(completeOnboardingByUserIdMock).not.toHaveBeenCalled();
  });

  it("rejects onboarding completion with missing fields", async () => {
    const client = createClient(TEST_SESSION);

    await expect(
      client.auth.completeOnboarding({} as CompleteOnboardingInput),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(completeOnboardingByUserIdMock).not.toHaveBeenCalled();
  });

  it("returns profile with onboardingCompleted=false for incomplete user", async () => {
    const incompleteProfile: OnboardingProfile = {
      address: "",
      city: "",
      dateOfBirth: "1970-01-01",
      onboardingCompleted: false,
      organizationOrSchool: "",
      phone: "",
    };

    getOnboardingProfileByUserIdMock.mockResolvedValue(incompleteProfile);

    const client = createClient(TEST_SESSION);
    const profile = await client.auth.getOnboardingProfile();

    expect(profile.onboardingCompleted).toBe(false);
    expect(profile.address).toBe("");
    expect(profile.phone).toBe("");
  });

  it("allows re-completing onboarding for already-completed user", async () => {
    completeOnboardingByUserIdMock.mockResolvedValue({ success: true });

    const client = createClient(TEST_SESSION);
    const result = await client.auth.completeOnboarding(VALID_ONBOARDING_INPUT);

    expect(result).toEqual({ success: true });
    expect(completeOnboardingByUserIdMock).toHaveBeenCalledWith("user-1", VALID_ONBOARDING_INPUT);
  });

  it("surfaces application errors during profile retrieval", async () => {
    getOnboardingProfileByUserIdMock.mockRejectedValue(
      new ORPCError("INTERNAL_SERVER_ERROR", { message: "Database connection failed." }),
    );

    const client = createClient(TEST_SESSION);

    await expect(client.auth.getOnboardingProfile()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database connection failed.",
    });
  });

  it("surfaces non-ORPC errors during onboarding completion as internal error", async () => {
    completeOnboardingByUserIdMock.mockRejectedValue(new Error("Unexpected failure"));
    const client = createClient(TEST_SESSION);

    await expect(client.auth.completeOnboarding(VALID_ONBOARDING_INPUT)).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("surfaces non-ORPC errors during profile retrieval as internal error", async () => {
    getOnboardingProfileByUserIdMock.mockRejectedValue(new Error("Unexpected failure"));
    const client = createClient(TEST_SESSION);

    await expect(client.auth.getOnboardingProfile()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("accepts all valid cities from VIETNAM_34_CITIES", async () => {
    completeOnboardingByUserIdMock.mockResolvedValue({ success: true });

    const client = createClient(TEST_SESSION);

    const firstCity = "Thành phố Hà Nội" as CompleteOnboardingInput["city"];
    const lastCity = "Tỉnh Kon Tum" as CompleteOnboardingInput["city"];

    const result1 = await client.auth.completeOnboarding({
      ...VALID_ONBOARDING_INPUT,
      city: firstCity,
    });
    expect(result1).toEqual({ success: true });

    const result2 = await client.auth.completeOnboarding({
      ...VALID_ONBOARDING_INPUT,
      city: lastCity,
    });
    expect(result2).toEqual({ success: true });
  });

  it("passes correct userId from session to application layer", async () => {
    const customSession: AuthContextSession = {
      session: {
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
        id: "session-99",
        userId: "user-42",
      },
      user: {
        email: "another@example.com",
        emailVerified: true,
        id: "user-42",
        name: "Another User",
      },
    };

    completeOnboardingByUserIdMock.mockResolvedValue({ success: true });
    getOnboardingProfileByUserIdMock.mockResolvedValue({
      address: "",
      city: "",
      dateOfBirth: "1970-01-01",
      onboardingCompleted: false,
      organizationOrSchool: "",
      phone: "",
    });

    const client = createClient(customSession);

    await client.auth.getOnboardingProfile();
    expect(getOnboardingProfileByUserIdMock).toHaveBeenCalledWith("user-42");

    await client.auth.completeOnboarding(VALID_ONBOARDING_INPUT);
    expect(completeOnboardingByUserIdMock).toHaveBeenCalledWith("user-42", VALID_ONBOARDING_INPUT);
  });

  it("rejects managed user queries for unauthenticated callers", async () => {
    const client = createClient(null);

    await expect(
      client.auth.getManagedUsers({
        includeExampleAccounts: false,
        page: 1,
        pageSize: 20,
        roleFilter: "all",
        searchField: "email",
        sort: "newest",
        statusFilter: "all",
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource.",
    });
    expect(listManagedUsersForAdminMock).not.toHaveBeenCalled();
  });

  it("rejects managed user queries for non-admin callers", async () => {
    const client = createClient(TEST_SESSION);

    await expect(
      client.auth.getManagedUsers({
        includeExampleAccounts: false,
        page: 1,
        pageSize: 20,
        roleFilter: "all",
        searchField: "email",
        sort: "newest",
        statusFilter: "all",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "You must be an admin to access this resource.",
    });
    expect(listManagedUsersForAdminMock).not.toHaveBeenCalled();
  });

  it("returns managed users for admin callers", async () => {
    const expected = {
      counts: {
        admins: 1,
        banned: 1,
        managers: 1,
        users: 2,
      },
      hiddenExampleAccountCount: 3,
      page: 2,
      pageSize: 20,
      total: 4,
      users: [],
    };
    listManagedUsersForAdminMock.mockResolvedValue(expected);

    const client = createClient(ADMIN_SESSION, TEST_AUTH_ADMIN);
    const result = await client.auth.getManagedUsers({
      includeExampleAccounts: false,
      page: 2,
      pageSize: 20,
      roleFilter: "all",
      searchField: "email",
      searchValue: "admin",
      sort: "updated",
      statusFilter: "all",
    });

    expect(result).toEqual(expected);
    expect(listManagedUsersForAdminMock).toHaveBeenCalledWith({
      includeExampleAccounts: false,
      page: 2,
      pageSize: 20,
      roleFilter: "all",
      searchField: "email",
      searchValue: "admin",
      sort: "updated",
      statusFilter: "all",
    });
  });

  it("returns a managed user for admin callers", async () => {
    const expectedUser = {
      banExpires: null,
      banReason: null,
      banned: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      email: "member@example.com",
      emailVerified: true,
      id: "member-1",
      image: null,
      name: "Member User",
      systemRole: "USER",
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      userType: "PARTICIPANT",
    };
    getManagedUserForAdminMock.mockResolvedValue(expectedUser);

    const client = createClient(ADMIN_SESSION, TEST_AUTH_ADMIN);
    const result = await client.auth.getManagedUser({
      userId: "member-1",
    });

    expect(result).toEqual(expectedUser);
    expect(getManagedUserForAdminMock).toHaveBeenCalledWith({
      userId: "member-1",
    });
  });

  it("creates managed users for admin callers", async () => {
    const expectedUser = {
      email: "manager@example.com",
      id: "managed-user-1",
      name: "Manager User",
      systemRole: "MANAGER",
      userType: "STAFF",
    };
    createManagedUserForAdminMock.mockResolvedValue(expectedUser);

    const client = createClient(ADMIN_SESSION, TEST_AUTH_ADMIN);
    const result = await client.auth.createManagedUser({
      email: "manager@example.com",
      name: "Manager User",
      password: "TempPass123!",
      systemRole: "MANAGER",
    });

    expect(result).toEqual(expectedUser);
    expect(createManagedUserForAdminMock).toHaveBeenCalledWith(TEST_AUTH_ADMIN, {
      email: "manager@example.com",
      name: "Manager User",
      password: "TempPass123!",
      systemRole: "MANAGER",
    });
  });

  it("saves managed users for admin callers with the actor user id", async () => {
    const expectedUser = {
      email: "member@example.com",
      id: "member-1",
      name: "Updated Name",
      systemRole: "USER",
      userType: "PARTICIPANT",
    };
    saveManagedUserForAdminMock.mockResolvedValue(expectedUser);

    const client = createClient(ADMIN_SESSION, TEST_AUTH_ADMIN);
    const result = await client.auth.saveManagedUser({
      name: "Updated Name",
      systemRole: "USER",
      userId: "member-1",
    });

    expect(result).toEqual(expectedUser);
    expect(saveManagedUserForAdminMock).toHaveBeenCalledWith({
      actorUserId: "user-1",
      authAdmin: TEST_AUTH_ADMIN,
      input: {
        name: "Updated Name",
        systemRole: "USER",
        userId: "member-1",
      },
    });
  });
});
