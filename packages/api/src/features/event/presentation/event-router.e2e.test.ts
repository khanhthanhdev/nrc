import type { RouterClient } from "@orpc/server";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppRouter } from "../../../app-router";
import type { AuthContextSession } from "../../../shared/context";
import type {
  AdminEventDetail,
  AdminEventDocument,
  AdminEventSummary,
  AdminRegistrationFormVersion,
  PublicEventDetail,
} from "../application/event";

const createEventForAdminMock = vi.fn();
const updateEventForAdminMock = vi.fn();
const deleteEventForAdminMock = vi.fn();
const listAdminEventsMock = vi.fn();
const getAdminEventByIdMock = vi.fn();
const getPublicEventBySeasonAndCodeMock = vi.fn();
const createEventDocumentForAdminMock = vi.fn();
const createEventAnnouncementForAdminMock = vi.fn();
const createRegistrationFormVersionForAdminMock = vi.fn();
const publishRegistrationFormVersionForAdminMock = vi.fn();

vi.mock("../application/event.js", () => ({
  createEventAnnouncementForAdmin: createEventAnnouncementForAdminMock,
  createEventDocumentForAdmin: createEventDocumentForAdminMock,
  createEventForAdmin: createEventForAdminMock,
  createRegistrationFormVersionForAdmin: createRegistrationFormVersionForAdminMock,
  deleteEventAnnouncementForAdmin: vi.fn(),
  deleteEventDocumentForAdmin: vi.fn(),
  deleteEventForAdmin: deleteEventForAdminMock,
  deleteRegistrationFormVersionForAdmin: vi.fn(),
  getAdminEventById: getAdminEventByIdMock,
  getPublicEventBySeasonAndCode: getPublicEventBySeasonAndCodeMock,
  listAdminEvents: listAdminEventsMock,
  publishRegistrationFormVersionForAdmin: publishRegistrationFormVersionForAdminMock,
  updateEventAnnouncementForAdmin: vi.fn(),
  updateEventDocumentForAdmin: vi.fn(),
  updateEventForAdmin: updateEventForAdminMock,
  updateRegistrationFormVersionForAdmin: vi.fn(),
}));

const { appRouter } = await import("../../../app-router.js");

const ADMIN_SESSION: AuthContextSession = {
  session: {
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    id: "session-admin",
    userId: "user-admin",
  },
  user: {
    email: "admin@example.com",
    emailVerified: true,
    id: "user-admin",
    name: "Admin User",
    systemRole: "ADMIN",
  },
};

