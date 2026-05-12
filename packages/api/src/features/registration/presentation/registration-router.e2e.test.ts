import type { RouterClient } from "@orpc/server";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppRouter } from "../../../app-router";
import type { AuthContextSession } from "../../../shared/context";
import type { RegistrationDetail, RegistrationSummary, ReviewActionItem } from "../application/registration";

const createRegistrationMock = vi.fn();
const getRegistrationDetailMock = vi.fn();
const listTeamRegistrationsMock = vi.fn();
const submitRegistrationMock = vi.fn();
const updateRegistrationRevisionMock = vi.fn();
const withdrawRegistrationMock = vi.fn();
const listRegistrationReviewActionsMock = vi.fn();
const listAdminRegistrationsByEventMock = vi.fn();
const getAdminRegistrationDetailMock = vi.fn();
const reviewRegistrationMock = vi.fn();
const addRegistrationCommentMock = vi.fn();
const getEventRegistrationFormMock = vi.fn();
const getTeamEventRegistrationStatusMock = vi.fn();
const listPublicEventsMock = vi.fn();

vi.mock("../application/registration.js", () => ({
  addRegistrationComment: addRegistrationCommentMock,
  createRegistration: createRegistrationMock,
  getAdminRegistrationDetail: getAdminRegistrationDetailMock,
  getEventRegistrationForm: getEventRegistrationFormMock,
  getRegistrationDetail: getRegistrationDetailMock,
  getTeamEventRegistrationStatus: getTeamEventRegistrationStatusMock,
  listAdminRegistrationsByEvent: listAdminRegistrationsByEventMock,
  listRegistrationReviewActions: listRegistrationReviewActionsMock,
  listTeamRegistrations: listTeamRegistrationsMock,
  reviewRegistration: reviewRegistrationMock,
  submitRegistration: submitRegistrationMock,
  updateRegistrationRevision: updateRegistrationRevisionMock,
  withdrawRegistration: withdrawRegistrationMock,
}));

vi.mock("../application/public-events.js", () => ({
  listPublicEvents: listPublicEventsMock,
}));

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

const ADMIN_SESSION: AuthContextSession = {
  ...TEST_SESSION,
  session: { ...TEST_SESSION.session, id: "session-admin", userId: "user-admin" },
  user: { ...TEST_SESSION.user, email: "admin@example.com", id: "user-admin", name: "Admin User", systemRole: "ADMIN" },
};

const MANAGER_SESSION: AuthContextSession = {
  ...TEST_SESSION,
  session: { ...TEST_SESSION.session, id: "session-manager", userId: "user-manager" },
  user: { ...TEST_SESSION.user, email: "manager@example.com", id: "user-manager", name: "Manager User", systemRole: "MANAGER" },
};

const REGISTRATION_DETAIL: RegistrationDetail = {
  approvedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  currentRevisionNumber: 1,
  deniedAt: null,
  eventId: "event-1",
  formVersionId: "form-1",
  id: "reg-1",
  reviewedAt: null,
  status: "draft",
  submittedAt: null,
  teamId: "team-1",
  updatedAt: "2026-01-01T00:00:00.000Z",
  withdrawnAt: null,
};

