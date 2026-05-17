import { createContext } from "@nrc-full/api/shared/context";
import type { EvlogVariables } from "evlog/hono";
import type { Context, Next } from "hono";
import type { Hono } from "hono";

import { env } from "@nrc-full/env/server";
import { getCookie, setCookie } from "hono/cookie";

import { createAuthAdminContext } from "../../auth/admin-context";
import { getAuthSessionFromHeaders } from "../../auth/session";
import { registrationRateLimiter } from "./register-rate-limit";
import { apiHandler, rpcHandler } from "./orpc-handlers";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_COOKIE_NAME = "nrc_csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

const createCsrfToken = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const ensureCsrfCookie = (c: Context): string => {
  const existingToken = getCookie(c, CSRF_COOKIE_NAME);

  if (existingToken) {
    return existingToken;
  }

  const token = createCsrfToken();

  setCookie(c, CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "Lax",
    secure: env.NODE_ENV === "production",
  });

  return token;
};

/**
 * CSRF protection middleware
 * Requires same-site origin plus a double-submit CSRF token for state-changing RPC requests.
 */
const csrfProtection = async (c: Context, next: Next) => {
  const csrfToken = ensureCsrfCookie(c);

  // Skip CSRF check for safe methods
  if (SAFE_METHODS.has(c.req.method)) {
    await next();
    return;
  }

  const origin = c.req.header("origin");
  const referer = c.req.header("referer");

  // If no origin/referer, check for same-origin request
  if (!origin && !referer) {
    const host = c.req.header("host");
    const requestUrl = new URL(c.req.url);

    // Allow same-origin requests without explicit origin (e.g., form submissions)
    if (requestUrl.host !== host) {
      return c.json({ error: "CSRF validation failed" }, 403);
    }
  }

  // Validate origin against allowed origins
  if (origin) {
    const allowedOrigins = env.CORS_ORIGIN.split(",").map((o: string) => o.trim());
    const authOrigin = new URL(env.BETTER_AUTH_URL).origin;

    if (!allowedOrigins.includes(origin) && origin !== authOrigin) {
      return c.json({ error: "CSRF validation failed" }, 403);
    }
  }

  const submittedToken = c.req.header(CSRF_HEADER_NAME);

  if (!submittedToken || submittedToken !== csrfToken) {
    return c.json({ error: "CSRF validation failed" }, 403);
  }

  await next();
};

export const registerOrpcMiddleware = (app: Hono<EvlogVariables>): void => {
  app.get("/rpc/csrf-token", (c) => {
    const csrfToken = ensureCsrfCookie(c);

    return c.json({ csrfToken });
  });

  app.use("/rpc/*", csrfProtection);

  // Apply rate limiting to registration endpoints
  app.use("/rpc/registration/*", registrationRateLimiter);

  app.use("/*", async (c, next) => {
    if (c.req.path.startsWith("/api/auth")) {
      await next();
      return;
    }

    const { headers } = c.req.raw;
    const session = await getAuthSessionFromHeaders(headers);
    const context = await createContext({
      authAdmin: createAuthAdminContext(headers),
      session,
    });

    const rpcResult = await rpcHandler.handle(c.req.raw, {
      context,
      prefix: "/rpc",
    });

    if (rpcResult.matched) {
      return c.newResponse(rpcResult.response.body, rpcResult.response);
    }

    const apiResult = await apiHandler.handle(c.req.raw, {
      context,
      prefix: "/api-reference",
    });

    if (apiResult.matched) {
      return c.newResponse(apiResult.response.body, apiResult.response);
    }

    await next();
  });
};