const MANAGER_SESSION: AuthContextSession = {
  ...ADMIN_SESSION,
  session: {
    ...ADMIN_SESSION.session,
    id: "session-manager",
    userId: "user-manager",
  },
  user: {
    ...ADMIN_SESSION.user,
    email: "manager@example.com",
    id: "user-manager",
    name: "Manager User",
    systemRole: "MANAGER",
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

const ADMIN_SUMMARY: AdminEventSummary = {
  eventCode: "VNCMP",
  eventEndsAt: "2026-07-12T10:00:00.000Z",
  eventKey: "2026/VNCMP",
  eventStartsAt: "2026-07-10T10:00:00.000Z",
  id: "event-1",
  location: "Ho Chi Minh City",
  name: "Vietnam Championship",
  season: "2026",
  status: "registration_open",
  updatedAt: "2026-01-02T00:00:00.000Z",
  venue: "SECC",
};

const ADMIN_DOCUMENT: AdminEventDocument = {
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "document-1",
  isPublic: true,
  kind: "pdf",
  sortOrder: 0,
  title: "Venue Packet",
  updatedAt: "2026-01-02T00:00:00.000Z",
  url: "https://example.com/venue.pdf",
};

const FORM_VERSION: AdminRegistrationFormVersion = {
  createdAt: "2026-01-01T00:00:00.000Z",
  definition: { fields: [] },
  id: "form-1",
  isPublished: true,
  publishedAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  versionNumber: 1,
};

const ADMIN_DETAIL: AdminEventDetail = {
  announcements: [],
  documents: [ADMIN_DOCUMENT],
  event: {
    createdAt: "2026-01-01T00:00:00.000Z",
    description: "National championship",
    eventCode: "VNCMP",
    eventEndsAt: "2026-07-12T10:00:00.000Z",
    eventKey: "2026/VNCMP",
    eventStartsAt: "2026-07-10T10:00:00.000Z",
    id: "event-1",
    location: "Ho Chi Minh City",
    maxParticipants: 48,
    name: "Vietnam Championship",
    registrationEndsAt: "2026-06-20T10:00:00.000Z",
    registrationStartsAt: "2026-05-20T10:00:00.000Z",
    season: "2026",
    status: "registration_open",
    summary: "Season final event",
    timezone: "Asia/Ho_Chi_Minh",
    updatedAt: "2026-01-02T00:00:00.000Z",
    venue: "SECC",
  },
  registrationFormVersions: [FORM_VERSION],
};

const PUBLIC_DETAIL: PublicEventDetail = {
  announcements: [],
  documents: [ADMIN_DOCUMENT],
  event: ADMIN_DETAIL.event,
  publishedRegistrationFormVersion: FORM_VERSION,
};

describe("eventRouter e2e", () => {
  beforeEach(() => {
    createEventForAdminMock.mockReset();
    updateEventForAdminMock.mockReset();
    deleteEventForAdminMock.mockReset();
    listAdminEventsMock.mockReset();
    getAdminEventByIdMock.mockReset();
    getPublicEventBySeasonAndCodeMock.mockReset();
    createEventDocumentForAdminMock.mockReset();
    createEventAnnouncementForAdminMock.mockReset();
    createRegistrationFormVersionForAdminMock.mockReset();
    publishRegistrationFormVersionForAdminMock.mockReset();
  });

  it("allows public event reads by season and event code", async () => {
    getPublicEventBySeasonAndCodeMock.mockResolvedValue(PUBLIC_DETAIL);

    const client = createClient(null);
    const result = await client.event.getPublicEvent({
      eventCode: "VNCMP",
      season: "2026",
    });

    expect(getPublicEventBySeasonAndCodeMock).toHaveBeenCalledWith("2026", "VNCMP");
    expect(result).toEqual(PUBLIC_DETAIL);
  });

  it("rejects unauthenticated admin event calls", async () => {
    const client = createClient(null);

    await expect(
      client.event.listAdminEvents({
        includeDeleted: false,
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource.",
    });
  });

  it("rejects managers from event CRUD", async () => {
    const client = createClient(MANAGER_SESSION);

    await expect(client.event.getAdminEvent({ id: "event-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "You must be an admin to access this resource.",
    });
  });

  it("forwards admin event list and detail calls", async () => {
    listAdminEventsMock.mockResolvedValue([ADMIN_SUMMARY]);
    getAdminEventByIdMock.mockResolvedValue(ADMIN_DETAIL);

    const client = createClient(ADMIN_SESSION);

    await expect(client.event.listAdminEvents({ includeDeleted: false })).resolves.toEqual([
      ADMIN_SUMMARY,
    ]);
    await expect(client.event.getAdminEvent({ id: "event-1" })).resolves.toEqual(ADMIN_DETAIL);
    expect(listAdminEventsMock).toHaveBeenCalledWith({ includeDeleted: false });
    expect(getAdminEventByIdMock).toHaveBeenCalledWith("event-1");
  });

  it("forwards create, update, and delete event mutations", async () => {
    createEventForAdminMock.mockResolvedValue(ADMIN_DETAIL);
    updateEventForAdminMock.mockResolvedValue(ADMIN_DETAIL);
    deleteEventForAdminMock.mockResolvedValue({ success: true });

    const client = createClient(ADMIN_SESSION);
    const input = {
      eventCode: "VNCMP",
      eventEndsAt: "2026-07-12T10:00:00.000Z",
      eventStartsAt: "2026-07-10T10:00:00.000Z",
      name: "Vietnam Championship",
      season: "2026",
      status: "registration_open" as const,
    };

    await expect(client.event.createEvent(input)).resolves.toEqual(ADMIN_DETAIL);
    await expect(client.event.updateEvent({ ...input, id: "event-1" })).resolves.toEqual(
      ADMIN_DETAIL,
    );
    await expect(client.event.deleteEvent({ id: "event-1" })).resolves.toEqual({ success: true });
    expect(deleteEventForAdminMock).toHaveBeenCalledWith("user-admin", { id: "event-1" });
  });

  it("forwards nested resource and registration form mutations", async () => {
    createEventDocumentForAdminMock.mockResolvedValue(ADMIN_DOCUMENT);
    createRegistrationFormVersionForAdminMock.mockResolvedValue(FORM_VERSION);
    publishRegistrationFormVersionForAdminMock.mockResolvedValue(FORM_VERSION);

    const client = createClient(ADMIN_SESSION);

    await expect(
      client.event.createEventDocument({
        eventId: "event-1",
        kind: "pdf",
        title: "Venue Packet",
        url: "https://example.com/venue.pdf",
      }),
    ).resolves.toEqual(ADMIN_DOCUMENT);
    await expect(
      client.event.createRegistrationFormVersion({
        definition: { fields: [] },
        eventId: "event-1",
        isPublished: true,
      }),
    ).resolves.toEqual(FORM_VERSION);
    await expect(
      client.event.publishRegistrationFormVersion({
        eventId: "event-1",
        id: "form-1",
      }),
    ).resolves.toEqual(FORM_VERSION);
    expect(createRegistrationFormVersionForAdminMock).toHaveBeenCalledWith("user-admin", {
      definition: { fields: [] },
      eventId: "event-1",
      isPublished: true,
    });
  });

  it("surfaces duplicate event conflicts from the application layer", async () => {
    createEventForAdminMock.mockRejectedValue(
      new ORPCError("CONFLICT", {
        message: "Event 2026/VNCMP already exists.",
      }),
    );

    const client = createClient(ADMIN_SESSION);

    await expect(
      client.event.createEvent({
        eventCode: "VNCMP",
        eventEndsAt: "2026-07-12T10:00:00.000Z",
        eventStartsAt: "2026-07-10T10:00:00.000Z",
        name: "Vietnam Championship",
        season: "2026",
        status: "published",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Event 2026/VNCMP already exists.",
    });
  });

  it("allows the same event code under different seasons", async () => {
    createEventForAdminMock.mockResolvedValue(ADMIN_DETAIL);

    const client = createClient(ADMIN_SESSION);
    const baseInput = {
      eventCode: "VNCMP",
      eventEndsAt: "2025-07-12T10:00:00.000Z",
      eventStartsAt: "2025-07-10T10:00:00.000Z",
      name: "Vietnam Championship",
      status: "published" as const,
    };

    await expect(
      client.event.createEvent({ ...baseInput, season: "2025" }),
    ).resolves.toEqual(ADMIN_DETAIL);
    await expect(
      client.event.createEvent({
        ...baseInput,
        eventEndsAt: "2026-07-12T10:00:00.000Z",
        eventStartsAt: "2026-07-10T10:00:00.000Z",
        season: "2026",
      }),
    ).resolves.toEqual(ADMIN_DETAIL);

    expect(createEventForAdminMock).toHaveBeenCalledTimes(2);
    expect(createEventForAdminMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ eventCode: "VNCMP", season: "2025" }),
    );
    expect(createEventForAdminMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ eventCode: "VNCMP", season: "2026" }),
    );
  });

  it("rejects unknown keys on createEvent input (strict object)", async () => {
    const client = createClient(ADMIN_SESSION);

    await expect(
      client.event.createEvent({
        eventCode: "VNCMP",
        eventEndsAt: "2026-07-12T10:00:00.000Z",
        eventStartsAt: "2026-07-10T10:00:00.000Z",
        name: "Vietnam Championship",
        season: "2026",
        status: "published",
        // @ts-expect-error - unknown property must be rejected by strictObject
        unexpected: "nope",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(createEventForAdminMock).not.toHaveBeenCalled();
  });
});
