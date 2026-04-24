import { describe, expect, it } from "vitest";
import * as v from "valibot";

import {
  createSeasonAnnouncementInputSchema,
  createSeasonDocumentInputSchema,
  createSeasonInputSchema,
  getPublicSeasonPageInputSchema,
  updateSeasonInputSchema,
} from "./season.js";

describe("season schemas", () => {
  it("accepts a valid public season page input", () => {
    const result = v.safeParse(getPublicSeasonPageInputSchema, {
      year: "2026",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid season years", () => {
    const result = v.safeParse(getPublicSeasonPageInputSchema, {
      year: "26",
    });

    expect(result.success).toBe(false);
  });

  it("applies create season defaults", () => {
    const parsed = v.parse(createSeasonInputSchema, {
      gameCode: "ITD-2026",
      theme: "Into the Deep",
      year: "2026",
    });

    expect(parsed).toEqual({
      gameCode: "ITD-2026",
      isActive: true,
      theme: "Into the Deep",
      year: "2026",
    });
  });

  it("rejects blank season fields after trim", () => {
    const result = v.safeParse(createSeasonInputSchema, {
      gameCode: "   ",
      theme: "   ",
      year: "2026",
    });

    expect(result.success).toBe(false);
  });

  it("requires isActive on season update", () => {
    const result = v.safeParse(updateSeasonInputSchema, {
      gameCode: "ITD-2026",
      theme: "Into the Deep",
      year: "2026",
    });

    expect(result.success).toBe(false);
  });

  it("applies create document defaults and validates URLs", () => {
    const parsed = v.parse(createSeasonDocumentInputSchema, {
      kind: "pdf",
      seasonYear: "2026",
      title: "Game Manual",
      url: "https://example.com/manual.pdf",
    });

    expect(parsed.sortOrder).toBe(0);

    const invalidUrl = v.safeParse(createSeasonDocumentInputSchema, {
      kind: "pdf",
      seasonYear: "2026",
      title: "Game Manual",
      url: "not-a-url",
    });

    expect(invalidUrl.success).toBe(false);
  });

  it("applies announcement defaults and validates timestamps", () => {
    const parsed = v.parse(createSeasonAnnouncementInputSchema, {
      body: "Registration opens this week.",
      publishedAt: "2026-10-01T10:00:00.000Z",
      seasonYear: "2026",
      title: "Registration Open",
    });

    expect(parsed.isPinned).toBe(false);
    expect(parsed.sortOrder).toBe(0);

    const invalidTimestamp = v.safeParse(createSeasonAnnouncementInputSchema, {
      body: "Registration opens this week.",
      publishedAt: "tomorrow",
      seasonYear: "2026",
      title: "Registration Open",
    });

    expect(invalidTimestamp.success).toBe(false);
  });
});
