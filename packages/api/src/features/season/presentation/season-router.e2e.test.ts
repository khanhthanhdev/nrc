import type { RouterClient } from "@orpc/server";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppRouter } from "../../../app-router";
import type { AuthContextSession } from "../../../shared/context";
import type {
  AdminSeasonAnnouncement,
  AdminSeasonDetail,
  AdminSeasonDocument,
  AdminSeasonSummary,
  PublicSeasonPage,
} from "../application/season";

const createSeasonForAdminMock = vi.fn();
const createSeasonAnnouncementForAdminMock = vi.fn();
const createSeasonDocumentForAdminMock = vi.fn();
const deleteSeasonForAdminMock = vi.fn();
const deleteSeasonAnnouncementForAdminMock = vi.fn();
const deleteSeasonDocumentForAdminMock = vi.fn();
const getAdminSeasonByYearMock = vi.fn();
const getPublicSeasonPageByYearMock = vi.fn();
const listAdminSeasonsMock = vi.fn();
const updateSeasonForAdminMock = vi.fn();
const updateSeasonAnnouncementForAdminMock = vi.fn();
const updateSeasonDocumentForAdminMock = vi.fn();

vi.mock("../application/season.js", () => ({
  createSeasonAnnouncementForAdmin: createSeasonAnnouncementForAdminMock,
  createSeasonDocumentForAdmin: createSeasonDocumentForAdminMock,
  createSeasonForAdmin: createSeasonForAdminMock,
  deleteSeasonAnnouncementForAdmin: deleteSeasonAnnouncementForAdminMock,
  deleteSeasonDocumentForAdmin: deleteSeasonDocumentForAdminMock,
  deleteSeasonForAdmin: deleteSeasonForAdminMock,
  getAdminSeasonByYear: getAdminSeasonByYearMock,
  getPublicSeasonPageByYear: getPublicSeasonPageByYearMock,
  listAdminSeasons: listAdminSeasonsMock,
  updateSeasonAnnouncementForAdmin: updateSeasonAnnouncementForAdminMock,
  updateSeasonDocumentForAdmin: updateSeasonDocumentForAdminMock,
  updateSeasonForAdmin: updateSeasonForAdminMock,
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

const PUBLIC_PAGE: PublicSeasonPage = {
  announcements: [],
  documents: [],
  events: [],
  season: {
    description: "Explore the unknown depths and engineer your way to victory.",
    gameCode: "ITD-2026",
    id: "season-2026",
    isActive: true,
    theme: "Into the Deep",
    year: "2026",
  },
  seasonOptions: [
    {
      gameCode: "ITD-2026",
      isActive: true,
      theme: "Into the Deep",
      year: "2026",
    },
  ],
};

const ADMIN_SUMMARIES: AdminSeasonSummary[] = [
  {
    gameCode: "ITD-2026",
    isActive: true,
    theme: "Into the Deep",
    updatedAt: "2026-02-01T00:00:00.000Z",
    year: "2026",
  },
];

const ADMIN_DOCUMENT: AdminSeasonDocument = {
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "document-1",
  kind: "pdf",
  sortOrder: 0,
  title: "Game Manual",
  updatedAt: "2026-01-02T00:00:00.000Z",
  url: "https://example.com/manual.pdf",
};

const ADMIN_ANNOUNCEMENT: AdminSeasonAnnouncement = {
  body: "Registration is open.",
  createdAt: "2026-09-01T00:00:00.000Z",
  id: "announcement-1",
  isPinned: true,
  publishedAt: "2026-09-01T00:00:00.000Z",
  sortOrder: 0,
  title: "Registration Open",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const ADMIN_DETAIL: AdminSeasonDetail = {
  announcements: [ADMIN_ANNOUNCEMENT],
  documents: [ADMIN_DOCUMENT],
  events: [],
  season: {
    createdAt: "2026-01-01T00:00:00.000Z",
    description: "Explore the unknown depths and engineer your way to victory.",
    gameCode: "ITD-2026",
    id: "season-2026",
    isActive: true,
    theme: "Into the Deep",
    updatedAt: "2026-02-01T00:00:00.000Z",
    year: "2026",
  },
};

describe("seasonRouter e2e", () => {
  beforeEach(() => {
    createSeasonForAdminMock.mockReset();
    createSeasonAnnouncementForAdminMock.mockReset();
    createSeasonDocumentForAdminMock.mockReset();
    deleteSeasonForAdminMock.mockReset();
    deleteSeasonAnnouncementForAdminMock.mockReset();
    deleteSeasonDocumentForAdminMock.mockReset();
    getAdminSeasonByYearMock.mockReset();
    getPublicSeasonPageByYearMock.mockReset();
    listAdminSeasonsMock.mockReset();
    updateSeasonForAdminMock.mockReset();
    updateSeasonAnnouncementForAdminMock.mockReset();
    updateSeasonDocumentForAdminMock.mockReset();
  });

  it("allows unauthenticated public season reads", async () => {
    getPublicSeasonPageByYearMock.mockResolvedValue(PUBLIC_PAGE);

    const client = createClient(null);
    const result = await client.season.getPublicSeasonPage({
      year: "2026",
    });

    expect(getPublicSeasonPageByYearMock).toHaveBeenCalledWith("2026");
    expect(result).toEqual(PUBLIC_PAGE);
  });

  it("rejects unauthenticated admin season reads", async () => {
    const client = createClient(null);

    await expect(
      client.season.listAdminSeasons({
        includeDeleted: false,
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "You must be signed in to access this resource.",
    });
  });

  it("rejects manager access to season admin endpoints", async () => {
    const client = createClient(MANAGER_SESSION);

    await expect(
      client.season.getAdminSeason({
        year: "2026",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "You must be an admin to access this resource.",
    });
  });

  it("rejects invalid season creation input before the application layer", async () => {
    const client = createClient(ADMIN_SESSION);

    await expect(
      client.season.createSeason({
        gameCode: "ITD-2026",
        theme: "Into the Deep",
        year: "26",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(createSeasonForAdminMock).not.toHaveBeenCalled();
  });

  it("forwards admin season detail reads", async () => {
    getAdminSeasonByYearMock.mockResolvedValue(ADMIN_DETAIL);

    const client = createClient(ADMIN_SESSION);
    const result = await client.season.getAdminSeason({
      year: "2026",
    });

    expect(getAdminSeasonByYearMock).toHaveBeenCalledWith("2026");
    expect(result).toEqual(ADMIN_DETAIL);
  });

  it("forwards admin season listings", async () => {
    listAdminSeasonsMock.mockResolvedValue(ADMIN_SUMMARIES);

    const client = createClient(ADMIN_SESSION);
    const result = await client.season.listAdminSeasons({
      includeDeleted: false,
    });

    expect(listAdminSeasonsMock).toHaveBeenCalledWith({
      includeDeleted: false,
    });
    expect(result).toEqual(ADMIN_SUMMARIES);
  });

  it("passes the actor id when deleting a season", async () => {
    deleteSeasonForAdminMock.mockResolvedValue({
      success: true,
    });

    const client = createClient(ADMIN_SESSION);
    const result = await client.season.deleteSeason({
      year: "2026",
    });

    expect(deleteSeasonForAdminMock).toHaveBeenCalledWith("user-admin", {
      year: "2026",
    });
    expect(result).toEqual({
      success: true,
    });
  });

  it("forwards document and announcement creation for admins", async () => {
    createSeasonDocumentForAdminMock.mockResolvedValue(ADMIN_DOCUMENT);
    createSeasonAnnouncementForAdminMock.mockResolvedValue(ADMIN_ANNOUNCEMENT);

    const client = createClient(ADMIN_SESSION);
    const documentResult = await client.season.createSeasonDocument({
      kind: "pdf",
      seasonYear: "2026",
      title: "Game Manual",
      url: "https://example.com/manual.pdf",
    });
    const announcementResult = await client.season.createSeasonAnnouncement({
      body: "Registration is open.",
      isPinned: true,
      publishedAt: "2026-09-01T00:00:00.000Z",
      seasonYear: "2026",
      sortOrder: 0,
      title: "Registration Open",
    });

    expect(documentResult).toEqual(ADMIN_DOCUMENT);
    expect(announcementResult).toEqual(ADMIN_ANNOUNCEMENT);
  });

  it("surfaces application errors from admin season mutations", async () => {
    createSeasonForAdminMock.mockRejectedValue(
      new ORPCError("CONFLICT", {
        message: "Season 2026 already exists.",
      }),
    );

    const client = createClient(ADMIN_SESSION);

    await expect(
      client.season.createSeason({
        gameCode: "ITD-2026",
        isActive: true,
        theme: "Into the Deep",
        year: "2026",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Season 2026 already exists.",
    });
  });
});
