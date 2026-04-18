import { env } from "@nrc-full/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

export const createApp = (): Hono => {
  const app = new Hono();

  app.use(logger());
  app.use(
    "/*",
    cors({
      allowMethods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      origin: env.CORS_ORIGIN,
    }),
  );

  return app;
};
