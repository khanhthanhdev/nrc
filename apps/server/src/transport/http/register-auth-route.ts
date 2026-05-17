import type { EvlogVariables } from "evlog/hono";
import type { Hono } from "hono";

import { auth, authRateLimiter } from "../../auth/auth";

export const registerAuthRoute = (app: Hono<EvlogVariables>): void => {
  app.use("/api/auth/*", authRateLimiter);
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
};
