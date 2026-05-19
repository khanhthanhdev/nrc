import { describe, expect, it } from "vitest";

import { normalizeAuthSession } from "./session.js";

const futureExpiresAt = () => new Date(Date.now() + 60_000);

describe("normalizeAuthSession", () => {
  it("round-trips activeOrganizationId from the Better Auth session payload", () => {
    const session = normalizeAuthSession({
      session: {
        activeOrganizationId: "org_123",
        expiresAt: futureExpiresAt(),
        id: "session_123",
        userId: "user_123",
      },
      user: {
        email: "user@example.com",
        emailVerified: true,
        id: "user_123",
        name: "User",
        systemRole: "USER",
        userType: "MENTOR",
      },
    });

    expect(session?.session.activeOrganizationId).toBe("org_123");
  });

  it("normalizes missing activeOrganizationId to null", () => {
    const session = normalizeAuthSession({
      session: {
        expiresAt: futureExpiresAt(),
        id: "session_123",
        userId: "user_123",
      },
      user: {
        email: "user@example.com",
        emailVerified: true,
        id: "user_123",
        name: "User",
      },
    });

    expect(session?.session.activeOrganizationId).toBeNull();
  });
});
