import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RPCHandler } from "@orpc/server/fetch";

import type { AppRouter } from "../../../app-router.js";
import type { AuthContextSession } from "../../../shared/context.js";

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

describe("systemRouter e2e", () => {
  it("returns OK for unauthenticated health check", async () => {
    const client = createClient(null);
    // systemRouter is spread into appRouter, so healthCheck is at root level
    const result = await (client as any).healthCheck();
    expect(result).toBe("OK");
  });

  it("returns OK for authenticated health check", async () => {
    const session: AuthContextSession = {
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
        systemRole: "ADMIN",
      },
    };

    const client = createClient(session);
    // systemRouter is spread into appRouter, so healthCheck is at root level
    const result = await (client as any).healthCheck();
    expect(result).toBe("OK");
  });
});
