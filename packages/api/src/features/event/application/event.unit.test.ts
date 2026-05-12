import { describe, expect, it } from "vitest";

import {
  compareAnnouncementsForDisplay,
  compareDocumentsByDisplayOrder,
  compareEventsForAdmin,
  compareFormVersionsDesc,
  buildEventKey,
  buildAdminEventSummaries,
  buildAdminEventDetail,
  PUBLIC_EVENT_STATUSES,
} from "./event.js";

const makeEvent = (overrides: Record<string, unknown> = {}) => ({
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  deletedAt: null,
  deletedByUserId: null,
  description: "National championship",
  eventCode: "VNCMP",
  eventEndsAt: new Date("2026-07-12T10:00:00.000Z"),
  eventKey: "2026/VNCMP",
  eventStartsAt: new Date("2026-07-10T10:00:00.000Z"),
  id: "event-1",
  location: "Ho Chi Minh City",
  maxParticipants: 48,
  name: "Vietnam Championship",
  registrationEndsAt: new Date("2026-06-20T10:00:00.000Z"),
  registrationStartsAt: new Date("2026-05-20T10:00:00.000Z"),
  season: "2026",
  status: "registration_open" as const,
  summary: "Season final event",
  timezone: "Asia/Ho_Chi_Minh",
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  venue: "SECC",
  ...overrides,
});

const makeDocument = (overrides: Record<string, unknown> = {}) => ({
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  deletedAt: null,
  deletedByUserId: null,
  eventId: "event-1",
  id: "document-1",
  isPublic: true,
  kind: "pdf",
  sortOrder: 1,
  title: "Venue Packet",
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  url: "https://example.com/venue.pdf",
  ...overrides,
});

const makeAnnouncement = (overrides: Record<string, unknown> = {}) => ({
  body: "Doors open at 8:00.",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  deletedAt: null,
  deletedByUserId: null,
  eventId: "event-1",
  id: "announcement-1",
  isPinned: false,
  publishedAt: new Date("2026-06-01T00:00:00.000Z"),
  title: "Schedule",
  updatedAt: new Date("2026-06-01T00:00:00.000Z"),
  ...overrides,
});

const makeFormVersion = (overrides: Record<string, unknown> = {}) => ({
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  createdByUserId: "user-admin",
  definition: { fields: [] },
  deletedAt: null,
  deletedByUserId: null,
  eventId: "event-1",
  id: "form-1",
  isPublished: false,
  publishedAt: null,
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  versionNumber: 1,
  ...overrides,
});

describe("buildEventKey", () => {
  it("concatenates season and eventCode with slash", () => {
    expect(buildEventKey("2026", "VNCMP")).toBe("2026/VNCMP");
  });

  it("handles different seasons and codes", () => {
    expect(buildEventKey("2025", "HANOI")).toBe("2025/HANOI");
    expect(buildEventKey("2027", "FINALE")).toBe("2027/FINALE");
  });
});

describe("PUBLIC_EVENT_STATUSES", () => {
  it("includes expected statuses", () => {
    expect(PUBLIC_EVENT_STATUSES.has("published")).toBe(true);
    expect(PUBLIC_EVENT_STATUSES.has("registration_open")).toBe(true);
    expect(PUBLIC_EVENT_STATUSES.has("registration_closed")).toBe(true);
    expect(PUBLIC_EVENT_STATUSES.has("active")).toBe(true);
    expect(PUBLIC_EVENT_STATUSES.has("completed")).toBe(true);
    expect(PUBLIC_EVENT_STATUSES.has("archived")).toBe(true);
  });

  it("excludes draft status", () => {
    expect(PUBLIC_EVENT_STATUSES.has("draft")).toBe(false);
  });
});

