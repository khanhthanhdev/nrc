import { describe, expect, it } from "vitest";
import * as v from "valibot";

import {
  createSeasonAnnouncementInputSchema,
  createSeasonDocumentInputSchema,
  createSeasonInputSchema,
  deleteSeasonAnnouncementInputSchema,
  deleteSeasonDocumentInputSchema,
  deleteSeasonInputSchema,
  getAdminSeasonInputSchema,
  getPublicSeasonPageInputSchema,
  listAdminSeasonsInputSchema,
  seasonYearSchema,
  sortOrderSchema,
  updateSeasonAnnouncementInputSchema,
  updateSeasonDocumentInputSchema,
  updateSeasonInputSchema,
} from "./season.js";

describe("seasonYearSchema", () => {
  it("accepts valid 4-digit years", () => {
    expect(v.safeParse(seasonYearSchema, "2026").success).toBe(true);
    expect(v.safeParse(seasonYearSchema, "2025").success).toBe(true);
    expect(v.safeParse(seasonYearSchema, "1999").success).toBe(true);
  });

  it("trims whitespace", () => {
    const result = v.parse(seasonYearSchema, "  2026  ");
    expect(result).toBe("2026");
  });

  it("rejects 2-digit years", () => {
    expect(v.safeParse(seasonYearSchema, "26").success).toBe(false);
  });

  it("rejects 5-digit years", () => {
    expect(v.safeParse(seasonYearSchema, "20260").success).toBe(false);
  });

  it("rejects non-numeric strings", () => {
    expect(v.safeParse(seasonYearSchema, "abcd").success).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(v.safeParse(seasonYearSchema, "").success).toBe(false);
  });
});

describe("sortOrderSchema", () => {
  it("accepts 0", () => {
    expect(v.safeParse(sortOrderSchema, 0).success).toBe(true);
  });

  it("accepts positive integers", () => {
    expect(v.safeParse(sortOrderSchema, 100).success).toBe(true);
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

describe("getPublicSeasonPageInputSchema", () => {
  it("accepts valid year", () => {
    expect(v.safeParse(getPublicSeasonPageInputSchema, { year: "2026" }).success).toBe(true);
  });

  it("rejects invalid year", () => {
    expect(v.safeParse(getPublicSeasonPageInputSchema, { year: "26" }).success).toBe(false);
  });
});

describe("listAdminSeasonsInputSchema", () => {
  it("accepts undefined input with defaults", () => {
    const result = v.parse(listAdminSeasonsInputSchema, undefined);
    expect(result.includeDeleted).toBe(false);
  });

  it("accepts empty object with defaults", () => {
    const result = v.parse(listAdminSeasonsInputSchema, {});
    expect(result.includeDeleted).toBe(false);
  });

  it("accepts includeDeleted true", () => {
    const result = v.parse(listAdminSeasonsInputSchema, { includeDeleted: true });
    expect(result.includeDeleted).toBe(true);
  });
});

describe("getAdminSeasonInputSchema", () => {
  it("accepts valid year", () => {
    expect(v.safeParse(getAdminSeasonInputSchema, { year: "2026" }).success).toBe(true);
  });

  it("rejects invalid year", () => {
    expect(v.safeParse(getAdminSeasonInputSchema, { year: "abc" }).success).toBe(false);
  });
});

describe("createSeasonInputSchema", () => {
  const validInput = {
    gameCode: "ITD-2026",
    theme: "Into the Deep",
    year: "2026",
  };

  it("accepts valid minimal input", () => {
    expect(v.safeParse(createSeasonInputSchema, validInput).success).toBe(true);
  });

  it("accepts input with all optional fields", () => {
    expect(v.safeParse(createSeasonInputSchema, {
      ...validInput,
      description: "Explore the unknown depths",
      isActive: false,
    }).success).toBe(true);
  });

  it("defaults isActive to true", () => {
    const result = v.parse(createSeasonInputSchema, validInput);
    expect(result.isActive).toBe(true);
  });

  it("rejects unknown keys (strictObject)", () => {
    expect(v.safeParse(createSeasonInputSchema, {
      ...validInput,
      unknownField: "nope",
    }).success).toBe(false);
  });

  it("rejects blank gameCode after trim", () => {
    expect(v.safeParse(createSeasonInputSchema, {
      ...validInput,
      gameCode: "   ",
    }).success).toBe(false);
  });

  it("rejects blank theme after trim", () => {
    expect(v.safeParse(createSeasonInputSchema, {
      ...validInput,
      theme: "   ",
    }).success).toBe(false);
  });

  it("rejects gameCode exceeding 50 chars", () => {
    expect(v.safeParse(createSeasonInputSchema, {
      ...validInput,
      gameCode: "A".repeat(51),
    }).success).toBe(false);
  });

  it("rejects theme exceeding 255 chars", () => {
    expect(v.safeParse(createSeasonInputSchema, {
      ...validInput,
      theme: "A".repeat(256),
    }).success).toBe(false);
  });

  it("rejects description exceeding 4000 chars", () => {
    expect(v.safeParse(createSeasonInputSchema, {
      ...validInput,
      description: "A".repeat(4001),
    }).success).toBe(false);
  });

  it("accepts null description", () => {
    expect(v.safeParse(createSeasonInputSchema, {
      ...validInput,
      description: null,
    }).success).toBe(true);
  });
});

describe("updateSeasonInputSchema", () => {
  const validInput = {
    gameCode: "ITD-2026",
    isActive: true,
    theme: "Into the Deep",
    year: "2026",
  };

  it("accepts valid input", () => {
    expect(v.safeParse(updateSeasonInputSchema, validInput).success).toBe(true);
  });

  it("requires isActive field", () => {
    expect(v.safeParse(updateSeasonInputSchema, {
      gameCode: "ITD-2026",
      theme: "Into the Deep",
      year: "2026",
    }).success).toBe(false);
  });

  it("does not use strictObject (allows extra keys)", () => {
    expect(v.safeParse(updateSeasonInputSchema, {
      ...validInput,
      extra: "field",
    }).success).toBe(true);
  });
});

describe("deleteSeasonInputSchema", () => {
  it("accepts valid year", () => {
    expect(v.safeParse(deleteSeasonInputSchema, { year: "2026" }).success).toBe(true);
  });

  it("rejects invalid year", () => {
    expect(v.safeParse(deleteSeasonInputSchema, { year: "26" }).success).toBe(false);
  });
});

describe("createSeasonDocumentInputSchema", () => {
  const validInput = {
    kind: "pdf",
    seasonYear: "2026",
    title: "Game Manual",
    url: "https://example.com/manual.pdf",
  };

  it("accepts valid input", () => {
    expect(v.safeParse(createSeasonDocumentInputSchema, validInput).success).toBe(true);
  });

  it("defaults sortOrder to 0", () => {
    const result = v.parse(createSeasonDocumentInputSchema, validInput);
    expect(result.sortOrder).toBe(0);
  });

  it("rejects invalid URL", () => {
    expect(v.safeParse(createSeasonDocumentInputSchema, {
      ...validInput,
      url: "not-a-url",
    }).success).toBe(false);
  });

  it("rejects URL exceeding 2000 chars", () => {
    expect(v.safeParse(createSeasonDocumentInputSchema, {
      ...validInput,
      url: `https://example.com/${"a".repeat(2000)}`,
    }).success).toBe(false);
  });

  it("rejects blank kind", () => {
    expect(v.safeParse(createSeasonDocumentInputSchema, {
      ...validInput,
      kind: "   ",
    }).success).toBe(false);
  });

  it("rejects kind exceeding 80 chars", () => {
    expect(v.safeParse(createSeasonDocumentInputSchema, {
      ...validInput,
      kind: "A".repeat(81),
    }).success).toBe(false);
  });

  it("rejects blank title", () => {
    expect(v.safeParse(createSeasonDocumentInputSchema, {
      ...validInput,
      title: "   ",
    }).success).toBe(false);
  });
});

describe("updateSeasonDocumentInputSchema", () => {
  const validInput = {
    id: "document-1",
    kind: "pdf",
    seasonYear: "2026",
    sortOrder: 1,
    title: "Game Manual",
    url: "https://example.com/manual.pdf",
  };

  it("accepts valid input", () => {
    expect(v.safeParse(updateSeasonDocumentInputSchema, validInput).success).toBe(true);
  });

  it("rejects blank id", () => {
    expect(v.safeParse(updateSeasonDocumentInputSchema, {
      ...validInput,
      id: "   ",
    }).success).toBe(false);
  });
});

describe("deleteSeasonDocumentInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(deleteSeasonDocumentInputSchema, {
      id: "document-1",
      seasonYear: "2026",
    }).success).toBe(true);
  });

  it("rejects blank id", () => {
    expect(v.safeParse(deleteSeasonDocumentInputSchema, {
      id: "   ",
      seasonYear: "2026",
    }).success).toBe(false);
  });
});

