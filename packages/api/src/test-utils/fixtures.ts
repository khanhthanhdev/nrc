import { vi } from "vitest";

import type { AuthAdminContext, AuthContextSession } from "../shared/context.js";

export const TEST_ENV_DEFAULTS = {
  BETTER_AUTH_SECRET: "test",
  BETTER_AUTH_URL: "http://localhost",
  CORS_ORIGIN: "http://localhost",
  DATABASE_URL: "postgresql://localhost/test",
  GOOGLE_CLIENT_ID: "test",
  GOOGLE_CLIENT_SECRET: "test",
} as const;

export const ensureTestEnv = (): void => {
  for (const [key, value] of Object.entries(TEST_ENV_DEFAULTS)) {
    process.env[key] ??= value;
  }
};

export const ADMIN_SESSION: AuthContextSession = {
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

export const MANAGER_SESSION: AuthContextSession = {
  session: {
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    id: "session-manager",
    userId: "user-manager",
  },
  user: {
    email: "manager@example.com",
    emailVerified: true,
    id: "user-manager",
    name: "Manager User",
    systemRole: "MANAGER",
  },
};

export const TEST_SESSION: AuthContextSession = {
  session: {
    activeOrganizationId: "organization-1",
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

export const MENTOR_SESSION: AuthContextSession = {
  session: {
    activeOrganizationId: "organization-1",
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    id: "session-mentor",
    userId: "user-mentor",
  },
  user: {
    email: "mentor@example.com",
    emailVerified: true,
    id: "user-mentor",
    name: "Mentor User",
    systemRole: "USER",
  },
};

export const createTestAuthAdmin = (): AuthAdminContext => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
});

export const createSessionWithUserId = (userId: string, overrides?: Partial<AuthContextSession>): AuthContextSession => ({
  ...TEST_SESSION,
  ...overrides,
  session: {
    ...TEST_SESSION.session,
    ...overrides?.session,
    userId,
  },
});

export const createAdminSessionWithUserId = (userId: string): AuthContextSession => ({
  ...ADMIN_SESSION,
  session: {
    ...ADMIN_SESSION.session,
    userId,
  },
});
