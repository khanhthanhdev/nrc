import { env } from "@nrc-full/env/server";
import type { Context } from "hono";
import { rateLimiter } from "hono-rate-limiter";

/**
 * Rate limiter for registration endpoints
 * Limits to 10 requests per minute per IP
 */
export const registrationRateLimiter = rateLimiter({
  keyGenerator: (c: Context) => {
    // Fall back to IP address
    const forwardedFor = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    return (
      forwardedFor || c.req.header("cf-connecting-ip") || c.req.header("x-real-ip") || "unknown"
    );
  },
  limit: 10, // 10 requests per window
  message: {
    code: "RATE_LIMITED",
    message: "Too many registration attempts. Please try again later.",
  },
  skip: (c: Context) => env.ENABLE_E2E_TEST_HELPERS === "1" || c.req.method === "OPTIONS",
  windowMs: 60 * 1000, // 1 minute window
});
