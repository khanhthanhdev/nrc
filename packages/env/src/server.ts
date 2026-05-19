import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import * as v from "valibot";

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    ADMIN_EMAIL: v.optional(v.pipe(v.string(), v.minLength(1))),
    APP_NAME: v.optional(v.pipe(v.string(), v.minLength(1)), "RMS"),
    BETTER_AUTH_SECRET: v.pipe(v.string(), v.minLength(1)),
    BETTER_AUTH_URL: v.pipe(v.string(), v.url()),
    // Supports single URL or comma-separated list of URLs for multi-environment deployments
    // Example: "https://app.example.com,https://staging.example.com"
    CORS_ORIGIN: v.pipe(
      v.string(),
      v.check(
        (value) =>
          value.split(",").every((url) => {
            try {
              new URL(url.trim());
              return true;
            } catch {
              return false;
            }
          }),
        "CORS_ORIGIN must be a valid URL or comma-separated list of URLs",
      ),
    ),
    DATABASE_URL: v.pipe(v.string(), v.minLength(1)),
    ENABLE_E2E_TEST_HELPERS: v.optional(v.picklist(["0", "1"]), "0"),
    GOOGLE_CLIENT_ID: v.pipe(v.string(), v.minLength(1)),
    GOOGLE_CLIENT_SECRET: v.pipe(v.string(), v.minLength(1)),
    MANAGER_EMAIL: v.optional(v.pipe(v.string(), v.minLength(1))),
    NODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),
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
