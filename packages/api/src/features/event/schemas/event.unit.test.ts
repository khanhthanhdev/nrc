import * as v from "valibot";
import { describe, expect, it } from "vitest";

import {
  createEventInputSchema,
  createRegistrationFormVersionInputSchema,
  eventCodeSchema,
} from "./event.js";
import {
  getPublicMatchDetailInputSchema,
  listPublicMatchesInputSchema,
  listPublicRankingsInputSchema,
} from "./public-event-data.js";

describe("event schemas", () => {
  it("normalizes event codes and validates event creation", () => {
    const parsed = v.parse(createEventInputSchema, {
      eventCode: "vncmp",
      eventEndsAt: "2026-07-12T10:00:00.000Z",
      eventStartsAt: "2026-07-10T10:00:00.000Z",
      name: "Vietnam Championship",
      season: "2026",
      status: "registration_open",
    });

    expect(parsed.eventCode).toBe("VNCMP");
    expect(parsed.timezone).toBeUndefined();
  });

  it("rejects invalid event codes and seasons", () => {
    expect(v.safeParse(eventCodeSchema, "bad code").success).toBe(false);
    expect(
      v.safeParse(createEventInputSchema, {
        eventCode: "VNCMP",
        eventEndsAt: "2026-07-12T10:00:00.000Z",
        eventStartsAt: "2026-07-10T10:00:00.000Z",
        name: "Vietnam Championship",
        season: "26",
        status: "published",
      }).success,
    ).toBe(false);
  });

  it("requires registration form definitions to be JSON objects", () => {
    expect(
      v.safeParse(createRegistrationFormVersionInputSchema, {
        definition: {
          fields: [],
        },
        eventId: "event-1",
      }).success,
    ).toBe(true);

    expect(
      v.safeParse(createRegistrationFormVersionInputSchema, {
        definition: [],
        eventId: "event-1",
      }).success,
    ).toBe(false);
  });

  it("validates public event data query inputs", () => {
    expect(
      v.parse(listPublicMatchesInputSchema, {
        eventCode: "vncmp",
        phase: "QUALIFICATION",
        season: "2026",
      }),
    ).toEqual({
      eventCode: "VNCMP",
      phase: "QUALIFICATION",
      season: "2026",
    });

    expect(
      v.safeParse(listPublicMatchesInputSchema, {
        eventCode: "VNCMP",
        phase: "BAD_PHASE",
        season: "2026",
      }).success,
    ).toBe(false);

    expect(
      v.safeParse(getPublicMatchDetailInputSchema, {
        eventCode: "VNCMP",
        matchKey: "Q1",
        season: "2026",
      }).success,
    ).toBe(true);

    expect(
      v.safeParse(listPublicRankingsInputSchema, {
        eventCode: "VNCMP",
        season: "26",
      }).success,
    ).toBe(false);
  });
});
