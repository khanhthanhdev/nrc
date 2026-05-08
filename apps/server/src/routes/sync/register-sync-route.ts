import {
  authenticateMachineClient,
  createSyncClient,
  getBatchDetail,
  getBootstrap,
  getSyncPolicy,
  listBatches,
  listSyncClients,
  pushSyncBatch,
  reviewChangeSet,
  revokeSyncClient,
  SyncApiError,
  updateSyncPolicy,
} from "@nrc-full/api/features/sync/application/sync";
import {
  createSyncClientRequestSchema,
  pushSyncBatchRequestSchema,
  reviewChangeSetRequestSchema,
  revokeSyncClientRequestSchema,
  updateSyncPolicyRequestSchema,
} from "@nrc-full/api/features/sync/schemas/sync";
import type { EvlogVariables } from "evlog/hono";
import type { Context, Hono } from "hono";
import * as v from "valibot";

import { getAuthSessionFromHeaders } from "../../auth/session";

const jsonError = (c: Context, error: unknown) => {
  if (error instanceof SyncApiError) {
    return c.json({ code: error.code, message: error.message }, error.status as 400);
  }

  if (error instanceof v.ValiError) {
    return c.json(
      { code: "VALIDATION_ERROR", issues: error.issues, message: "Invalid request." },
      400,
    );
  }

  console.error(error);
  return c.json({ code: "INTERNAL_SERVER_ERROR", message: "Internal server error." }, 500);
};

const requireAdmin = async (headers: Headers) => {
  const session = await getAuthSessionFromHeaders(headers);
  if (!session) {
    throw new SyncApiError(401, "UNAUTHORIZED", "Admin session required.");
  }
  if (session.user.systemRole !== "ADMIN") {
    throw new SyncApiError(403, "FORBIDDEN", "ADMIN role required.");
  }
  return session;
};

const parseBody = async <TSchema extends v.GenericSchema>(request: Request, schema: TSchema) =>
  v.parse(schema, await request.json());

export const registerSyncRoute = (app: Hono<EvlogVariables>): void => {
  app.get("/api/sync/v1/machine/bootstrap", async (c) => {
    try {
      const client = await authenticateMachineClient(c.req.header("authorization") ?? null);
      return c.json(await getBootstrap(client));
    } catch (error) {
      return jsonError(c, error);
    }
  });

  app.post("/api/sync/v1/machine/push", async (c) => {
    try {
      const client = await authenticateMachineClient(c.req.header("authorization") ?? null);
      const payload = await parseBody(c.req.raw, pushSyncBatchRequestSchema);
      return c.json(await pushSyncBatch(client, payload));
    } catch (error) {
      return jsonError(c, error);
    }
  });

  app.get("/api/sync/v1/admin/seasons/:season/events/:eventCode/clients", async (c) => {
    try {
      await requireAdmin(c.req.raw.headers);
      return c.json({
        clients: await listSyncClients(c.req.param("season"), c.req.param("eventCode")),
      });
    } catch (error) {
      return jsonError(c, error);
    }
  });

  app.post("/api/sync/v1/admin/seasons/:season/events/:eventCode/clients", async (c) => {
    try {
      const session = await requireAdmin(c.req.raw.headers);
      const body = await parseBody(c.req.raw, createSyncClientRequestSchema);
      return c.json(
        await createSyncClient(
          c.req.param("season"),
          c.req.param("eventCode"),
          body,
          session.user.id,
        ),
        201,
      );
    } catch (error) {
      return jsonError(c, error);
    }
  });

  app.post("/api/sync/v1/admin/clients/:clientId/revoke", async (c) => {
    try {
      const session = await requireAdmin(c.req.raw.headers);
      const body = await parseBody(c.req.raw, revokeSyncClientRequestSchema);
      return c.json(await revokeSyncClient(c.req.param("clientId"), body.reason, session.user.id));
    } catch (error) {
      return jsonError(c, error);
    }
  });

  app.get("/api/sync/v1/admin/seasons/:season/events/:eventCode/policy", async (c) => {
    try {
      await requireAdmin(c.req.raw.headers);
      return c.json(await getSyncPolicy(c.req.param("season"), c.req.param("eventCode")));
    } catch (error) {
      return jsonError(c, error);
    }
  });

  app.post("/api/sync/v1/admin/seasons/:season/events/:eventCode/policy", async (c) => {
    try {
      const session = await requireAdmin(c.req.raw.headers);
      const body = await parseBody(c.req.raw, updateSyncPolicyRequestSchema);
      return c.json(
        await updateSyncPolicy(
          c.req.param("season"),
          c.req.param("eventCode"),
          body,
          session.user.id,
        ),
      );
    } catch (error) {
      return jsonError(c, error);
    }
  });

  app.get("/api/sync/v1/admin/seasons/:season/events/:eventCode/batches", async (c) => {
    try {
      await requireAdmin(c.req.raw.headers);
      return c.json({
        batches: await listBatches(c.req.param("season"), c.req.param("eventCode")),
      });
    } catch (error) {
      return jsonError(c, error);
    }
  });

  app.get("/api/sync/v1/admin/batches/:pushBatchId", async (c) => {
    try {
      await requireAdmin(c.req.raw.headers);
      return c.json(await getBatchDetail(c.req.param("pushBatchId")));
    } catch (error) {
      return jsonError(c, error);
    }
  });

  app.post("/api/sync/v1/admin/batches/:changeSetId/review", async (c) => {
    try {
      const session = await requireAdmin(c.req.raw.headers);
      const body = await parseBody(c.req.raw, reviewChangeSetRequestSchema);
      return c.json(await reviewChangeSet(c.req.param("changeSetId"), body, session.user.id));
    } catch (error) {
      return jsonError(c, error);
    }
  });
};
