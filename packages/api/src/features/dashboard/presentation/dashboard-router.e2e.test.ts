import { ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthContextSession } from "../../../shared/context";

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

const getStaffDashboardMock = vi.fn();
const getUserDashboardMock = vi.fn();

vi.mock("../application/dashboard.js", () => ({
  getStaffDashboard: getStaffDashboardMock,
  getUserDashboard: getUserDashboardMock,
}));

const { appRouter } = await import("../../../app-router.js");
const { createTestClient } = await import("../../../test-utils/create-test-client.js");

const sessionForRole = (systemRole: "USER" | "MANAGER" | "ADMIN"): AuthContextSession => ({
  session: {
    activeOrganizationId: "org-1",
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    id: "session-1",
    userId: `${systemRole.toLowerCase()}-1`,
  },
  user: {
    email: `${systemRole.toLowerCase()}@example.com`,
    emailVerified: true,
    id: `${systemRole.toLowerCase()}-1`,
    name: `${systemRole} User`,
    systemRole,
  },
});

describe("dashboard router", () => {
  beforeEach(() => {
    getStaffDashboardMock.mockReset();
    getUserDashboardMock.mockReset();
  });

  it("rejects unauthenticated user dashboard calls", async () => {
    const client = createTestClient(appRouter, { session: null });

    await expect(client.dashboard.getUserDashboard()).rejects.toBeInstanceOf(ORPCError);
    expect(getUserDashboardMock).not.toHaveBeenCalled();
  });

  it("returns normal user dashboard data", async () => {
    const data = {
      activeTeam: null,
      notifications: [],
      registrationStatusCounts: {},
      registrations: [],
      tasks: [],
      upcomingEvents: [],
    };
    getUserDashboardMock.mockResolvedValue(data);
    const session = sessionForRole("USER");
    const client = createTestClient(appRouter, { session });

    await expect(client.dashboard.getUserDashboard()).resolves.toEqual(data);
    expect(getUserDashboardMock).toHaveBeenCalledWith(session, "en");
  });

  it("rejects normal users from staff dashboard", async () => {
    const client = createTestClient(appRouter, { session: sessionForRole("USER") });

    await expect(client.dashboard.getStaffDashboard()).rejects.toBeInstanceOf(ORPCError);
    expect(getStaffDashboardMock).not.toHaveBeenCalled();
  });

  it("allows admin staff dashboard calls", async () => {
    const data = {
      activeEventCount: 2,
      activeSeasonCount: 1,
      notifications: [],
      pendingRegistrationCount: 3,
      recentRegistrations: [],
      scopedEventCount: null,
      syncAttentionCount: 0,
      upcomingEvents: [],
    };
    getStaffDashboardMock.mockResolvedValue(data);
    const session = sessionForRole("ADMIN");
    const client = createTestClient(appRouter, { session });

    await expect(client.dashboard.getStaffDashboard()).resolves.toEqual(data);
    expect(getStaffDashboardMock).toHaveBeenCalledWith(session, "en");
  });

  it("allows manager staff dashboard calls", async () => {
    const data = {
      activeEventCount: 1,
      activeSeasonCount: 1,
      notifications: [],
      pendingRegistrationCount: 1,
      recentRegistrations: [],
      scopedEventCount: 1,
      syncAttentionCount: 0,
      upcomingEvents: [],
    };
    getStaffDashboardMock.mockResolvedValue(data);
    const session = sessionForRole("MANAGER");
    const client = createTestClient(appRouter, { session });

    await expect(client.dashboard.getStaffDashboard()).resolves.toEqual(data);
    expect(getStaffDashboardMock).toHaveBeenCalledWith(session, "en");
  });
});