describe("createSeasonAnnouncementInputSchema", () => {
  const validInput = {
    body: "Registration opens this week.",
    publishedAt: "2026-10-01T10:00:00.000Z",
    seasonYear: "2026",
    title: "Registration Open",
  };

  it("accepts valid input", () => {
    expect(v.safeParse(createSeasonAnnouncementInputSchema, validInput).success).toBe(true);
  });

  it("defaults isPinned to false", () => {
    const result = v.parse(createSeasonAnnouncementInputSchema, validInput);
    expect(result.isPinned).toBe(false);
  });

  it("defaults sortOrder to 0", () => {
    const result = v.parse(createSeasonAnnouncementInputSchema, validInput);
    expect(result.sortOrder).toBe(0);
  });

  it("rejects invalid publishedAt", () => {
    expect(v.safeParse(createSeasonAnnouncementInputSchema, {
      ...validInput,
      publishedAt: "tomorrow",
    }).success).toBe(false);
  });

  it("rejects blank body", () => {
    expect(v.safeParse(createSeasonAnnouncementInputSchema, {
      ...validInput,
      body: "   ",
    }).success).toBe(false);
  });

  it("rejects body exceeding 10000 chars", () => {
    expect(v.safeParse(createSeasonAnnouncementInputSchema, {
      ...validInput,
      body: "A".repeat(10_001),
    }).success).toBe(false);
  });
});

describe("updateSeasonAnnouncementInputSchema", () => {
  const validInput = {
    body: "Updated body.",
    id: "announcement-1",
    isPinned: true,
    publishedAt: "2026-10-01T10:00:00.000Z",
    seasonYear: "2026",
    sortOrder: 0,
    title: "Updated Title",
  };

  it("accepts valid input", () => {
    expect(v.safeParse(updateSeasonAnnouncementInputSchema, validInput).success).toBe(true);
  });

  it("rejects blank id", () => {
    expect(v.safeParse(updateSeasonAnnouncementInputSchema, {
      ...validInput,
      id: "   ",
    }).success).toBe(false);
  });
});

describe("deleteSeasonAnnouncementInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(deleteSeasonAnnouncementInputSchema, {
      id: "announcement-1",
      seasonYear: "2026",
    }).success).toBe(true);
  });

  it("rejects blank id", () => {
    expect(v.safeParse(deleteSeasonAnnouncementInputSchema, {
      id: "   ",
      seasonYear: "2026",
    }).success).toBe(false);
  });
});
