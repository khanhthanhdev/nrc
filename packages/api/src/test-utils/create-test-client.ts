import type { RouterClient } from "@orpc/server";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RPCHandler } from "@orpc/server/fetch";

import type { AppRouter } from "../app-router.js";
import type { AuthAdminContext, AuthContextSession } from "../shared/context.js";

export interface CreateTestClientOptions {
  authAdmin?: AuthAdminContext;
  session: AuthContextSession | null;
}

export const createTestClient = (
  router: AppRouter,
  options: CreateTestClientOptions,
): RouterClient<AppRouter> => {
  const handler = new RPCHandler(router);

  const fetchAdapter = async (
    request: Request | URL | string,
    init?: RequestInit,
  ): Promise<Response> => {
    const requestInput = request instanceof URL ? request.toString() : request;
    const normalizedRequest =
      requestInput instanceof Request ? requestInput : new Request(requestInput, init);

    const result = await handler.handle(normalizedRequest, {
      context: { authAdmin: options.authAdmin, session: options.session },
      prefix: "/rpc",
    });

    if (!result.matched) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(result.response.body, result.response);
  };

  const link = new RPCLink({
    fetch: fetchAdapter,
    url: "http://localhost/rpc",
  });

  return createORPCClient(link) as RouterClient<AppRouter>;
};
