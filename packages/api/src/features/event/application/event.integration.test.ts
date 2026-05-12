/**
 * Event integration tests.
 *
 * Run:
 *   cd /home/thanhkt/code/steam/nrc-full
 *   DATABASE_URL='postgresql://...' bun x vitest run packages/api/src/features/event/application/event.integration.test.ts
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  db,
  eventTable,
  eventDocumentTable,
  eventAnnouncementTable,
  eventRegistrationFormVersionTable,
  seasonTable,
  user,
} from "@nrc-full/db";
import { eq } from "drizzle-orm";

import {
  createEventForAdmin,
  getAdminEventById,
  getPublicEventBySeasonAndCode,
  listAdminEvents,
  updateEventForAdmin,
  deleteEventForAdmin,
  createEventDocumentForAdmin,
  updateEventDocumentForAdmin,
  deleteEventDocumentForAdmin,
  createEventAnnouncementForAdmin,
  updateEventAnnouncementForAdmin,
  deleteEventAnnouncementForAdmin,
  createRegistrationFormVersionForAdmin,
  publishRegistrationFormVersionForAdmin,
  deleteRegistrationFormVersionForAdmin,
} from "./event.js";

const TEST_SEASON = "2095";
const TEST_EVENT_CODE = "TESTINT";

let ACTOR_USER_ID = "";

const cleanup = async () => {
  await db.delete(eventAnnouncementTable).where(eq(eventAnnouncementTable.eventId, "int-event-1"));
  await db.delete(eventAnnouncementTable).where(eq(eventAnnouncementTable.eventId, "int-event-2"));
  await db.delete(eventDocumentTable).where(eq(eventDocumentTable.eventId, "int-event-1"));
  await db.delete(eventDocumentTable).where(eq(eventDocumentTable.eventId, "int-event-2"));
  await db.delete(eventRegistrationFormVersionTable).where(eq(eventRegistrationFormVersionTable.eventId, "int-event-1"));
  await db.delete(eventRegistrationFormVersionTable).where(eq(eventRegistrationFormVersionTable.eventId, "int-event-2"));
  await db.delete(eventTable).where(eq(eventTable.season, TEST_SEASON));
  await db.delete(seasonTable).where(eq(seasonTable.year, TEST_SEASON));
  if (ACTOR_USER_ID) {
    await db.delete(user).where(eq(user.id, ACTOR_USER_ID));
  }
};

const createTestSeason = async () => {
  const now = new Date();
  await db.insert(seasonTable).values({
    createdAt: now,
    gameCode: `ITD-${TEST_SEASON}`,
    id: crypto.randomUUID(),
    isActive: true,
    theme: "Integration Test Season",
    updatedAt: now,
    year: TEST_SEASON,
  });
};

const createActorUser = async () => {
  ACTOR_USER_ID = crypto.randomUUID();
  await db.insert(user).values({
    createdAt: new Date(),
    dateOfBirth: "2000-01-01",
    email: `actor-event-${ACTOR_USER_ID.slice(0, 8)}@test.example.com`,
    emailVerified: true,
    id: ACTOR_USER_ID,
    name: "Test Actor",
    systemRole: "ADMIN",
    updatedAt: new Date(),
    userType: "STAFF",
  });
};

const validEventInput = {
  eventCode: TEST_EVENT_CODE,
  eventEndsAt: "2095-07-12T10:00:00.000Z",
  eventStartsAt: "2095-07-10T10:00:00.000Z",
  name: "Integration Test Championship",
  season: TEST_SEASON,
  status: "registration_open" as const,
};

describe("event integration", () => {
  beforeAll(async () => {
    await cleanup();
    await createTestSeason();
    await createActorUser();
  });

  afterEach(async () => {
    // Clean event data but keep season and actor
    await db.delete(eventAnnouncementTable).where(eq(eventAnnouncementTable.eventId, "int-event-1"));
    await db.delete(eventAnnouncementTable).where(eq(eventAnnouncementTable.eventId, "int-event-2"));
    await db.delete(eventDocumentTable).where(eq(eventDocumentTable.eventId, "int-event-1"));
    await db.delete(eventDocumentTable).where(eq(eventDocumentTable.eventId, "int-event-2"));
    await db.delete(eventRegistrationFormVersionTable).where(eq(eventRegistrationFormVersionTable.eventId, "int-event-1"));
    await db.delete(eventRegistrationFormVersionTable).where(eq(eventRegistrationFormVersionTable.eventId, "int-event-2"));
    await db.delete(eventTable).where(eq(eventTable.season, TEST_SEASON));
  });

  afterAll(async () => {
    await cleanup();
  });

  // ── Event CRUD ──────────────────────────────────────────────────

  it("creates an event and retrieves it", async () => {
    const detail = await createEventForAdmin(validEventInput);

    expect(detail.event.eventCode).toBe(TEST_EVENT_CODE);
    expect(detail.event.name).toBe("Integration Test Championship");
    expect(detail.event.season).toBe(TEST_SEASON);
    expect(detail.event.status).toBe("registration_open");

    const retrieved = await getAdminEventById(detail.event.id);
    expect(retrieved.event.id).toBe(detail.event.id);
  });

  it("lists admin events", async () => {
    await createEventForAdmin(validEventInput);

    const events = await listAdminEvents({ includeDeleted: false, season: TEST_SEASON });
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events.some((e) => e.eventCode === TEST_EVENT_CODE)).toBe(true);
  });

  it("rejects duplicate event in same season", async () => {
    await createEventForAdmin(validEventInput);

    await expect(createEventForAdmin(validEventInput)).rejects.toThrow("already exists");
  });

  it("allows same event code in different season", async () => {
    // Create a second season
    const now = new Date();
    const otherSeason = "2094";
    await db.insert(seasonTable).values({
      createdAt: now,
      gameCode: "ITD-2094",
      id: crypto.randomUUID(),
      isActive: false,
      theme: "Other Season",
      updatedAt: now,
      year: otherSeason,
    });

    await createEventForAdmin(validEventInput);
    await createEventForAdmin({
      ...validEventInput,
      eventEndsAt: "2094-07-12T10:00:00.000Z",
      eventStartsAt: "2094-07-10T10:00:00.000Z",
      season: otherSeason,
    });

    // Cleanup other season
    await db.delete(eventTable).where(eq(eventTable.season, otherSeason));
    await db.delete(seasonTable).where(eq(seasonTable.year, otherSeason));
  });

  it("updates an event", async () => {
    const detail = await createEventForAdmin(validEventInput);

    const updated = await updateEventForAdmin({
      ...validEventInput,
      eventCode: "UPDATED",
      eventEndsAt: "2095-08-12T10:00:00.000Z",
      eventStartsAt: "2095-08-10T10:00:00.000Z",
      id: detail.event.id,
      name: "Updated Championship",
    });

    expect(updated.event.name).toBe("Updated Championship");
    expect(updated.event.eventCode).toBe("UPDATED");
  });

  it("soft-deletes an event", async () => {
    const detail = await createEventForAdmin(validEventInput);

    const result = await deleteEventForAdmin(ACTOR_USER_ID, { id: detail.event.id });
    expect(result.success).toBe(true);

    const events = await listAdminEvents({ includeDeleted: false, season: TEST_SEASON });
    expect(events.find((e) => e.id === detail.event.id)).toBeUndefined();
  });

  it("fetches public event by season and code", async () => {
    await createEventForAdmin(validEventInput);

    const pub = await getPublicEventBySeasonAndCode(TEST_SEASON, TEST_EVENT_CODE);
    expect(pub.event.eventCode).toBe(TEST_EVENT_CODE);
    expect(pub.event.season).toBe(TEST_SEASON);
  });

  it("rejects public access to draft events", async () => {
    await createEventForAdmin({
      ...validEventInput,
      eventCode: "DRAFTINT",
      status: "draft",
    });

    await expect(getPublicEventBySeasonAndCode(TEST_SEASON, "DRAFTINT")).rejects.toThrow("not found");
  });

  // ── Event Document CRUD ────────────────────────────────────────

  it("creates an event document", async () => {
    const event = await createEventForAdmin(validEventInput);

    const doc = await createEventDocumentForAdmin({
      eventId: event.event.id,
      isPublic: true,
      kind: "pdf",
      sortOrder: 0,
      title: "Venue Packet",
      url: "https://example.com/venue.pdf",
    });

    expect(doc.title).toBe("Venue Packet");
    expect(doc.isPublic).toBe(true);
  });

  it("updates an event document", async () => {
    const event = await createEventForAdmin(validEventInput);

    const doc = await createEventDocumentForAdmin({
      eventId: event.event.id,
      isPublic: true,
      kind: "pdf",
      sortOrder: 0,
      title: "Original",
      url: "https://example.com/original.pdf",
    });

    const updated = await updateEventDocumentForAdmin({
      eventId: event.event.id,
      id: doc.id,
      isPublic: false,
      kind: "pdf",
      sortOrder: 5,
      title: "Updated Packet",
      url: "https://example.com/updated.pdf",
    });

    expect(updated.title).toBe("Updated Packet");
    expect(updated.isPublic).toBe(false);
  });

  it("soft-deletes an event document", async () => {
    const event = await createEventForAdmin(validEventInput);

    const doc = await createEventDocumentForAdmin({
      eventId: event.event.id,
      isPublic: true,
      kind: "pdf",
      sortOrder: 0,
      title: "To Delete",
      url: "https://example.com/delete.pdf",
    });

    await deleteEventDocumentForAdmin(ACTOR_USER_ID, {
      eventId: event.event.id,
      id: doc.id,
    });

    const detail = await getAdminEventById(event.event.id);
    expect(detail.documents.find((d) => d.id === doc.id)).toBeUndefined();
  });

  // ── Event Announcement CRUD ────────────────────────────────────

  it("creates an event announcement", async () => {
    const event = await createEventForAdmin(validEventInput);

    const ann = await createEventAnnouncementForAdmin({
      body: "Doors open at 8:00.",
      eventId: event.event.id,
      isPinned: false,
      publishedAt: "2095-06-01T00:00:00.000Z",
      title: "Schedule",
    });

    expect(ann.title).toBe("Schedule");
    expect(ann.isPinned).toBe(false);
  });

  it("updates an event announcement", async () => {
    const event = await createEventForAdmin(validEventInput);

    const ann = await createEventAnnouncementForAdmin({
      body: "Original body",
      eventId: event.event.id,
      isPinned: false,
      publishedAt: "2095-06-01T00:00:00.000Z",
      title: "Original",
    });

    const updated = await updateEventAnnouncementForAdmin({
      body: "Updated body",
      eventId: event.event.id,
      id: ann.id,
      isPinned: true,
      publishedAt: "2095-07-01T00:00:00.000Z",
      title: "Updated",
    });

    expect(updated.title).toBe("Updated");
    expect(updated.isPinned).toBe(true);
  });

  it("soft-deletes an event announcement", async () => {
    const event = await createEventForAdmin(validEventInput);

    const ann = await createEventAnnouncementForAdmin({
      body: "To delete",
      eventId: event.event.id,
      isPinned: false,
      publishedAt: "2095-06-01T00:00:00.000Z",
      title: "To Delete",
    });

    await deleteEventAnnouncementForAdmin(ACTOR_USER_ID, {
      eventId: event.event.id,
      id: ann.id,
    });

    const detail = await getAdminEventById(event.event.id);
    expect(detail.announcements.find((a) => a.id === ann.id)).toBeUndefined();
  });

  // ── Registration Form Version CRUD ─────────────────────────────

  it("creates a registration form version", async () => {
    const event = await createEventForAdmin(validEventInput);

    const form = await createRegistrationFormVersionForAdmin(ACTOR_USER_ID, {
      definition: { fields: [{ label: "Team Name", type: "text" }] },
      eventId: event.event.id,
      isPublished: false,
    });

    expect(form.versionNumber).toBe(1);
    expect(form.isPublished).toBe(false);
    expect(form.publishedAt).toBeNull();
  });

  it("auto-increments version number", async () => {
    const event = await createEventForAdmin(validEventInput);

    const v1 = await createRegistrationFormVersionForAdmin(ACTOR_USER_ID, {
      definition: { fields: [] },
      eventId: event.event.id,
      isPublished: false,
    });
    const v2 = await createRegistrationFormVersionForAdmin(ACTOR_USER_ID, {
      definition: { fields: [{ name: "extra" }] },
      eventId: event.event.id,
      isPublished: false,
    });

    expect(v1.versionNumber).toBe(1);
    expect(v2.versionNumber).toBe(2);
  });

  it("publishes a registration form version and unpublishes others", async () => {
    const event = await createEventForAdmin(validEventInput);

    const v1 = await createRegistrationFormVersionForAdmin(ACTOR_USER_ID, {
      definition: { fields: [] },
      eventId: event.event.id,
      isPublished: true,
    });

    const v2 = await createRegistrationFormVersionForAdmin(ACTOR_USER_ID, {
      definition: { fields: [] },
      eventId: event.event.id,
      isPublished: false,
    });

    const published = await publishRegistrationFormVersionForAdmin({
      eventId: event.event.id,
      id: v2.id,
    });

    expect(published.isPublished).toBe(true);

    // Check that v1 is now unpublished
    const detail = await getAdminEventById(event.event.id);
    const v1Updated = detail.registrationFormVersions.find((f) => f.id === v1.id);
    expect(v1Updated?.isPublished).toBe(false);
  });

  it("soft-deletes a registration form version", async () => {
    const event = await createEventForAdmin(validEventInput);

    const form = await createRegistrationFormVersionForAdmin(ACTOR_USER_ID, {
      definition: { fields: [] },
      eventId: event.event.id,
      isPublished: false,
    });

    await deleteRegistrationFormVersionForAdmin(ACTOR_USER_ID, {
      eventId: event.event.id,
      id: form.id,
    });

    const detail = await getAdminEventById(event.event.id);
    expect(detail.registrationFormVersions.find((f) => f.id === form.id)).toBeUndefined();
  });

  // ── Nested resources in admin detail ────────────────────────────

  it("returns sorted nested resources in admin detail", async () => {
    const event = await createEventForAdmin(validEventInput);

    // Create documents with different sort orders
    await createEventDocumentForAdmin({
      eventId: event.event.id,
      isPublic: true,
      kind: "pdf",
      sortOrder: 2,
      title: "Second",
      url: "https://example.com/2.pdf",
    });
    await createEventDocumentForAdmin({
      eventId: event.event.id,
      isPublic: true,
      kind: "pdf",
      sortOrder: 1,
      title: "First",
      url: "https://example.com/1.pdf",
    });

    const detail = await getAdminEventById(event.event.id);
    expect(detail.documents.map((d) => d.title)).toEqual(["First", "Second"]);
  });

  // ── Error cases ─────────────────────────────────────────────────

  it("throws NOT_FOUND for nonexistent event", async () => {
    await expect(getAdminEventById("nonexistent-id")).rejects.toThrow("not found");
  });

  it("throws NOT_FOUND when creating event for nonexistent season", async () => {
    await expect(
      createEventForAdmin({
        ...validEventInput,
        season: "1999",
      }),
    ).rejects.toThrow("not found");
  });

  it("throws NOT_FOUND when creating document for nonexistent event", async () => {
    await expect(
      createEventDocumentForAdmin({
        eventId: "nonexistent",
        isPublic: true,
        kind: "pdf",
        sortOrder: 0,
        title: "Test",
        url: "https://example.com/test.pdf",
      }),
    ).rejects.toThrow("not found");
  });
});
