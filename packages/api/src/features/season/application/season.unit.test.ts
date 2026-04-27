import { describe, expect, it } from "vitest";

import {
  buildAdminSeasonDetail,
  buildAdminSeasonSummaries,
  buildPublicSeasonPage,
} from "./season.js";

const baseSeason = {
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  deletedAt: null,
  deletedByUserId: null,
  description: "Explore the unknown depths and engineer your way to victory.",
  gameCode: "ITD-2026",
  id: "season-2026",
  isActive: true,
  theme: "Into the Deep",
  updatedAt: new Date("2026-02-01T00:00:00.000Z"),
  year: "2026",
};

const olderSeason = {
  ...baseSeason,
  gameCode: "SUB-2025",
  id: "season-2025",
  theme: "Submerged",
  updatedAt: new Date("2025-02-01T00:00:00.000Z"),
  year: "2025",
};

const baseEvent = {
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  deletedAt: null,
  deletedByUserId: null,
  description: "Regional qualifier",
  eventCode: "HANOI",
  eventEndsAt: new Date("2026-10-12T10:00:00.000Z"),
  eventKey: "2026-hanoi",
  eventStartsAt: new Date("2026-10-10T10:00:00.000Z"),
  id: "event-hanoi",
  location: "Hanoi",
  maxParticipants: 48,
  name: "Hanoi Regional Hub",
  registrationEndsAt: new Date("2026-09-20T10:00:00.000Z"),
  registrationStartsAt: new Date("2026-08-20T10:00:00.000Z"),
  season: "2026",
  status: "registration_open" as const,
  summary: "First qualifier of the season",
  timezone: "Asia/Ho_Chi_Minh",
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  venue: "Hanoi Innovation Hub",
};

const baseDocument = {
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
};

const baseAnnouncement = {
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
};

describe("season application builders", () => {
  it("builds a public season page with sorted switcher, filtered events, and ordered content", () => {
    const publicPage = buildPublicSeasonPage({
      announcements: [
        baseAnnouncement,
        {
          ...baseAnnouncement,
          id: "announcement-2",
          isPinned: true,
          publishedAt: new Date("2026-08-20T10:00:00.000Z"),
          sortOrder: 10,
          title: "Pinned Earlier Notice",
        },
      ],
      documents: [
        {
          ...baseDocument,
          id: "document-2",
          sortOrder: 2,
          title: "Q&A",
        },
        {
          ...baseDocument,
          id: "document-3",
          sortOrder: 1,
          title: "Field CAD",
        },
      ],
      events: [
        {
          ...baseEvent,
          eventCode: "DRAFT",
          id: "event-draft",
          name: "Draft Event",
          status: "draft",
        },
        {
          ...baseEvent,
          eventCode: "HCMC",
          eventStartsAt: new Date("2026-11-05T10:00:00.000Z"),
          id: "event-hcmc",
          name: "HCMC Regional Hub",
        },
        baseEvent,
      ],
      season: baseSeason,
      seasonOptions: [olderSeason, baseSeason],
    });

    expect(publicPage.season.year).toBe("2026");
    expect(publicPage.seasonOptions.map((option) => option.year)).toEqual(["2026", "2025"]);
    expect(publicPage.events.map((event) => event.eventCode)).toEqual(["HANOI", "HCMC"]);
    expect(publicPage.documents.map((document) => document.id)).toEqual([
      "document-3",
      "document-2",
    ]);
    expect(publicPage.announcements.map((announcement) => announcement.id)).toEqual([
      "announcement-2",
      "announcement-1",
    ]);
  });

  it("builds admin season summaries newest first", () => {
    const summaries = buildAdminSeasonSummaries([olderSeason, baseSeason]);

    expect(summaries.map((summary) => summary.year)).toEqual(["2026", "2025"]);
  });

  it("builds an admin season detail with sorted nested resources", () => {
    const detail = buildAdminSeasonDetail({
      announcements: [
        {
          ...baseAnnouncement,
          id: "announcement-2",
          isPinned: true,
          publishedAt: new Date("2026-08-20T10:00:00.000Z"),
          title: "Pinned Earlier Notice",
        },
        baseAnnouncement,
      ],
      documents: [
        {
          ...baseDocument,
          id: "document-2",
          sortOrder: 5,
          title: "Field Drawings",
        },
        {
          ...baseDocument,
          id: "document-1",
          sortOrder: 1,
          title: "Game Manual",
        },
      ],
      events: [
        {
          ...baseEvent,
          eventCode: "FINALE",
          eventStartsAt: new Date("2027-02-20T10:00:00.000Z"),
          id: "event-finale",
          name: "Season Finale",
        },
        baseEvent,
      ],
      season: baseSeason,
    });

    expect(detail.documents.map((document) => document.id)).toEqual(["document-1", "document-2"]);
    expect(detail.announcements.map((announcement) => announcement.id)).toEqual([
      "announcement-2",
      "announcement-1",
    ]);
    expect(detail.events.map((event) => event.id)).toEqual(["event-hanoi", "event-finale"]);
  });
});
