import type { Hono } from "hono";

import { uploadHandler } from "./handler";

export const registerUploadRoute = (app: Hono): void => {
  app.post("/api/upload", (c) => uploadHandler(c.req.raw));
};
