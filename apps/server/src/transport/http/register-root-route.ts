import type { EvlogVariables } from "evlog/hono";
import type { Hono } from "hono";

export const registerRootRoute = (app: Hono<EvlogVariables>): void => {
  app.get("/", (c) => {
    const log = c.get("log");

    log.set({ route: "/" });

    return c.text("OK");
  });
};
