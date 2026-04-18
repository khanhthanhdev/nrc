import { env } from "@nrc-full/env/web";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  fetchOptions: {
    credentials: "include",
  },
});

export type AuthSession = typeof authClient.$Infer.Session;