const REGISTRATION_SUMMARY: RegistrationSummary = {
  createdAt: "2026-01-01T00:00:00.000Z",
  currentRevisionNumber: 1,
  eventId: "event-1",
  id: "reg-1",
  status: "draft",
  submittedAt: null,
  teamId: "team-1",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const REVIEW_ACTION: ReviewActionItem = {
  actionType: "submitted",
  actorUserId: "user-1",
  comment: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "action-1",
  isVisibleToTeam: true,
  nextStatus: "submitted",
  previousStatus: "draft",
};

const createClient = (session: AuthContextSession | null): RouterClient<AppRouter> => {
  const handler = new RPCHandler(appRouter);
  const fetchAdapter = async (request: Request | URL | string, init?: RequestInit): Promise<Response> => {
    const requestInput = request instanceof URL ? request.toString() : request;
    const normalizedRequest = requestInput instanceof Request ? requestInput : new Request(requestInput, init);
    const result = await handler.handle(normalizedRequest, { context: { session }, prefix: "/rpc" });
    if (!result.matched) return new Response("Not Found", { status: 404 });
    return new Response(result.response.body, result.response);
  };
  const link = new RPCLink({ fetch: fetchAdapter, url: "http://localhost/rpc" });
  return createORPCClient(link) as RouterClient<AppRouter>;
};

describe("registrationRouter e2e", () => {
  beforeEach(() => {
    createRegistrationMock.mockReset();
    getRegistrationDetailMock.mockReset();
    listTeamRegistrationsMock.mockReset();
    submitRegistrationMock.mockReset();
    updateRegistrationRevisionMock.mockReset();
    withdrawRegistrationMock.mockReset();
    listRegistrationReviewActionsMock.mockReset();
    listAdminRegistrationsByEventMock.mockReset();
    getAdminRegistrationDetailMock.mockReset();
    reviewRegistrationMock.mockReset();
    addRegistrationCommentMock.mockReset();
    getEventRegistrationFormMock.mockReset();
    getTeamEventRegistrationStatusMock.mockReset();
    listPublicEventsMock.mockReset();
  });

  // ── Unauthenticated access ─────────────────────────────────────────

  it("rejects unauthenticated createRegistration", async () => {
    const client = createClient(null);
    await expect(client.registration.createRegistration({
      eventId: "event-1",
      payload: { teamSize: 5 },
      teamId: "team-1",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(createRegistrationMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated getRegistration", async () => {
    const client = createClient(null);
    await expect(client.registration.getRegistration({
      registrationId: "reg-1",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(getRegistrationDetailMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated listTeamRegistrations", async () => {
    const client = createClient(null);
    await expect(client.registration.listTeamRegistrations({
      teamId: "team-1",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects unauthenticated submitRegistration", async () => {
    const client = createClient(null);
    await expect(client.registration.submitRegistration({
      registrationId: "reg-1",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects unauthenticated updateRegistrationRevision", async () => {
    const client = createClient(null);
    await expect(client.registration.updateRegistrationRevision({
      payload: { key: "value" },
      registrationId: "reg-1",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects unauthenticated withdrawRegistration", async () => {
    const client = createClient(null);
    await expect(client.registration.withdrawRegistration({
      registrationId: "reg-1",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects unauthenticated getTeamEventRegistrationStatus", async () => {
    const client = createClient(null);
    await expect(client.registration.getTeamEventRegistrationStatus({
      eventId: "event-1",
      teamId: "team-1",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects unauthenticated listRegistrationReviewActions", async () => {
    const client = createClient(null);
    await expect(client.registration.listRegistrationReviewActions({
      registrationId: "reg-1",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  // ── Public endpoints ────────────────────────────────────────────────

  it("allows unauthenticated getEventRegistrationForm", async () => {
    getEventRegistrationFormMock.mockResolvedValue({
      definition: { fields: [] },
      formVersionId: "form-1",
      versionNumber: 1,
    });

    const client = createClient(null);
    const result = await client.registration.getEventRegistrationForm({ eventId: "event-1" });
    expect(getEventRegistrationFormMock).toHaveBeenCalledWith("event-1");
    expect(result.formVersionId).toBe("form-1");
  });

  it("allows unauthenticated listPublicEvents", async () => {
    listPublicEventsMock.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
    });

    const client = createClient(null);
    const result = await client.registration.listPublicEvents({});
    expect(listPublicEventsMock).toHaveBeenCalled();
    expect(result.totalCount).toBe(0);
  });

  // ── Team-facing authenticated operations ────────────────────────────

  it("forwards createRegistration to application layer", async () => {
    createRegistrationMock.mockResolvedValue(REGISTRATION_DETAIL);

    const client = createClient(TEST_SESSION);
    const result = await client.registration.createRegistration({
      eventId: "event-1",
      payload: { teamSize: 5 },
      teamId: "team-1",
    });

    expect(createRegistrationMock).toHaveBeenCalledWith("user-1", {
      eventId: "event-1",
      payload: { teamSize: 5 },
      teamId: "team-1",
    });
    expect(result).toEqual(REGISTRATION_DETAIL);
  });

  it("forwards getRegistration to application layer", async () => {
    getRegistrationDetailMock.mockResolvedValue({
      registration: REGISTRATION_DETAIL,
      revisions: [],
    });

    const client = createClient(TEST_SESSION);
    const result = await client.registration.getRegistration({ registrationId: "reg-1" });

    expect(getRegistrationDetailMock).toHaveBeenCalledWith("user-1", "reg-1");
    expect(result.registration).toEqual(REGISTRATION_DETAIL);
  });

  it("forwards listTeamRegistrations to application layer", async () => {
    listTeamRegistrationsMock.mockResolvedValue([REGISTRATION_SUMMARY]);

    const client = createClient(TEST_SESSION);
    const result = await client.registration.listTeamRegistrations({ teamId: "team-1" });

    expect(listTeamRegistrationsMock).toHaveBeenCalledWith("user-1", { teamId: "team-1" });
    expect(result).toEqual([REGISTRATION_SUMMARY]);
  });

  it("forwards submitRegistration to application layer", async () => {
    submitRegistrationMock.mockResolvedValue({ ...REGISTRATION_DETAIL, status: "submitted" });

    const client = createClient(TEST_SESSION);
    const result = await client.registration.submitRegistration({ registrationId: "reg-1" });

    expect(submitRegistrationMock).toHaveBeenCalledWith("user-1", "reg-1");
    expect(result.status).toBe("submitted");
  });

  it("forwards updateRegistrationRevision to application layer", async () => {
    updateRegistrationRevisionMock.mockResolvedValue(REGISTRATION_DETAIL);

    const client = createClient(TEST_SESSION);
    const result = await client.registration.updateRegistrationRevision({
      payload: { teamSize: 6 },
      registrationId: "reg-1",
    });

    expect(updateRegistrationRevisionMock).toHaveBeenCalledWith("user-1", {
      payload: { teamSize: 6 },
      registrationId: "reg-1",
    });
    expect(result).toEqual(REGISTRATION_DETAIL);
  });

  it("forwards withdrawRegistration to application layer", async () => {
    withdrawRegistrationMock.mockResolvedValue({ ...REGISTRATION_DETAIL, status: "withdrawn" });

    const client = createClient(TEST_SESSION);
    const result = await client.registration.withdrawRegistration({ registrationId: "reg-1" });

    expect(withdrawRegistrationMock).toHaveBeenCalledWith("user-1", { registrationId: "reg-1" });
    expect(result.status).toBe("withdrawn");
  });

  it("forwards listRegistrationReviewActions to application layer", async () => {
    listRegistrationReviewActionsMock.mockResolvedValue([REVIEW_ACTION]);

    const client = createClient(TEST_SESSION);
    const result = await client.registration.listRegistrationReviewActions({
      registrationId: "reg-1",
    });

    expect(listRegistrationReviewActionsMock).toHaveBeenCalledWith("user-1", { registrationId: "reg-1" });
    expect(result).toEqual([REVIEW_ACTION]);
  });

  it("forwards getTeamEventRegistrationStatus to application layer", async () => {
    getTeamEventRegistrationStatusMock.mockResolvedValue({ exists: false });

    const client = createClient(TEST_SESSION);
    const result = await client.registration.getTeamEventRegistrationStatus({
      eventId: "event-1",
      teamId: "team-1",
    });

    expect(getTeamEventRegistrationStatusMock).toHaveBeenCalledWith("user-1", {
      eventId: "event-1",
      teamId: "team-1",
    });
    expect(result.exists).toBe(false);
  });

  // ── Admin endpoints ─────────────────────────────────────────────────

  it("rejects regular user from admin endpoints", async () => {
    const client = createClient(TEST_SESSION);
    await expect(client.registration.listAdminRegistrationsByEvent({
      eventId: "event-1",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listAdminRegistrationsByEventMock).not.toHaveBeenCalled();
  });

  it("forwards listAdminRegistrationsByEvent for admin", async () => {
    listAdminRegistrationsByEventMock.mockResolvedValue([]);

    const client = createClient(ADMIN_SESSION);
    const result = await client.registration.listAdminRegistrationsByEvent({
      eventId: "event-1",
    });

    expect(listAdminRegistrationsByEventMock).toHaveBeenCalledWith({ eventId: "event-1" });
    expect(result).toEqual([]);
  });

  it("forwards listAdminRegistrationsByEvent for manager", async () => {
    listAdminRegistrationsByEventMock.mockResolvedValue([]);

    const client = createClient(MANAGER_SESSION);
    await client.registration.listAdminRegistrationsByEvent({ eventId: "event-1" });

    expect(listAdminRegistrationsByEventMock).toHaveBeenCalled();
  });

  it("forwards getAdminRegistrationDetail for admin", async () => {
    getAdminRegistrationDetailMock.mockResolvedValue({
      registration: { ...REGISTRATION_DETAIL, teamName: "NRC Alpha", teamNumber: "02323" },
      reviewActions: [],
      revisions: [],
    });

    const client = createClient(ADMIN_SESSION);
    const result = await client.registration.getAdminRegistrationDetail({ registrationId: "reg-1" });

    expect(getAdminRegistrationDetailMock).toHaveBeenCalledWith("reg-1");
    expect(result.registration.teamName).toBe("NRC Alpha");
  });

  it("forwards reviewRegistration for admin", async () => {
    reviewRegistrationMock.mockResolvedValue({ ...REGISTRATION_DETAIL, status: "approved" });

    const client = createClient(ADMIN_SESSION);
    const result = await client.registration.reviewRegistration({
      action: "approve",
      comment: "Looks good",
      registrationId: "reg-1",
    });

    expect(reviewRegistrationMock).toHaveBeenCalledWith("user-admin", {
      action: "approve",
      comment: "Looks good",
      registrationId: "reg-1",
    });
    expect(result.status).toBe("approved");
  });

  it("forwards addRegistrationComment for admin", async () => {
    addRegistrationCommentMock.mockResolvedValue(REVIEW_ACTION);

    const client = createClient(ADMIN_SESSION);
    const result = await client.registration.addRegistrationComment({
      comment: "Please update",
      registrationId: "reg-1",
    });

    expect(addRegistrationCommentMock).toHaveBeenCalledWith("user-admin", {
      comment: "Please update",
      isVisibleToTeam: true,
      registrationId: "reg-1",
    });
    expect(result).toEqual(REVIEW_ACTION);
  });

  // ── Error surfacing ─────────────────────────────────────────────────

  it("surfaces application errors from createRegistration", async () => {
    createRegistrationMock.mockRejectedValue(
      new ORPCError("CONFLICT", { message: "This team is already registered for this event." }),
    );

    const client = createClient(TEST_SESSION);
    await expect(client.registration.createRegistration({
      eventId: "event-1",
      payload: {},
      teamId: "team-1",
    })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "This team is already registered for this event.",
    });
  });

  it("surfaces application errors from submitRegistration", async () => {
    submitRegistrationMock.mockRejectedValue(
      new ORPCError("BAD_REQUEST", { message: 'Registration cannot be submitted from status "submitted".' }),
    );

    const client = createClient(TEST_SESSION);
    await expect(client.registration.submitRegistration({
      registrationId: "reg-1",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("surfaces NOT_FOUND when registration does not exist", async () => {
    getRegistrationDetailMock.mockRejectedValue(
      new ORPCError("NOT_FOUND", { message: "Registration not found." }),
    );

    const client = createClient(TEST_SESSION);
    await expect(client.registration.getRegistration({
      registrationId: "nonexistent",
    })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("surfaces application errors from reviewRegistration", async () => {
    reviewRegistrationMock.mockRejectedValue(
      new ORPCError("BAD_REQUEST", { message: 'Registration cannot be reviewed from status "draft".' }),
    );

    const client = createClient(ADMIN_SESSION);
    await expect(client.registration.reviewRegistration({
      action: "approve",
      registrationId: "reg-1",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  // ── Validation ──────────────────────────────────────────────────────

  it("rejects invalid createRegistration input before application layer", async () => {
    const client = createClient(TEST_SESSION);
    await expect(client.registration.createRegistration({
      eventId: "   ",
      payload: {},
      teamId: "team-1",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(createRegistrationMock).not.toHaveBeenCalled();
  });

  it("rejects invalid review action", async () => {
    const client = createClient(ADMIN_SESSION);
    await expect(client.registration.reviewRegistration({
      action: "invalid" as "approve",
      registrationId: "reg-1",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(reviewRegistrationMock).not.toHaveBeenCalled();
  });
});
