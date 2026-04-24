import type { EvlogVariables } from "evlog/hono";
import type { Hono } from "hono";

import {
  account,
  db,
  eventTable,
  seasonAnnouncementTable,
  seasonDocumentTable,
  seasonTable,
  session as authSession,
  user,
} from "@nrc-full/db";
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
  systemRole?: "ADMIN" | "MANAGER" | "USER";
}

interface SeedSeasonPagePayload {
  announcements?: Array<{
    body: string;
    id?: string;
    isPinned?: boolean;
    publishedAt: string;
    sortOrder?: number;
    title: string;
  }>;
  description?: string | null;
  documents?: Array<{
    id?: string;
    kind: string;
    sortOrder?: number;
    title: string;
    url: string;
  }>;
  events?: Array<{
    eventCode: string;
    eventEndsAt: string;
    eventStartsAt: string;
    id?: string;
    location?: string | null;
    maxParticipants?: number | null;
    name: string;
    registrationEndsAt?: string | null;
    registrationStartsAt?: string | null;
    slug?: string;
    status?:
      | "draft"
      | "published"
      | "registration_open"
      | "registration_closed"
      | "active"
      | "completed"
      | "archived";
    summary?: string | null;
    timezone?: string | null;
    venue?: string | null;
  }>;
  gameCode: string;
  isActive?: boolean;
  theme: string;
  year: string;
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

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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
    const systemRole = body?.systemRole === "ADMIN" || body?.systemRole === "MANAGER" ? body.systemRole : "USER";
    const userType = systemRole === "USER" ? "PARTICIPANT" : "STAFF";
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
          systemRole,
          updatedAt: now,
          userType,
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
        systemRole,
        userType,
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

    return c.json({ email: normalizedEmail, onboardingCompleted, systemRole, userId }, 200);
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

  app.post("/api/test/data/seed-season-page", async (c) => {
    const body = (await c.req.json().catch(() => null)) as SeedSeasonPagePayload | null;
    const year = body?.year?.trim();
    const gameCode = body?.gameCode?.trim();
    const theme = body?.theme?.trim();

    if (!year || !/^\d{4}$/.test(year) || !gameCode || !theme) {
      return c.json({ error: "year, gameCode, and theme are required" }, 400);
    }

    const now = new Date();

    await db.delete(eventTable).where(eq(eventTable.season, year));
    await db.delete(seasonTable).where(eq(seasonTable.year, year));

    await db.insert(seasonTable).values({
      createdAt: now,
      description: body?.description?.trim() || null,
      gameCode,
      id: crypto.randomUUID(),
      isActive: body?.isActive ?? true,
      theme,
      updatedAt: now,
      year,
    });

    if (body?.documents?.length) {
      await db.insert(seasonDocumentTable).values(
        body.documents.map((document, index) => ({
          createdAt: now,
          id: document.id ?? crypto.randomUUID(),
          kind: document.kind.trim(),
          seasonYear: year,
          sortOrder: document.sortOrder ?? index,
          title: document.title.trim(),
          updatedAt: now,
          url: document.url.trim(),
        })),
      );
    }

    if (body?.announcements?.length) {
      await db.insert(seasonAnnouncementTable).values(
        body.announcements.map((announcement, index) => ({
          body: announcement.body.trim(),
          createdAt: now,
          id: announcement.id ?? crypto.randomUUID(),
          isPinned: announcement.isPinned ?? false,
          publishedAt: new Date(announcement.publishedAt),
          seasonYear: year,
          sortOrder: announcement.sortOrder ?? index,
          title: announcement.title.trim(),
          updatedAt: now,
        })),
      );
    }

    if (body?.events?.length) {
      await db.insert(eventTable).values(
        body.events.map((event, index) => ({
          createdAt: now,
          description: event.summary?.trim() || null,
          eventCode: event.eventCode.trim(),
          eventEndsAt: new Date(event.eventEndsAt),
          eventKey: `${year}-${event.eventCode.trim()}-${index}`,
          eventStartsAt: new Date(event.eventStartsAt),
          id: event.id ?? crypto.randomUUID(),
          location: event.location?.trim() || null,
          maxParticipants: event.maxParticipants ?? null,
          name: event.name.trim(),
          registrationEndsAt: event.registrationEndsAt ? new Date(event.registrationEndsAt) : null,
          registrationStartsAt: event.registrationStartsAt
            ? new Date(event.registrationStartsAt)
            : null,
          season: year,
          slug: event.slug?.trim() || slugify(`${year}-${event.name}`),
          status: event.status ?? "published",
          summary: event.summary?.trim() || null,
          timezone: event.timezone?.trim() || "Asia/Ho_Chi_Minh",
          updatedAt: now,
          venue: event.venue?.trim() || null,
        })),
      );
    }

    return c.json(
      {
        announcements: body?.announcements?.length ?? 0,
        documents: body?.documents?.length ?? 0,
        events: body?.events?.length ?? 0,
        season: year,
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
