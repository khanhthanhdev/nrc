import { describe, expect, it } from "vitest";

import {
  compareAnnouncementsForPublic,
  compareDocumentsByDisplayOrder,
  compareEventsForAdmin,
  compareEventsForPublic,
  compareSeasonYearsDesc,
  buildAdminSeasonSummaries,
  buildAdminSeasonDetail,
  buildPublicSeasonPage,
} from "./season.js";

const makeSeason = (overrides: Record<string, unknown> = {}) => ({
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  deletedAt: null,
  deletedByUserId: null,
  description: "Explore the unknown depths",
  gameCode: "ITD-2026",
  id: "season-2026",
  isActive: true,
  theme: "Into the Deep",
  updatedAt: new Date("2026-02-01T00:00:00.000Z"),
  year: "2026",
  ...overrides,
});

const makeEvent = (overrides: Record<string, unknown> = {}) => ({
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  deletedAt: null,
  deletedByUserId: null,
  description: "Regional qualifier",
  eventCode: "HANOI",
  eventEndsAt: new Date("2026-10-12T10:00:00.000Z"),
  eventKey: "2026-hanoi",
  eventStartsAt: new Date("2026-10-10T10:00:00.000Z"),
  id: "event-1",
  location: "Hanoi",
  maxParticipants: 48,
  name: "Hanoi Regional Hub",
  registrationEndsAt: new Date("2026-09-20T10:00:00.000Z"),
  registrationStartsAt: new Date("2026-08-20T10:00:00.000Z"),
  season: "2026",
  status: "registration_open" as const,
  summary: "First qualifier",
  timezone: "Asia/Ho_Chi_Minh",
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  venue: "Hanoi Innovation Hub",
  ...overrides,
});

const makeDocument = (overrides: Record<string, unknown> = {}) => ({
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  deletedAt: null,
  deletedByUserId: null,
  id: "document-1",
  kind: "pdf",
  seasonYear: "2026",
  sortOrder: 0,
  title: "Game Manual",
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  url: "https://example.com/manual.pdf",
  ...overrides,
});

const makeAnnouncement = (overrides: Record<string, unknown> = {}) => ({
  body: "Registration is now open.",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  deletedAt: null,
  deletedByUserId: null,
  id: "announcement-1",
  isPinned: false,
  publishedAt: new Date("2026-09-01T10:00:00.000Z"),
  seasonYear: "2026",
  sortOrder: 0,
  title: "Registration Open",
  updatedAt: new Date("2026-09-01T10:00:00.000Z"),
  ...overrides,
});

describe("compareSeasonYearsDesc", () => {
  it("sorts newer years first", () => {
    const newer = makeSeason({ year: "2027" });
    const older = makeSeason({ year: "2025" });

    expect(compareSeasonYearsDesc(newer, older)).toBeLessThan(0);
    expect(compareSeasonYearsDesc(older, newer)).toBeGreaterThan(0);
  });

  it("returns 0 for same years", () => {
    const a = makeSeason({ year: "2026" });
    const b = makeSeason({ year: "2026" });

    expect(compareSeasonYearsDesc(a, b)).toBe(0);
  });
});

describe("compareDocumentsByDisplayOrder (season)", () => {
  it("sorts by sortOrder ascending", () => {
    const a = makeDocument({ sortOrder: 1, title: "A" });
    const b = makeDocument({ sortOrder: 5, title: "A" });

    expect(compareDocumentsByDisplayOrder(a, b)).toBeLessThan(0);
  });

  it("sorts by title when sortOrder is equal", () => {
    const a = makeDocument({ sortOrder: 1, title: "Alpha" });
    const b = makeDocument({ sortOrder: 1, title: "Beta" });

    expect(compareDocumentsByDisplayOrder(a, b)).toBeLessThan(0);
  });
});

