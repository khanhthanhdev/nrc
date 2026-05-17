import { evlog } from "evlog/hono";
import type { EvlogVariables } from "evlog/hono";
import { createAuthMiddleware, maskEmail } from "evlog/better-auth";
import { env } from "@nrc-full/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { auth } from "../auth/auth";

const getActionArea = (path: string): string => {
  if (path.startsWith("/api/auth")) {
    return "auth";
  }

  if (path.startsWith("/api/upload")) {
    return "upload";
  }

  if (path.startsWith("/rpc")) {
    return "rpc";
  }

  if (path.startsWith("/api-reference")) {
    return "api_reference";
  }

  if (path === "/") {
    return "healthcheck";
  }

  return "http";
};

const getActionName = (method: string, path: string): string =>
  `${getActionArea(path)}.${method.toLowerCase()}`;

const identify = createAuthMiddleware(auth, {
  maskEmail: true,
  onAnonymous: (log) => {
    log.set({
      actor: {
        authenticated: false,
        type: "anonymous",
      },
    });
  },
  onIdentify: (log, session) => {
    const rawEmail = session.user.email;
    const rawName = session.user.name;
    const rawEmailVerified = session.user.emailVerified;
    const rawCreatedAt = session.user.createdAt;
    let createdAt: string | undefined;

    if (rawCreatedAt instanceof Date) {
      createdAt = rawCreatedAt.toISOString();
    } else if (typeof rawCreatedAt === "string") {
      createdAt = rawCreatedAt;
    }

    log.set({
      actor: {
        authenticated: true,
        createdAt,
        email: typeof rawEmail === "string" ? maskEmail(rawEmail) : undefined,
        emailVerified: typeof rawEmailVerified === "boolean" ? rawEmailVerified : undefined,
        id: String(session.user.id),
        name: typeof rawName === "string" ? rawName : undefined,
        type: "user",
      },
    });
  },
});

export const createApp = (): Hono<EvlogVariables> => {
  const app = new Hono<EvlogVariables>();

  app.use(evlog());
  app.use("/*", async (c, next) => {
    const log = c.get("log");
    const { method, path } = c.req;

    log.set({
      action: {
        area: getActionArea(path),
        at: new Date().toISOString(),
        method,
        name: getActionName(method, path),
        target: path,
      },
    });

    await identify(log, c.req.raw.headers, path);

    await next();
  });
  // CORS configuration: supports single origin or comma-separated list of origins
  // For staging/preview deployments, set CORS_ORIGIN to include multiple origins:
  // CORS_ORIGIN=https://app.example.com,https://staging.example.com
  app.use(
    "/*",
    cors({
      allowMethods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      origin: (origin) => {
        const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
        // Allow requests with no origin (e.g., server-to-server, mobile apps)
        if (!origin) return allowedOrigins[0];
        return allowedOrigins.includes(origin) ? origin : "";
      },
    }),
  );

  return app;
};
