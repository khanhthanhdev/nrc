import type { EvlogVariables } from "evlog/hono";
import type { Hono } from "hono";

import { account, db, session as authSession, user } from "@nrc-full/db";
import { env } from "@nrc-full/env/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { setCookie } from "hono/cookie";
import { createHmac } from "node:crypto";

import {
  clearCapturedAuthEmails,
  getCapturedAuthEmails,
} from "../../adapters/email/test-auth-email-store";

interface EmailPayload {
  email?: string;
}

interface SeedGoogleUserPayload extends EmailPayload {
  name?: string;
  onboardingCompleted?: boolean;
}

const SESSION_COOKIE_NAME = "better-auth.session_token";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const isE2ETestHelpersEnabled = (): boolean => process.env.ENABLE_E2E_TEST_HELPERS === "1";

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const parseEmailPayload = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const { email } = payload as EmailPayload;

  if (typeof email !== "string") {
    return null;
  }

  const normalizedEmail = normalizeEmail(email);
  return normalizedEmail.length > 0 ? normalizedEmail : null;
};

const findUserByEmail = async (email: string) => {
  const [existingUser] = await db
    .select({
      email: user.email,
      emailVerified: user.emailVerified,
      id: user.id,
      onboardingCompleted: user.onboardingCompleted,
    })
    .from(user)
    .where(and(eq(user.email, email), isNull(user.deletedAt)))
    .limit(1);

  return existingUser ?? null;
};

const createSessionToken = (): string =>
  `pw_${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;

const createSignedSessionCookieValue = (sessionToken: string): string => {
  const signature = createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(sessionToken)
    .digest("base64");
  return `${sessionToken}.${signature}`;
};

export const registerE2ETestRoute = (app: Hono<EvlogVariables>): void => {
  app.use("/api/test/*", async (c, next) => {
    if (!isE2ETestHelpersEnabled()) {
      return c.notFound();
    }

    await next();
  });

  app.get("/api/test/auth/captured-email", (c) => {
    const emailParam = c.req.query("email");
    const normalizedEmail =
      typeof emailParam === "string" && emailParam.trim().length > 0
        ? normalizeEmail(emailParam)
        : null;

    if (!normalizedEmail) {
      return c.json({ error: "email is required" }, 400);
    }

    const capturedEmails = getCapturedAuthEmails(normalizedEmail);

    if (!capturedEmails) {
      return c.json({ email: normalizedEmail, reset: null, verification: null }, 200);
    }

    return c.json(
      {
        email: normalizedEmail,
        reset: capturedEmails.reset,
        verification: capturedEmails.verification,
      },
      200,
    );
  });

  app.post("/api/test/auth/clear-captured-email", async (c) => {
    const body = await c.req.json().catch(() => null);
    const normalizedEmail = parseEmailPayload(body);

    if (!normalizedEmail) {
      return c.json({ error: "email is required" }, 400);
    }

    clearCapturedAuthEmails(normalizedEmail);

    return c.json({ cleared: true, email: normalizedEmail }, 200);
  });

  app.post("/api/test/auth/seed-google-user", async (c) => {
    const body = (await c.req.json().catch(() => null)) as SeedGoogleUserPayload | null;
    const normalizedEmail = parseEmailPayload(body);

    if (!normalizedEmail) {
      return c.json({ error: "email is required" }, 400);
    }

    const defaultName = normalizedEmail.split("@")[0] ?? "Playwright User";
    const displayName =
      typeof body?.name === "string" && body.name.trim().length > 0
        ? body.name.trim()
        : defaultName;
    const onboardingCompleted = body?.onboardingCompleted === true;
    const now = new Date();

    const existingUser = await findUserByEmail(normalizedEmail);

    let userId = existingUser?.id;

    if (!userId) {
      const insertedUsers = await db
        .insert(user)
        .values({
          email: normalizedEmail,
          emailVerified: true,
          id: crypto.randomUUID().replaceAll("-", ""),
          name: displayName,
          onboardingCompleted,
          updatedAt: now,
        })
        .returning({ id: user.id });

      userId = insertedUsers[0]?.id;
    }

    if (!userId) {
      return c.json({ error: "Unable to create seeded user" }, 500);
    }

    await db
      .update(user)
      .set({
        emailVerified: true,
        onboardingCompleted,
      })
      .where(eq(user.id, userId));

    await db
      .delete(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "credential")));

    const [googleAccount] = await db
      .select({ id: account.id })
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "google")))
      .limit(1);

    if (!googleAccount) {
      await db.insert(account).values({
        accountId: `google-${userId}`,
        id: crypto.randomUUID().replaceAll("-", ""),
        providerId: "google",
        updatedAt: now,
        userId,
      });
    }

    return c.json({ email: normalizedEmail, onboardingCompleted, userId }, 200);
  });

  app.post("/api/test/auth/create-session", async (c) => {
    const body = await c.req.json().catch(() => null);
    const normalizedEmail = parseEmailPayload(body);

    if (!normalizedEmail) {
      return c.json({ error: "email is required" }, 400);
    }

    const existingUser = await findUserByEmail(normalizedEmail);

    if (!existingUser) {
      return c.json({ error: "User not found" }, 404);
    }

    const now = new Date();
    const token = createSessionToken();
    const signedToken = createSignedSessionCookieValue(token);
    const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

    await db.insert(authSession).values({
      expiresAt,
      id: crypto.randomUUID().replaceAll("-", ""),
      ipAddress: "127.0.0.1",
      token,
      updatedAt: now,
      userAgent: "playwright-e2e",
      userId: existingUser.id,
    });

    setCookie(c, SESSION_COOKIE_NAME, signedToken, {
      httpOnly: true,
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "Lax",
      secure: false,
    });

    return c.json(
      {
        cookieName: SESSION_COOKIE_NAME,
        created: true,
        email: normalizedEmail,
      },
      200,
    );
  });

  app.get("/api/test/auth/user", async (c) => {
    const emailParam = c.req.query("email");
    const normalizedEmail =
      typeof emailParam === "string" && emailParam.trim().length > 0
        ? normalizeEmail(emailParam)
        : null;

    if (!normalizedEmail) {
      return c.json({ error: "email is required" }, 400);
    }

    const existingUser = await findUserByEmail(normalizedEmail);

    if (!existingUser) {
      return c.json({ error: "User not found" }, 404);
    }

    const providers = await db
      .select({
        providerId: account.providerId,
      })
      .from(account)
      .where(eq(account.userId, existingUser.id))
      .orderBy(desc(account.createdAt));

    return c.json(
      {
        email: existingUser.email,
        emailVerified: existingUser.emailVerified,
        id: existingUser.id,
        onboardingCompleted: existingUser.onboardingCompleted,
        providers: providers.map((provider) => provider.providerId),
      },
      200,
    );
  });
};
