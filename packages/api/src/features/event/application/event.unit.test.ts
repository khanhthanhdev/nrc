import { describe, expect, it } from "vitest";

import {
  buildAdminEventDetail,
  buildAdminEventSummaries,
  buildEventKey,
} from "./event.js";

const baseEvent = {
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
};

const baseDocument = {
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
};

const baseAnnouncement = {
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
};

const baseFormVersion = {
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
};

describe("event application builders", () => {
  it("builds canonical event keys", () => {
    expect(buildEventKey("2026", "VNCMP")).toBe("2026/VNCMP");
  });

  it("sorts admin event summaries by start date then name", () => {
    const summaries = buildAdminEventSummaries([
      {
        ...baseEvent,
        eventCode: "B",
        id: "event-b",
        name: "B Event",
      },
      {
        ...baseEvent,
        eventCode: "A",
        id: "event-a",
        name: "A Event",
      },
      {
        ...baseEvent,
        eventCode: "LATE",
        eventStartsAt: new Date("2026-08-01T00:00:00.000Z"),
        id: "event-late",
        name: "Late Event",
      },
    ]);

    expect(summaries.map((event) => event.id)).toEqual(["event-a", "event-b", "event-late"]);
  });

  it("builds admin detail with ordered nested resources and form versions", () => {
    const detail = buildAdminEventDetail({
      announcements: [
        baseAnnouncement,
        {
          ...baseAnnouncement,
          id: "announcement-2",
          isPinned: true,
          publishedAt: new Date("2026-05-01T00:00:00.000Z"),
          title: "Pinned",
        },
      ],
      documents: [
        {
          ...baseDocument,
          id: "document-2",
          sortOrder: 5,
          title: "Later",
        },
        baseDocument,
      ],
      event: baseEvent,
      registrationFormVersions: [
        baseFormVersion,
        {
          ...baseFormVersion,
          id: "form-2",
          isPublished: true,
          publishedAt: new Date("2026-02-01T00:00:00.000Z"),
          versionNumber: 2,
        },
      ],
    });

    expect(detail.documents.map((document) => document.id)).toEqual(["document-1", "document-2"]);
    expect(detail.announcements.map((announcement) => announcement.id)).toEqual([
      "announcement-2",
      "announcement-1",
    ]);
    expect(detail.registrationFormVersions.map((version) => version.id)).toEqual([
      "form-2",
      "form-1",
    ]);
    expect(detail.event.eventKey).toBe("2026/VNCMP");
  });
});