describe("compareAnnouncementsForPublic", () => {
  it("sorts pinned first", () => {
    const pinned = makeAnnouncement({
      isPinned: true,
      publishedAt: new Date("2026-01-01"),
      sortOrder: 0,
      title: "A",
    });
    const unpinned = makeAnnouncement({
      isPinned: false,
      publishedAt: new Date("2026-06-01"),
      sortOrder: 0,
      title: "A",
    });

    expect(compareAnnouncementsForPublic(pinned, unpinned)).toBeLessThan(0);
  });

  it("sorts by publishedAt descending when pin status is equal", () => {
    const newer = makeAnnouncement({
      isPinned: false,
      publishedAt: new Date("2026-06-01"),
      sortOrder: 0,
      title: "A",
    });
    const older = makeAnnouncement({
      isPinned: false,
      publishedAt: new Date("2026-01-01"),
      sortOrder: 0,
      title: "A",
    });

    expect(compareAnnouncementsForPublic(newer, older)).toBeLessThan(0);
  });

  it("sorts by sortOrder when pin and publishedAt are equal", () => {
    const a = makeAnnouncement({
      isPinned: false,
      publishedAt: new Date("2026-01-01"),
      sortOrder: 1,
      title: "A",
    });
    const b = makeAnnouncement({
      isPinned: false,
      publishedAt: new Date("2026-01-01"),
      sortOrder: 5,
      title: "A",
    });

    expect(compareAnnouncementsForPublic(a, b)).toBeLessThan(0);
  });

  it("sorts by title when all other fields are equal", () => {
    const a = makeAnnouncement({
      isPinned: false,
      publishedAt: new Date("2026-01-01"),
      sortOrder: 0,
      title: "Alpha",
    });
    const b = makeAnnouncement({
      isPinned: false,
      publishedAt: new Date("2026-01-01"),
      sortOrder: 0,
      title: "Beta",
    });

    expect(compareAnnouncementsForPublic(a, b)).toBeLessThan(0);
  });
});

describe("compareEventsForPublic / compareEventsForAdmin (season)", () => {
  it("sorts by eventStartsAt ascending", () => {
    const early = makeEvent({ eventStartsAt: new Date("2026-06-01"), name: "A" });
    const late = makeEvent({ eventStartsAt: new Date("2026-08-01"), name: "A" });

    expect(compareEventsForPublic(early, late)).toBeLessThan(0);
    expect(compareEventsForAdmin(early, late)).toBeLessThan(0);
  });

  it("sorts by name when dates are equal", () => {
    const a = makeEvent({ eventStartsAt: new Date("2026-06-01"), name: "Alpha" });
    const b = makeEvent({ eventStartsAt: new Date("2026-06-01"), name: "Beta" });

    expect(compareEventsForPublic(a, b)).toBeLessThan(0);
  });
});

describe("buildPublicSeasonPage", () => {
  it("filters draft events", () => {
    const page = buildPublicSeasonPage({
      announcements: [],
      documents: [],
      events: [
        makeEvent({ eventCode: "DRAFT", id: "draft-1", status: "draft" }),
        makeEvent({ eventCode: "OPEN", id: "open-1", status: "registration_open" }),
      ],
      season: makeSeason(),
      seasonOptions: [makeSeason()],
    });

    expect(page.events).toHaveLength(1);
    expect(page.events[0]?.eventCode).toBe("OPEN");
  });

  it("sorts season options by year descending", () => {
    const page = buildPublicSeasonPage({
      announcements: [],
      documents: [],
      events: [],
      season: makeSeason({ year: "2026" }),
      seasonOptions: [
        makeSeason({ year: "2025" }),
        makeSeason({ year: "2026" }),
        makeSeason({ year: "2024" }),
      ],
    });

    expect(page.seasonOptions.map((o) => o.year)).toEqual(["2026", "2025", "2024"]);
  });

  it("sorts documents by sortOrder", () => {
    const page = buildPublicSeasonPage({
      announcements: [],
      documents: [
        makeDocument({ id: "doc-2", sortOrder: 5, title: "B" }),
        makeDocument({ id: "doc-1", sortOrder: 1, title: "A" }),
      ],
      events: [],
      season: makeSeason(),
      seasonOptions: [],
    });

    expect(page.documents.map((d) => d.id)).toEqual(["doc-1", "doc-2"]);
  });

  it("maps season fields correctly", () => {
    const page = buildPublicSeasonPage({
      announcements: [],
      documents: [],
      events: [],
      season: makeSeason(),
      seasonOptions: [],
    });

    expect(page.season.year).toBe("2026");
    expect(page.season.gameCode).toBe("ITD-2026");
    expect(page.season.theme).toBe("Into the Deep");
    expect(page.season.isActive).toBe(true);
  });

  it("handles null description", () => {
    const page = buildPublicSeasonPage({
      announcements: [],
      documents: [],
      events: [],
      season: makeSeason({ description: null }),
      seasonOptions: [],
    });

    expect(page.season.description).toBeNull();
  });

  it("converts event dates to ISO strings", () => {
    const page = buildPublicSeasonPage({
      announcements: [],
      documents: [],
      events: [makeEvent()],
      season: makeSeason(),
      seasonOptions: [],
    });

    expect(typeof page.events[0]?.eventEndsAt).toBe("string");
    expect(typeof page.events[0]?.eventStartsAt).toBe("string");
  });

  it("converts announcement publishedAt to ISO string", () => {
    const page = buildPublicSeasonPage({
      announcements: [makeAnnouncement()],
      documents: [],
      events: [],
      season: makeSeason(),
      seasonOptions: [],
    });

    expect(typeof page.announcements[0]?.publishedAt).toBe("string");
  });
});

