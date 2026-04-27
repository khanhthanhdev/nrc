import type { EvlogVariables } from "evlog/hono";
import type { Hono } from "hono";

import { downloadFile } from "../../adapters/storage/s3";
import { uploadHandler } from "./handler";

export const registerUploadRoute = (app: Hono<EvlogVariables>): void => {
  app.post("/api/upload", (c) => uploadHandler(c.req.raw));
  app.get("/api/upload/document", async (c) => {
    const key = c.req.query("key")?.trim();

    if (!key) {
      return c.json({ message: "Missing upload key." }, 400);
    }

    let file: Awaited<ReturnType<typeof downloadFile>>;

    try {
      file = await downloadFile(key);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const errorName =
        error && typeof error === "object" && "name" in error
          ? String(error.name).toLowerCase()
          : "";
      const errorCode =
        error && typeof error === "object" && "code" in error
          ? String(error.code).toLowerCase()
          : "";

      if (
        message.includes("not found") ||
        message.includes("does not exist") ||
        message.includes("nosuchkey") ||
        message.includes("no such key") ||
        errorName === "nosuchkey" ||
        errorCode === "nosuchkey"
      ) {
        return c.json({ message: "Uploaded document not found." }, 404);
      }

      return c.json({ message: "Unable to load uploaded document." }, 502);
    }

    if (!file.body) {
      return c.json({ message: "Uploaded document not found." }, 404);
    }

    const fileName = key.split("/").at(-1) ?? "document";
    const headers = new Headers({
      "content-disposition": `inline; filename="${fileName}"`,
      "content-type": file.contentType ?? "application/octet-stream",
    });

    if (file.contentLength) {
      headers.set("content-length", String(file.contentLength));
    }

    return new Response(file.body, {
      headers,
      status: 200,
    });
  });
};
