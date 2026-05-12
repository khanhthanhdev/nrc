import { describe, expect, it } from "vitest";
import * as v from "valibot";

import {
  createEventAnnouncementInputSchema,
  createEventDocumentInputSchema,
  createEventInputSchema,
  createRegistrationFormVersionInputSchema,
  deleteEventAnnouncementInputSchema,
  deleteEventDocumentInputSchema,
  deleteEventInputSchema,
  deleteRegistrationFormVersionInputSchema,
  eventCodeSchema,
  eventStatusSchema,
  getAdminEventInputSchema,
  getPublicEventInputSchema,
  listAdminEventsInputSchema,
  publishRegistrationFormVersionInputSchema,
  seasonYearSchema,
  sortOrderSchema,
  updateEventAnnouncementInputSchema,
  updateEventDocumentInputSchema,
  updateEventInputSchema,
} from "./event.js";
import {
  getPublicMatchDetailInputSchema,
  listPublicAwardsInputSchema,
  listPublicMatchesInputSchema,
  listPublicRankingsInputSchema,
} from "./public-event-data.js";

describe("seasonYearSchema", () => {
  it("accepts valid 4-digit years", () => {
    expect(v.safeParse(seasonYearSchema, "2026").success).toBe(true);
    expect(v.safeParse(seasonYearSchema, "2025").success).toBe(true);
  });

  it("rejects 2-digit years", () => {
    expect(v.safeParse(seasonYearSchema, "26").success).toBe(false);
  });

  it("rejects 3-digit years", () => {
    expect(v.safeParse(seasonYearSchema, "026").success).toBe(false);
  });

  it("rejects 5-digit years", () => {
    expect(v.safeParse(seasonYearSchema, "20260").success).toBe(false);
  });

  it("rejects non-numeric strings", () => {
    expect(v.safeParse(seasonYearSchema, "abcd").success).toBe(false);
  });

  it("trims whitespace", () => {
    const result = v.parse(seasonYearSchema, "  2026  ");
    expect(result).toBe("2026");
  });
});

describe("eventCodeSchema", () => {
  it("accepts valid uppercase codes", () => {
    expect(v.safeParse(eventCodeSchema, "VNCMP").success).toBe(true);
    expect(v.safeParse(eventCodeSchema, "HANOI").success).toBe(true);
    expect(v.safeParse(eventCodeSchema, "E1").success).toBe(true);
  });

  it("normalizes to uppercase", () => {
    const result = v.parse(eventCodeSchema, "vncmp");
    expect(result).toBe("VNCMP");
  });

  it("accepts codes with dashes and underscores", () => {
    expect(v.safeParse(eventCodeSchema, "MY_EVENT").success).toBe(true);
    expect(v.safeParse(eventCodeSchema, "MY-EVENT").success).toBe(true);
  });

  it("rejects codes with spaces", () => {
    expect(v.safeParse(eventCodeSchema, "MY EVENT").success).toBe(false);
  });

  it("rejects single character codes", () => {
    expect(v.safeParse(eventCodeSchema, "V").success).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(v.safeParse(eventCodeSchema, "").success).toBe(false);
  });

  it("rejects codes starting with dash or underscore", () => {
    expect(v.safeParse(eventCodeSchema, "-VNCMP").success).toBe(false);
    expect(v.safeParse(eventCodeSchema, "_VNCMP").success).toBe(false);
  });
});

describe("eventStatusSchema", () => {
  it.each(["draft", "published", "registration_open", "registration_closed", "active", "completed", "archived"])(
    "accepts %s",
    (status) => {
      expect(v.safeParse(eventStatusSchema, status).success).toBe(true);
    },
  );

  it("rejects invalid statuses", () => {
    expect(v.safeParse(eventStatusSchema, "deleted").success).toBe(false);
    expect(v.safeParse(eventStatusSchema, "PUBLISHED").success).toBe(false);
  });
});

