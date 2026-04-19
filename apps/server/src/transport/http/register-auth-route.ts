import type { EvlogVariables } from "evlog/hono";
import type { Hono } from "hono";

import { auth } from "../../auth/auth";

export const registerAuthRoute = (app: Hono<EvlogVariables>): void => {
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
};
