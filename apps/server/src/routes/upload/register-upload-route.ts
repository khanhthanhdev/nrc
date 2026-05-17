import type { EvlogVariables } from "evlog/hono";
import type { Hono } from "hono";
import { and, eq, isNull } from "drizzle-orm";

import { db, uploadedFiles } from "@nrc-full/db";
import { getDownloadUrl } from "../../adapters/storage/s3";
import { getAuthSessionFromHeaders } from "../../auth/session";
import { uploadHandler } from "./handler";

const getDownloadFilename = (key: string, fallbackFilename: string) =>
  (key.split("/").at(-1) ?? fallbackFilename)
    // Strip control characters, quotes, backslashes, and newlines to prevent header injection
    .replaceAll(/[\u0000-\u001f"\\]/g, "_")
    .replaceAll(/[\r\n]/g, "_");

const getImageDownloadUrl = (key: string, fallbackFilename: string) =>
  getDownloadUrl(key, {
    expiresIn: 300, // 5 minutes
    responseContentDisposition: `inline; filename="${getDownloadFilename(key, fallbackFilename)}"`,
  });

const getAttachmentDownloadUrl = (key: string, fallbackFilename: string) =>
  getDownloadUrl(key, {
    expiresIn: 300, // 5 minutes
    responseContentDisposition: `attachment; filename="${getDownloadFilename(key, fallbackFilename)}"`,
  });

const authorizeDownload = async (headers: Headers, key: string) => {
  const session = await getAuthSessionFromHeaders(headers);

  if (!session) {
    return { error: { message: "Unauthorized.", status: 401 } };
  }

  const [file] = await db
    .select({ userId: uploadedFiles.userId })
    .from(uploadedFiles)
    .where(and(eq(uploadedFiles.s3Key, key), isNull(uploadedFiles.deletedAt)))
    .limit(1);

  if (!file && session.user.systemRole !== "ADMIN") {
    return { error: { message: "Uploaded file not found.", status: 404 } };
  }

  if (file && session.user.systemRole !== "ADMIN" && file.userId !== session.user.id) {
    return { error: { message: "Forbidden.", status: 403 } };
  }

  return { error: null };
};

export const registerUploadRoute = (app: Hono<EvlogVariables>): void => {
  app.post("/api/upload", (c) => uploadHandler(c.req.raw));

  app.get("/api/upload/image", async (c) => {
    const key = c.req.query("key")?.trim();

    if (!key) {
      return c.json({ message: "Missing upload key." }, 400);
    }

    const authorization = await authorizeDownload(c.req.raw.headers, key);

    if (authorization.error) {
      return c.json(
        { message: authorization.error.message },
        authorization.error.status as 401 | 403 | 404,
      );
    }

    try {
      const url = await getImageDownloadUrl(key, "image");

      return c.redirect(url, 302);
    } catch (error) {
      return c.json({ message: "Unable to generate download URL." }, 502);
    }
  });

  app.get("/api/upload/document", async (c) => {
    const key = c.req.query("key")?.trim();

    if (!key) {
      return c.json({ message: "Missing upload key." }, 400);
    }

    const authorization = await authorizeDownload(c.req.raw.headers, key);

    if (authorization.error) {
      return c.json(
        { message: authorization.error.message },
        authorization.error.status as 401 | 403 | 404,
      );
    }

    try {
      const url = await getAttachmentDownloadUrl(key, "document");

      return c.redirect(url, 302);
    } catch (error) {
      return c.json({ message: "Unable to generate download URL." }, 502);
    }
  });
};
