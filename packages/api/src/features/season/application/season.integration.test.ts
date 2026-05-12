/**
 * Season integration tests.
 *
 * Runs against the real test database.
 * DATABASE_URL must be set to TEST_DATABASE_URL before running.
 *
 * Run:
 *   cd /home/thanhkt/code/steam/nrc-full
 *   DATABASE_URL='postgresql://...' bun x vitest run packages/api/src/features/season/application/season.integration.test.ts
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  db,
  seasonTable,
  seasonDocumentTable,
  seasonAnnouncementTable,
  user,
} from "@nrc-full/db";
import { eq, and } from "drizzle-orm";

import {
  createSeasonForAdmin,
  getPublicSeasonPageByYear,
  getAdminSeasonByYear,
  listAdminSeasons,
  getCurrentAdminSeason,
  updateSeasonForAdmin,
  deleteSeasonForAdmin,
  createSeasonDocumentForAdmin,
  updateSeasonDocumentForAdmin,
  deleteSeasonDocumentForAdmin,
  createSeasonAnnouncementForAdmin,
  updateSeasonAnnouncementForAdmin,
  deleteSeasonAnnouncementForAdmin,
} from "./season.js";

const TEST_YEAR = "2097";
const TEST_YEAR_2 = "2098";
let ACTOR_USER_ID = "";

const cleanup = async () => {
  await db.delete(seasonAnnouncementTable).where(eq(seasonAnnouncementTable.seasonYear, TEST_YEAR));
  await db.delete(seasonAnnouncementTable).where(eq(seasonAnnouncementTable.seasonYear, TEST_YEAR_2));
  await db.delete(seasonDocumentTable).where(eq(seasonDocumentTable.seasonYear, TEST_YEAR));
  await db.delete(seasonDocumentTable).where(eq(seasonDocumentTable.seasonYear, TEST_YEAR_2));
  await db.delete(seasonTable).where(eq(seasonTable.year, TEST_YEAR));
  await db.delete(seasonTable).where(eq(seasonTable.year, TEST_YEAR_2));
  if (ACTOR_USER_ID) {
    await db.delete(user).where(eq(user.id, ACTOR_USER_ID));
  }
};

describe("season integration", () => {
  beforeAll(async () => {
    await cleanup();
    // Create a real user to satisfy deletedByUserId foreign key
    ACTOR_USER_ID = crypto.randomUUID();
    await db.insert(user).values({
      createdAt: new Date(),
      dateOfBirth: "2000-01-01",
      email: `actor-${ACTOR_USER_ID.slice(0, 8)}@test.example.com`,
      emailVerified: true,
      id: ACTOR_USER_ID,
      name: "Test Actor",
      systemRole: "ADMIN",
      updatedAt: new Date(),
      userType: "STAFF",
    });
  });

  afterEach(async () => {
    await cleanup();
    // Re-create actor user after cleanup
    await db.insert(user).values({
      createdAt: new Date(),
      dateOfBirth: "2000-01-01",
      email: `actor-${ACTOR_USER_ID.slice(0, 8)}@test.example.com`,
      emailVerified: true,
      id: ACTOR_USER_ID,
      name: "Test Actor",
      systemRole: "ADMIN",
      updatedAt: new Date(),
      userType: "STAFF",
    });
  });

  afterAll(async () => {
    await cleanup();
  });

  // ── Season CRUD ──────────────────────────────────────────────────

  it("creates a season and retrieves it by year", async () => {
    const detail = await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: true,
      theme: "Integration Test Season",
      year: TEST_YEAR,
    });

    expect(detail.season.year).toBe(TEST_YEAR);
    expect(detail.season.theme).toBe("Integration Test Season");
    expect(detail.season.gameCode).toBe("ITD-2097");
    expect(detail.season.isActive).toBe(true);

    const retrieved = await getAdminSeasonByYear(TEST_YEAR);
    expect(retrieved.season.year).toBe(TEST_YEAR);
    expect(retrieved.season.id).toBe(detail.season.id);
  });

  it("lists admin seasons", async () => {
    await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: true,
      theme: "Season 1",
      year: TEST_YEAR,
    });

    const seasons = await listAdminSeasons({ includeDeleted: false });
    const found = seasons.find((s) => s.year === TEST_YEAR);
    expect(found).toBeDefined();
    expect(found?.theme).toBe("Season 1");
  });

  it("rejects duplicate season year", async () => {
    await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: true,
      theme: "First",
      year: TEST_YEAR,
    });

    await expect(
      createSeasonForAdmin({
        gameCode: "ITD-2097-2",
        isActive: true,
        theme: "Duplicate",
        year: TEST_YEAR,
      }),
    ).rejects.toThrow("already exists");
  });

  it("updates a season", async () => {
    await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: true,
      theme: "Original",
      year: TEST_YEAR,
    });

    const updated = await updateSeasonForAdmin({
      gameCode: "ITD-2097-UPD",
      isActive: false,
      theme: "Updated",
      year: TEST_YEAR,
    });

    expect(updated.season.theme).toBe("Updated");
    expect(updated.season.gameCode).toBe("ITD-2097-UPD");
    expect(updated.season.isActive).toBe(false);
  });

  it("soft-deletes a season", async () => {
    await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: true,
      theme: "To Delete",
      year: TEST_YEAR,
    });

    const result = await deleteSeasonForAdmin(ACTOR_USER_ID, { year: TEST_YEAR });
    expect(result.success).toBe(true);

    const seasons = await listAdminSeasons({ includeDeleted: false });
    expect(seasons.find((s) => s.year === TEST_YEAR)).toBeUndefined();

    const allSeasons = await listAdminSeasons({ includeDeleted: true });
    expect(allSeasons.find((s) => s.year === TEST_YEAR)).toBeDefined();
  });

  it("returns null for deleted seasons in public view", async () => {
    await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: true,
      theme: "To Delete",
      year: TEST_YEAR,
    });
    await deleteSeasonForAdmin(ACTOR_USER_ID, { year: TEST_YEAR });

    await expect(getPublicSeasonPageByYear(TEST_YEAR)).rejects.toThrow("not found");
  });

  // ── Season Document CRUD ────────────────────────────────────────

  it("creates a season document", async () => {
    await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: true,
      theme: "Doc Test",
      year: TEST_YEAR,
    });

    const doc = await createSeasonDocumentForAdmin({
      kind: "pdf",
      seasonYear: TEST_YEAR,
      sortOrder: 1,
      title: "Game Manual",
      url: "https://example.com/manual.pdf",
    });

    expect(doc.title).toBe("Game Manual");
    expect(doc.kind).toBe("pdf");
    expect(doc.url).toBe("https://example.com/manual.pdf");
    expect(doc.sortOrder).toBe(1);

    const page = await getPublicSeasonPageByYear(TEST_YEAR);
    expect(page.documents).toHaveLength(1);
    expect(page.documents[0]?.title).toBe("Game Manual");
  });

  it("updates a season document", async () => {
    await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: true,
      theme: "Doc Update Test",
      year: TEST_YEAR,
    });

    const doc = await createSeasonDocumentForAdmin({
      kind: "pdf",
      seasonYear: TEST_YEAR,
      sortOrder: 0,
      title: "Original",
      url: "https://example.com/original.pdf",
    });

    const updated = await updateSeasonDocumentForAdmin({
      id: doc.id,
      kind: "pdf",
      seasonYear: TEST_YEAR,
      sortOrder: 5,
      title: "Updated Manual",
      url: "https://example.com/updated.pdf",
    });

    expect(updated.title).toBe("Updated Manual");
    expect(updated.sortOrder).toBe(5);
  });

  it("soft-deletes a season document", async () => {
    await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: true,
      theme: "Doc Delete Test",
      year: TEST_YEAR,
    });

    const doc = await createSeasonDocumentForAdmin({
      kind: "pdf",
      seasonYear: TEST_YEAR,
      sortOrder: 0,
      title: "To Delete",
      url: "https://example.com/delete.pdf",
    });

    await deleteSeasonDocumentForAdmin(ACTOR_USER_ID, {
      id: doc.id,
      seasonYear: TEST_YEAR,
    });

    const page = await getPublicSeasonPageByYear(TEST_YEAR);
    expect(page.documents).toHaveLength(0);
  });

  // ── Season Announcement CRUD ────────────────────────────────────

  it("creates a season announcement", async () => {
    await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: true,
      theme: "Announcement Test",
      year: TEST_YEAR,
    });

    const ann = await createSeasonAnnouncementForAdmin({
      body: "Registration is open!",
      isPinned: false,
      publishedAt: "2097-06-01T00:00:00.000Z",
      seasonYear: TEST_YEAR,
      sortOrder: 0,
      title: "Registration Open",
    });

    expect(ann.title).toBe("Registration Open");
    expect(ann.body).toBe("Registration is open!");

    const page = await getPublicSeasonPageByYear(TEST_YEAR);
    expect(page.announcements).toHaveLength(1);
    expect(page.announcements[0]?.title).toBe("Registration Open");
  });

  it("updates a season announcement", async () => {
    await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: true,
      theme: "Announcement Update",
      year: TEST_YEAR,
    });

    const ann = await createSeasonAnnouncementForAdmin({
      body: "Original body",
      isPinned: false,
      publishedAt: "2097-06-01T00:00:00.000Z",
      seasonYear: TEST_YEAR,
      sortOrder: 0,
      title: "Original Title",
    });

    const updated = await updateSeasonAnnouncementForAdmin({
      body: "Updated body",
      id: ann.id,
      isPinned: true,
      publishedAt: "2097-07-01T00:00:00.000Z",
      seasonYear: TEST_YEAR,
      sortOrder: 5,
      title: "Updated Title",
    });

    expect(updated.title).toBe("Updated Title");
    expect(updated.body).toBe("Updated body");
    expect(updated.isPinned).toBe(true);
  });

  it("soft-deletes a season announcement", async () => {
    await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: true,
      theme: "Announcement Delete",
      year: TEST_YEAR,
    });

    const ann = await createSeasonAnnouncementForAdmin({
      body: "To be deleted",
      isPinned: false,
      publishedAt: "2097-06-01T00:00:00.000Z",
      seasonYear: TEST_YEAR,
      sortOrder: 0,
      title: "To Delete",
    });

    await deleteSeasonAnnouncementForAdmin(ACTOR_USER_ID, {
      id: ann.id,
      seasonYear: TEST_YEAR,
    });

    const page = await getPublicSeasonPageByYear(TEST_YEAR);
    expect(page.announcements).toHaveLength(0);
  });

  // ── Public page builder ─────────────────────────────────────────

  it("builds a complete public season page with sorted resources", async () => {
    await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: true,
      theme: "Full Page Test",
      year: TEST_YEAR,
    });

    // Create documents with different sort orders
    await createSeasonDocumentForAdmin({
      kind: "pdf",
      seasonYear: TEST_YEAR,
      sortOrder: 2,
      title: "Second",
      url: "https://example.com/2.pdf",
    });
    await createSeasonDocumentForAdmin({
      kind: "pdf",
      seasonYear: TEST_YEAR,
      sortOrder: 1,
      title: "First",
      url: "https://example.com/1.pdf",
    });

    // Create announcements with different pin status
    await createSeasonAnnouncementForAdmin({
      body: "Unpinned",
      isPinned: false,
      publishedAt: "2097-06-01T00:00:00.000Z",
      seasonYear: TEST_YEAR,
      sortOrder: 0,
      title: "Unpinned",
    });
    await createSeasonAnnouncementForAdmin({
      body: "Pinned",
      isPinned: true,
      publishedAt: "2097-05-01T00:00:00.000Z",
      seasonYear: TEST_YEAR,
      sortOrder: 0,
      title: "Pinned",
    });

    const page = await getPublicSeasonPageByYear(TEST_YEAR);

    // Documents sorted by sortOrder
    expect(page.documents.map((d) => d.title)).toEqual(["First", "Second"]);

    // Announcements sorted: pinned first, then by publishedAt desc
    expect(page.announcements.map((a) => a.title)).toEqual(["Pinned", "Unpinned"]);

    // Season options should contain our season
    expect(page.seasonOptions.some((o) => o.year === TEST_YEAR)).toBe(true);
  });

  // ── Error cases ──────────────────────────────────────────────────

  it("throws NOT_FOUND when getting admin season for nonexistent year", async () => {
    await expect(getAdminSeasonByYear("1999")).rejects.toThrow("not found");
  });

  it("throws NOT_FOUND when updating nonexistent season", async () => {
    await expect(
      updateSeasonForAdmin({
        gameCode: "FAKE",
        isActive: true,
        theme: "Fake",
        year: "1999",
      }),
    ).rejects.toThrow("not found");
  });

  it("throws NOT_FOUND when deleting nonexistent season", async () => {
    await expect(deleteSeasonForAdmin(ACTOR_USER_ID, { year: "1999" })).rejects.toThrow("not found");
  });

  it("throws NOT_FOUND when creating document for nonexistent season", async () => {
    await expect(
      createSeasonDocumentForAdmin({
        kind: "pdf",
        seasonYear: "1999",
        sortOrder: 0,
        title: "Doc",
        url: "https://example.com/doc.pdf",
      }),
    ).rejects.toThrow("not found");
  });

  it("throws NOT_FOUND when creating announcement for nonexistent season", async () => {
    await expect(
      createSeasonAnnouncementForAdmin({
        body: "Body",
        isPinned: false,
        publishedAt: "2097-06-01T00:00:00.000Z",
        seasonYear: "1999",
        sortOrder: 0,
        title: "Title",
      }),
    ).rejects.toThrow("not found");
  });

  // ── getCurrentAdminSeason ────────────────────────────────────────

  it("throws FAILED_PRECONDITION when no active season exists", async () => {
    // Deactivate all existing active seasons to ensure clean state
    await db.update(seasonTable).set({ isActive: false }).where(eq(seasonTable.isActive, true));

    // Create an inactive season
    await createSeasonForAdmin({
      gameCode: "ITD-2097",
      isActive: false,
      theme: "Inactive",
      year: TEST_YEAR,
    });

    await expect(getCurrentAdminSeason()).rejects.toThrow("exactly one active season");
  });
});
