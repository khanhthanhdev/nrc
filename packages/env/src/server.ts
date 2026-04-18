import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import * as v from "valibot";

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    APP_NAME: v.optional(v.pipe(v.string(), v.minLength(1)), "RMS"),
    BETTER_AUTH_SECRET: v.pipe(v.string(), v.minLength(1)),
    BETTER_AUTH_URL: v.pipe(v.string(), v.url()),
    CORS_ORIGIN: v.pipe(v.string(), v.url()),
    DATABASE_URL: v.pipe(v.string(), v.minLength(1)),
    ADMIN_EMAIL: v.optional(v.pipe(v.string(), v.minLength(1))),
    GOOGLE_CLIENT_ID: v.pipe(v.string(), v.minLength(1)),
    GOOGLE_CLIENT_SECRET: v.pipe(v.string(), v.minLength(1)),
    NODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),
    MANAGER_EMAIL: v.optional(v.pipe(v.string(), v.minLength(1))),
    STEAMIFY_BASIC_AUTH_PASS: v.optional(v.pipe(v.string(), v.minLength(1))),
    STEAMIFY_BASIC_AUTH_USER: v.optional(v.pipe(v.string(), v.minLength(1))),
    STEAMIFY_URL: v.optional(v.pipe(v.string(), v.url())),
    TEMPLATE_ID_ACCOUNT_CREATED: v.optional(v.pipe(v.string(), v.minLength(1))),
    TEMPLATE_ID_ORGANIZATION_INVITATION: v.optional(v.pipe(v.string(), v.minLength(1))),
    TEMPLATE_ID_PASSWORD_RESET: v.optional(v.pipe(v.string(), v.minLength(1))),
    TEMPLATE_ID_TEAM_MEMBER_ADDED: v.optional(v.pipe(v.string(), v.minLength(1))),
    TEMPLATE_ID_TEAM_MEMBER_WELCOME: v.optional(v.pipe(v.string(), v.minLength(1))),
    TEMPLATE_ID_VERIFICATION: v.optional(v.pipe(v.string(), v.minLength(1))),
  },
});