describe("compareEventsForAdmin", () => {
  it("sorts by eventStartsAt ascending", () => {
    const early = makeEvent({ eventStartsAt: new Date("2026-06-01"), name: "A" });
    const late = makeEvent({ eventStartsAt: new Date("2026-08-01"), name: "A" });

    expect(compareEventsForAdmin(early, late)).toBeLessThan(0);
    expect(compareEventsForAdmin(late, early)).toBeGreaterThan(0);
  });

  it("sorts by name when start dates are equal", () => {
    const a = makeEvent({ eventStartsAt: new Date("2026-06-01"), name: "Alpha Event" });
    const b = makeEvent({ eventStartsAt: new Date("2026-06-01"), name: "Beta Event" });

    expect(compareEventsForAdmin(a, b)).toBeLessThan(0);
    expect(compareEventsForAdmin(b, a)).toBeGreaterThan(0);
  });

  it("returns 0 for identical dates and names", () => {
    const a = makeEvent({ eventStartsAt: new Date("2026-06-01"), name: "Same" });
    const b = makeEvent({ eventStartsAt: new Date("2026-06-01"), name: "Same" });

    expect(compareEventsForAdmin(a, b)).toBe(0);
  });
});

describe("compareDocumentsByDisplayOrder", () => {
  it("sorts by sortOrder ascending", () => {
    const a = makeDocument({ sortOrder: 1, title: "A" });
    const b = makeDocument({ sortOrder: 5, title: "A" });

    expect(compareDocumentsByDisplayOrder(a, b)).toBeLessThan(0);
    expect(compareDocumentsByDisplayOrder(b, a)).toBeGreaterThan(0);
  });

  it("sorts by title when sortOrder is equal", () => {
    const a = makeDocument({ sortOrder: 1, title: "Alpha" });
    const b = makeDocument({ sortOrder: 1, title: "Beta" });

    expect(compareDocumentsByDisplayOrder(a, b)).toBeLessThan(0);
    expect(compareDocumentsByDisplayOrder(b, a)).toBeGreaterThan(0);
  });

  it("returns 0 for identical sortOrder and title", () => {
    const a = makeDocument({ sortOrder: 1, title: "Same" });
    const b = makeDocument({ sortOrder: 1, title: "Same" });

    expect(compareDocumentsByDisplayOrder(a, b)).toBe(0);
  });
});

describe("compareAnnouncementsForDisplay", () => {
  it("sorts pinned announcements first", () => {
    const pinned = makeAnnouncement({ isPinned: true, publishedAt: new Date("2026-01-01") });
    const unpinned = makeAnnouncement({ isPinned: false, publishedAt: new Date("2026-06-01") });

    expect(compareAnnouncementsForDisplay(pinned, unpinned)).toBeLessThan(0);
  });

  it("sorts by publishedAt descending when pin status is equal", () => {
    const newer = makeAnnouncement({ isPinned: false, publishedAt: new Date("2026-06-01") });
    const older = makeAnnouncement({ isPinned: false, publishedAt: new Date("2026-01-01") });

    expect(compareAnnouncementsForDisplay(newer, older)).toBeLessThan(0);
  });

  it("sorts by title when pin status and publishedAt are equal", () => {
    const a = makeAnnouncement({
      isPinned: false,
      publishedAt: new Date("2026-01-01"),
      title: "Alpha",
    });
    const b = makeAnnouncement({
      isPinned: false,
      publishedAt: new Date("2026-01-01"),
      title: "Beta",
    });

    expect(compareAnnouncementsForDisplay(a, b)).toBeLessThan(0);
  });
});

describe("compareFormVersionsDesc", () => {
  it("sorts by versionNumber descending", () => {
    const v1 = makeFormVersion({ versionNumber: 1 });
    const v2 = makeFormVersion({ versionNumber: 2 });

    expect(compareFormVersionsDesc(v1, v2)).toBeGreaterThan(0);
    expect(compareFormVersionsDesc(v2, v1)).toBeLessThan(0);
  });

  it("returns 0 for same version numbers", () => {
    const a = makeFormVersion({ versionNumber: 1 });
    const b = makeFormVersion({ versionNumber: 1 });

    expect(compareFormVersionsDesc(a, b)).toBe(0);
  });
});

