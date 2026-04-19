import { createContext } from "@nrc-full/api/shared/context";
import type { EvlogVariables } from "evlog/hono";
import type { Hono } from "hono";

import { getAuthSessionFromHeaders } from "../../auth/session";
import { apiHandler, rpcHandler } from "./orpc-handlers";

export const registerOrpcMiddleware = (app: Hono<EvlogVariables>): void => {
  app.use("/*", async (c, next) => {
    if (c.req.path.startsWith("/api/auth")) {
      await next();
      return;
    }

    const session = await getAuthSessionFromHeaders(c.req.raw.headers);
    const context = await createContext({ session });

    const rpcResult = await rpcHandler.handle(c.req.raw, {
      context,
      prefix: "/rpc",
    });

    if (rpcResult.matched) {
      return c.newResponse(rpcResult.response.body, rpcResult.response);
    }

    const apiResult = await apiHandler.handle(c.req.raw, {
      context,
      prefix: "/api-reference",
    });

    if (apiResult.matched) {
      return c.newResponse(apiResult.response.body, apiResult.response);
    }

    await next();
  });
};
