import type { Hono } from "hono";

export const registerRootRoute = (app: Hono): void => {
  app.get("/", (c) => c.text("OK"));
};
