import type { Hono } from "hono";

import { auth } from "../../auth/auth";

export const registerAuthRoute = (app: Hono): void => {
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
};