describe("buildAdminEventSummaries", () => {
  it("returns empty array for empty input", () => {
    expect(buildAdminEventSummaries([])).toEqual([]);
  });

  it("sorts events by start date then name", () => {
    const events = [
      makeEvent({ eventStartsAt: new Date("2026-08-01"), id: "e3", name: "C Event" }),
      makeEvent({ eventStartsAt: new Date("2026-06-01"), id: "e1", name: "A Event" }),
      makeEvent({ eventStartsAt: new Date("2026-06-01"), id: "e2", name: "B Event" }),
    ];

    const summaries = buildAdminEventSummaries(events);
    expect(summaries.map((s) => s.id)).toEqual(["e1", "e2", "e3"]);
  });

  it("maps all required fields", () => {
    const summaries = buildAdminEventSummaries([makeEvent()]);
    expect(summaries[0]).toMatchObject({
      eventCode: "VNCMP",
      eventKey: "2026/VNCMP",
      id: "event-1",
      location: "Ho Chi Minh City",
      name: "Vietnam Championship",
      season: "2026",
      status: "registration_open",
      venue: "SECC",
    });
  });

  it("converts dates to ISO strings", () => {
    const summaries = buildAdminEventSummaries([makeEvent()]);
    expect(typeof summaries[0]?.eventStartsAt).toBe("string");
    expect(typeof summaries[0]?.eventEndsAt).toBe("string");
    expect(typeof summaries[0]?.updatedAt).toBe("string");
  });

  it("handles null optional fields", () => {
    const event = makeEvent({ location: null, venue: null });
    const summaries = buildAdminEventSummaries([event]);
    expect(summaries[0]?.location).toBeNull();
    expect(summaries[0]?.venue).toBeNull();
  });
});

describe("buildAdminEventDetail", () => {
  it("returns event with sorted nested resources", () => {
    const detail = buildAdminEventDetail({
      announcements: [
        makeAnnouncement({ id: "ann-2", isPinned: true, publishedAt: new Date("2026-05-01") }),
        makeAnnouncement({ id: "ann-1", isPinned: false, publishedAt: new Date("2026-06-01") }),
      ],
      documents: [
        makeDocument({ id: "doc-2", sortOrder: 5, title: "Later" }),
        makeDocument({ id: "doc-1", sortOrder: 1, title: "First" }),
      ],
      event: makeEvent(),
      registrationFormVersions: [
        makeFormVersion({ id: "form-1", versionNumber: 1 }),
        makeFormVersion({ id: "form-2", versionNumber: 3 }),
        makeFormVersion({ id: "form-3", versionNumber: 2 }),
      ],
    });

    expect(detail.announcements.map((a) => a.id)).toEqual(["ann-2", "ann-1"]);
    expect(detail.documents.map((d) => d.id)).toEqual(["doc-1", "doc-2"]);
    expect(detail.registrationFormVersions.map((f) => f.id)).toEqual(["form-2", "form-3", "form-1"]);
  });

  it("handles empty nested resources", () => {
    const detail = buildAdminEventDetail({
      announcements: [],
      documents: [],
      event: makeEvent(),
      registrationFormVersions: [],
    });

    expect(detail.announcements).toEqual([]);
    expect(detail.documents).toEqual([]);
    expect(detail.registrationFormVersions).toEqual([]);
  });

  it("maps event fields correctly", () => {
    const detail = buildAdminEventDetail({
      announcements: [],
      documents: [],
      event: makeEvent(),
      registrationFormVersions: [],
    });

    expect(detail.event.eventKey).toBe("2026/VNCMP");
    expect(detail.event.maxParticipants).toBe(48);
    expect(detail.event.timezone).toBe("Asia/Ho_Chi_Minh");
    expect(typeof detail.event.createdAt).toBe("string");
    expect(typeof detail.event.updatedAt).toBe("string");
  });

  it("converts null dates to null strings", () => {
    const event = makeEvent({ registrationEndsAt: null, registrationStartsAt: null });
    const detail = buildAdminEventDetail({
      announcements: [],
      documents: [],
      event,
      registrationFormVersions: [],
    });

    expect(detail.event.registrationEndsAt).toBeNull();
    expect(detail.event.registrationStartsAt).toBeNull();
  });

  it("handles unpublished form version with null publishedAt", () => {
    const detail = buildAdminEventDetail({
      announcements: [],
      documents: [],
      event: makeEvent(),
      registrationFormVersions: [makeFormVersion({ isPublished: false, publishedAt: null })],
    });

    expect(detail.registrationFormVersions[0]?.isPublished).toBe(false);
    expect(detail.registrationFormVersions[0]?.publishedAt).toBeNull();
  });
});
