import type { AppRouter } from "@nrc-full/api/app-router";
import type { RouterClient } from "@orpc/server";

import { env } from "@nrc-full/env/web";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "./auth-client";

const CSRF_COOKIE_NAME = "nrc_csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
let csrfTokenRequest: Promise<string | null> | null = null;

const getCsrfToken = (): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CSRF_COOKIE_NAME}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1] ?? "") : null;
};

const fetchCsrfToken = async (): Promise<string | null> => {
  const existingToken = getCsrfToken();

  if (existingToken) {
    return existingToken;
  }

  if (typeof window === "undefined") {
    return null;
  }

  if (csrfTokenRequest) {
    return csrfTokenRequest;
  }

  csrfTokenRequest = requestCsrfToken();

  try {
    return await csrfTokenRequest;
  } finally {
    csrfTokenRequest = null;
  }
};

const requestCsrfToken = async (): Promise<string | null> => {
  const response = await fetch(`${env.VITE_SERVER_URL}/rpc/csrf-token`, {
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as { csrfToken?: string };

  if (body.csrfToken) {
    document.cookie = `${CSRF_COOKIE_NAME}=${encodeURIComponent(body.csrfToken)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
  }

  return body.csrfToken ?? getCsrfToken();
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.error(`Error: ${error.message}`, {
        action: {
          label: "retry",
          onClick: query.invalidate,
        },
      });
    },
  }),
});

const link = new RPCLink({
  fetch: async (request, init) => {
    const csrfToken = await fetchCsrfToken();
    const requestInit = init as RequestInit | undefined;
    const headers = new Headers(requestInit?.headers ?? request.headers);

    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }

    const requestWithHeaders = new Request(request, { ...requestInit, headers });
    const retryRequest = requestWithHeaders.clone();
    const response = await fetch(requestWithHeaders, { credentials: "include" });

    if (response.status !== 401 || typeof window === "undefined") {
      return response;
    }

    await authClient.getSession();

    return fetch(retryRequest, { credentials: "include" });
  },
  url: `${env.VITE_SERVER_URL}/rpc`,
});

const getORPCClient = () => createORPCClient(link) as RouterClient<AppRouter>;

export const client: RouterClient<AppRouter> = getORPCClient();

export const orpc = createTanstackQueryUtils(client);