describe("sortOrderSchema", () => {
  it("accepts 0", () => {
    expect(v.safeParse(sortOrderSchema, 0).success).toBe(true);
  });

  it("accepts positive integers", () => {
    expect(v.safeParse(sortOrderSchema, 5).success).toBe(true);
  });

  it("accepts max value 10000", () => {
    expect(v.safeParse(sortOrderSchema, 10_000).success).toBe(true);
  });

  it("rejects negative numbers", () => {
    expect(v.safeParse(sortOrderSchema, -1).success).toBe(false);
  });

  it("rejects values over 10000", () => {
    expect(v.safeParse(sortOrderSchema, 10_001).success).toBe(false);
  });

  it("rejects non-integers", () => {
    expect(v.safeParse(sortOrderSchema, 1.5).success).toBe(false);
  });
});

describe("createEventInputSchema", () => {
  const validInput = {
    eventCode: "VNCMP",
    eventEndsAt: "2026-07-12T10:00:00.000Z",
    eventStartsAt: "2026-07-10T10:00:00.000Z",
    name: "Vietnam Championship",
    season: "2026",
    status: "registration_open" as const,
  };

  it("accepts valid minimal input", () => {
    const result = v.safeParse(createEventInputSchema, validInput);
    expect(result.success).toBe(true);
  });

  it("accepts input with all optional fields", () => {
    const result = v.safeParse(createEventInputSchema, {
      ...validInput,
      description: "National championship",
      location: "Ho Chi Minh City",
      maxParticipants: 48,
      registrationEndsAt: "2026-06-20T10:00:00.000Z",
      registrationStartsAt: "2026-05-20T10:00:00.000Z",
      summary: "Season final event",
      timezone: "Asia/Ho_Chi_Minh",
      venue: "SECC",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown keys (strictObject)", () => {
    const result = v.safeParse(createEventInputSchema, {
      ...validInput,
      unknownField: "nope",
    });
    expect(result.success).toBe(false);
  });

  it("rejects blank name after trim", () => {
    const result = v.safeParse(createEventInputSchema, {
      ...validInput,
      name: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid timestamp strings", () => {
    const result = v.safeParse(createEventInputSchema, {
      ...validInput,
      eventEndsAt: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxParticipants less than 1", () => {
    const result = v.safeParse(createEventInputSchema, {
      ...validInput,
      maxParticipants: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxParticipants over 10000", () => {
    const result = v.safeParse(createEventInputSchema, {
      ...validInput,
      maxParticipants: 10_001,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateEventInputSchema", () => {
  const validInput = {
    eventCode: "VNCMP",
    eventEndsAt: "2026-07-12T10:00:00.000Z",
    eventStartsAt: "2026-07-10T10:00:00.000Z",
    id: "event-1",
    name: "Vietnam Championship",
    season: "2026",
    status: "registration_open" as const,
  };

  it("accepts valid input", () => {
    expect(v.safeParse(updateEventInputSchema, validInput).success).toBe(true);
  });

  it("rejects blank id", () => {
    expect(v.safeParse(updateEventInputSchema, { ...validInput, id: "   " }).success).toBe(false);
  });

  it("does not require strictObject (allows extra keys)", () => {
    const result = v.safeParse(updateEventInputSchema, { ...validInput, extra: "field" });
    expect(result.success).toBe(true);
  });
});

describe("deleteEventInputSchema", () => {
  it("accepts valid id", () => {
    expect(v.safeParse(deleteEventInputSchema, { id: "event-1" }).success).toBe(true);
  });

  it("rejects blank id", () => {
    expect(v.safeParse(deleteEventInputSchema, { id: "   " }).success).toBe(false);
  });
});

describe("getPublicEventInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(getPublicEventInputSchema, { eventCode: "VNCMP", season: "2026" }).success).toBe(true);
  });

  it("normalizes event code to uppercase", () => {
    const result = v.parse(getPublicEventInputSchema, { eventCode: "vncmp", season: "2026" });
    expect(result.eventCode).toBe("VNCMP");
  });

  it("rejects invalid season", () => {
    expect(v.safeParse(getPublicEventInputSchema, { eventCode: "VNCMP", season: "26" }).success).toBe(false);
  });
});

describe("listAdminEventsInputSchema", () => {
  it("accepts empty input with defaults", () => {
    const result = v.parse(listAdminEventsInputSchema, undefined);
    expect(result.includeDeleted).toBe(false);
  });

  it("accepts includeDeleted and season filter", () => {
    const result = v.parse(listAdminEventsInputSchema, { includeDeleted: true, season: "2026" });
    expect(result.includeDeleted).toBe(true);
    expect(result.season).toBe("2026");
  });

  it("defaults includeDeleted to false", () => {
    const result = v.parse(listAdminEventsInputSchema, {});
    expect(result.includeDeleted).toBe(false);
  });
});

describe("createEventDocumentInputSchema", () => {
  const validInput = {
    eventId: "event-1",
    kind: "pdf",
    title: "Venue Packet",
    url: "https://example.com/venue.pdf",
  };

  it("accepts valid input", () => {
    expect(v.safeParse(createEventDocumentInputSchema, validInput).success).toBe(true);
  });

  it("defaults isPublic to true", () => {
    const result = v.parse(createEventDocumentInputSchema, validInput);
    expect(result.isPublic).toBe(true);
  });

  it("defaults sortOrder to 0", () => {
    const result = v.parse(createEventDocumentInputSchema, validInput);
    expect(result.sortOrder).toBe(0);
  });

  it("rejects invalid URL", () => {
    expect(v.safeParse(createEventDocumentInputSchema, { ...validInput, url: "not-a-url" }).success).toBe(false);
  });

  it("rejects URL exceeding 2000 chars", () => {
    expect(v.safeParse(createEventDocumentInputSchema, { ...validInput, url: `https://example.com/${"a".repeat(2000)}` }).success).toBe(false);
  });
});

describe("updateEventDocumentInputSchema", () => {
  const validInput = {
    eventId: "event-1",
    id: "document-1",
    isPublic: true,
    kind: "pdf",
    sortOrder: 0,
    title: "Venue Packet",
    url: "https://example.com/venue.pdf",
  };

  it("accepts valid input", () => {
    expect(v.safeParse(updateEventDocumentInputSchema, validInput).success).toBe(true);
  });

  it("rejects blank id", () => {
    expect(v.safeParse(updateEventDocumentInputSchema, { ...validInput, id: "   " }).success).toBe(false);
  });
});

describe("deleteEventDocumentInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(deleteEventDocumentInputSchema, { eventId: "event-1", id: "doc-1" }).success).toBe(true);
  });

  it("rejects blank ids", () => {
    expect(v.safeParse(deleteEventDocumentInputSchema, { eventId: "   ", id: "doc-1" }).success).toBe(false);
    expect(v.safeParse(deleteEventDocumentInputSchema, { eventId: "event-1", id: "   " }).success).toBe(false);
  });
});

describe("createEventAnnouncementInputSchema", () => {
  const validInput = {
    body: "Doors open at 8:00.",
    eventId: "event-1",
    publishedAt: "2026-06-01T00:00:00.000Z",
    title: "Schedule",
  };

  it("accepts valid input", () => {
    expect(v.safeParse(createEventAnnouncementInputSchema, validInput).success).toBe(true);
  });

  it("defaults isPinned to false", () => {
    const result = v.parse(createEventAnnouncementInputSchema, validInput);
    expect(result.isPinned).toBe(false);
  });

  it("rejects blank body", () => {
    expect(v.safeParse(createEventAnnouncementInputSchema, { ...validInput, body: "   " }).success).toBe(false);
  });

  it("rejects body exceeding 10000 chars", () => {
    expect(v.safeParse(createEventAnnouncementInputSchema, { ...validInput, body: "a".repeat(10_001) }).success).toBe(false);
  });

  it("rejects invalid publishedAt", () => {
    expect(v.safeParse(createEventAnnouncementInputSchema, { ...validInput, publishedAt: "not-a-date" }).success).toBe(false);
  });
});

describe("updateEventAnnouncementInputSchema", () => {
  const validInput = {
    body: "Updated body",
    eventId: "event-1",
    id: "announcement-1",
    isPinned: true,
    publishedAt: "2026-06-01T00:00:00.000Z",
    title: "Updated Title",
  };

  it("accepts valid input", () => {
    expect(v.safeParse(updateEventAnnouncementInputSchema, validInput).success).toBe(true);
  });

  it("rejects blank id", () => {
    expect(v.safeParse(updateEventAnnouncementInputSchema, { ...validInput, id: "   " }).success).toBe(false);
  });
});

describe("deleteEventAnnouncementInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(deleteEventAnnouncementInputSchema, { eventId: "event-1", id: "ann-1" }).success).toBe(true);
  });
});

describe("createRegistrationFormVersionInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(createRegistrationFormVersionInputSchema, {
      definition: { fields: [] },
      eventId: "event-1",
    }).success).toBe(true);
  });

  it("defaults isPublished to false", () => {
    const result = v.parse(createRegistrationFormVersionInputSchema, {
      definition: { fields: [] },
      eventId: "event-1",
    });
    expect(result.isPublished).toBe(false);
  });

  it("rejects array definitions", () => {
    expect(v.safeParse(createRegistrationFormVersionInputSchema, {
      definition: [],
      eventId: "event-1",
    }).success).toBe(false);
  });

  it("rejects null definitions", () => {
    expect(v.safeParse(createRegistrationFormVersionInputSchema, {
      definition: null,
      eventId: "event-1",
    }).success).toBe(false);
  });

  it("rejects primitive definitions", () => {
    expect(v.safeParse(createRegistrationFormVersionInputSchema, {
      definition: "string",
      eventId: "event-1",
    }).success).toBe(false);
  });
});

describe("publishRegistrationFormVersionInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(publishRegistrationFormVersionInputSchema, {
      eventId: "event-1",
      id: "form-1",
    }).success).toBe(true);
  });

  it("rejects blank ids", () => {
    expect(v.safeParse(publishRegistrationFormVersionInputSchema, {
      eventId: "   ",
      id: "form-1",
    }).success).toBe(false);
  });
});

describe("deleteRegistrationFormVersionInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(deleteRegistrationFormVersionInputSchema, {
      eventId: "event-1",
      id: "form-1",
    }).success).toBe(true);
  });
});

describe("listPublicMatchesInputSchema", () => {
  it("accepts valid input without phase", () => {
    expect(v.safeParse(listPublicMatchesInputSchema, {
      eventCode: "VNCMP",
      season: "2026",
    }).success).toBe(true);
  });

  it("accepts valid input with phase", () => {
    expect(v.safeParse(listPublicMatchesInputSchema, {
      eventCode: "VNCMP",
      phase: "QUALIFICATION",
      season: "2026",
    }).success).toBe(true);
  });

  it("normalizes event code to uppercase", () => {
    const result = v.parse(listPublicMatchesInputSchema, {
      eventCode: "vncmp",
      season: "2026",
    });
    expect(result.eventCode).toBe("VNCMP");
  });

  it("rejects invalid phase", () => {
    expect(v.safeParse(listPublicMatchesInputSchema, {
      eventCode: "VNCMP",
      phase: "FINALS",
      season: "2026",
    }).success).toBe(false);
  });

  it("defaults phase to undefined", () => {
    const result = v.parse(listPublicMatchesInputSchema, {
      eventCode: "VNCMP",
      season: "2026",
    });
    expect(result.phase).toBeUndefined();
  });
});

describe("getPublicMatchDetailInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(getPublicMatchDetailInputSchema, {
      eventCode: "VNCMP",
      matchKey: "Q1",
      season: "2026",
    }).success).toBe(true);
  });

  it("rejects single-char matchKey", () => {
    expect(v.safeParse(getPublicMatchDetailInputSchema, {
      eventCode: "VNCMP",
      matchKey: "Q",
      season: "2026",
    }).success).toBe(false);
  });

  it("rejects matchKey exceeding 20 chars", () => {
    expect(v.safeParse(getPublicMatchDetailInputSchema, {
      eventCode: "VNCMP",
      matchKey: "Q".repeat(21),
      season: "2026",
    }).success).toBe(false);
  });
});

describe("listPublicRankingsInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(listPublicRankingsInputSchema, {
      eventCode: "VNCMP",
      season: "2026",
    }).success).toBe(true);
  });

  it("rejects invalid season", () => {
    expect(v.safeParse(listPublicRankingsInputSchema, {
      eventCode: "VNCMP",
      season: "26",
    }).success).toBe(false);
  });
});

describe("listPublicAwardsInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(listPublicAwardsInputSchema, {
      eventCode: "VNCMP",
      season: "2026",
    }).success).toBe(true);
  });
});
