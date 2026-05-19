import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import type { AuthSession } from "./auth-client";
import { getInternalApiUrl } from "./internal-api-url";

/**
 * SSR-prefetch the Better Auth session by forwarding the incoming
 * browser cookies to the API server. Returning the session in
 * `__root.tsx`'s `beforeLoad` allows the very first render to know
 * whether the user is authenticated, eliminating the un-auth → auth
 * flash.
 */
export const fetchSessionServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthSession | null> => {
    const headers = getRequestHeaders();
    const cookie = headers.get("cookie") ?? "";

    if (!cookie) {
      return null;
    }

    try {
      const response = await fetch(`${getInternalApiUrl()}/api/auth/get-session`, {
        headers: {
          accept: "application/json",
          cookie,
        },
      });

      if (!response.ok) {
        return null;
      }

      const body = (await response.json()) as AuthSession | null;
      return body ?? null;
    } catch {
      return null;
    }
  },
);
