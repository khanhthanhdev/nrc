import type { EvlogVariables } from "evlog/hono";
import type { Hono } from "hono";

import { uploadHandler } from "./handler";

export const registerUploadRoute = (app: Hono<EvlogVariables>): void => {
  app.post("/api/upload", (c) => uploadHandler(c.req.raw));
};