describe("buildAdminSeasonSummaries", () => {
  it("returns empty array for empty input", () => {
    expect(buildAdminSeasonSummaries([])).toEqual([]);
  });

  it("sorts by year descending", () => {
    const summaries = buildAdminSeasonSummaries([
      makeSeason({ year: "2024" }),
      makeSeason({ year: "2026" }),
      makeSeason({ year: "2025" }),
    ]);

    expect(summaries.map((s) => s.year)).toEqual(["2026", "2025", "2024"]);
  });

  it("maps required fields", () => {
    const summaries = buildAdminSeasonSummaries([makeSeason()]);
    expect(summaries[0]).toMatchObject({
      gameCode: "ITD-2026",
      isActive: true,
      theme: "Into the Deep",
      year: "2026",
    });
    expect(typeof summaries[0]?.updatedAt).toBe("string");
  });
});

describe("buildAdminSeasonDetail", () => {
  it("sorts all nested resources", () => {
    const detail = buildAdminSeasonDetail({
      announcements: [
        makeAnnouncement({ id: "ann-1", isPinned: true, publishedAt: new Date("2026-05-01") }),
        makeAnnouncement({ id: "ann-2", isPinned: false, publishedAt: new Date("2026-06-01") }),
      ],
      documents: [
        makeDocument({ id: "doc-2", sortOrder: 5 }),
        makeDocument({ id: "doc-1", sortOrder: 1 }),
      ],
      events: [
        makeEvent({ eventStartsAt: new Date("2026-08-01"), id: "e2", name: "Late" }),
        makeEvent({ eventStartsAt: new Date("2026-06-01"), id: "e1", name: "Early" }),
      ],
      season: makeSeason(),
    });

    expect(detail.announcements.map((a) => a.id)).toEqual(["ann-1", "ann-2"]);
    expect(detail.documents.map((d) => d.id)).toEqual(["doc-1", "doc-2"]);
    expect(detail.events.map((e) => e.id)).toEqual(["e1", "e2"]);
  });

  it("handles empty nested resources", () => {
    const detail = buildAdminSeasonDetail({
      announcements: [],
      documents: [],
      events: [],
      season: makeSeason(),
    });

    expect(detail.announcements).toEqual([]);
    expect(detail.documents).toEqual([]);
    expect(detail.events).toEqual([]);
    expect(detail.season.year).toBe("2026");
  });

  it("maps season dates to ISO strings", () => {
    const detail = buildAdminSeasonDetail({
      announcements: [],
      documents: [],
      events: [],
      season: makeSeason(),
    });

    expect(typeof detail.season.createdAt).toBe("string");
    expect(typeof detail.season.updatedAt).toBe("string");
  });

  it("maps event summary fields", () => {
    const detail = buildAdminSeasonDetail({
      announcements: [],
      documents: [],
      events: [makeEvent()],
      season: makeSeason(),
    });

    expect(detail.events[0]).toMatchObject({
      eventCode: "HANOI",
      id: "event-1",
      name: "Hanoi Regional Hub",
      status: "registration_open",
    });
    expect(typeof detail.events[0]?.eventStartsAt).toBe("string");
    expect(typeof detail.events[0]?.eventEndsAt).toBe("string");
  });
});
