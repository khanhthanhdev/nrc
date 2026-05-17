import { describe, expect, it } from "vitest";

import {
  DEFAULT_ALLOWED_PUSH_RESOURCES,
  MACHINE_PULL_RESOURCE_TYPES,
  MACHINE_PUSH_RESOURCE_TYPES,
  SUPPORTED_SYNC_SEASON,
  SYNC_DEFINITION_VERSION,
  SYNC_SCHEMA_VERSION,
} from "./constants.js";

describe("SYNC_SCHEMA_VERSION", () => {
  it("is a valid ISO date format", () => {
    expect(SYNC_SCHEMA_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("is a parseable date", () => {
    const date = new Date(SYNC_SCHEMA_VERSION);
    expect(date.getTime()).not.toBeNaN();
  });
});

describe("SYNC_DEFINITION_VERSION", () => {
  it("follows YYYY.N format", () => {
    expect(SYNC_DEFINITION_VERSION).toMatch(/^\d{4}\.\d+$/);
  });
});

describe("SUPPORTED_SYNC_SEASON", () => {
  it("is a 4-digit year", () => {
    expect(SUPPORTED_SYNC_SEASON).toMatch(/^\d{4}$/);
  });
});

describe("MACHINE_PUSH_RESOURCE_TYPES", () => {
  it("contains expected resource types", () => {
    expect(MACHINE_PUSH_RESOURCE_TYPES).toContain("inspection_schedule");
    expect(MACHINE_PUSH_RESOURCE_TYPES).toContain("inspection_results");
    expect(MACHINE_PUSH_RESOURCE_TYPES).toContain("match_schedule");
    expect(MACHINE_PUSH_RESOURCE_TYPES).toContain("match_results");
    expect(MACHINE_PUSH_RESOURCE_TYPES).toContain("team_rankings");
    expect(MACHINE_PUSH_RESOURCE_TYPES).toContain("team_awards");
  });

  it("has 6 resource types", () => {
    expect(MACHINE_PUSH_RESOURCE_TYPES).toHaveLength(6);
  });

  it("contains only unique values", () => {
    const unique = new Set(MACHINE_PUSH_RESOURCE_TYPES);
    expect(unique.size).toBe(MACHINE_PUSH_RESOURCE_TYPES.length);
  });
});

describe("MACHINE_PULL_RESOURCE_TYPES", () => {
  it("contains expected resource types", () => {
    expect(MACHINE_PULL_RESOURCE_TYPES).toContain("season_definition");
    expect(MACHINE_PULL_RESOURCE_TYPES).toContain("event_manifest");
    expect(MACHINE_PULL_RESOURCE_TYPES).toContain("approved_registrations");
    expect(MACHINE_PULL_RESOURCE_TYPES).toContain("team_operational_profiles");
    expect(MACHINE_PULL_RESOURCE_TYPES).toContain("sync_policy");
  });

  it("has 5 resource types", () => {
    expect(MACHINE_PULL_RESOURCE_TYPES).toHaveLength(5);
  });

  it("contains only unique values", () => {
    const unique = new Set(MACHINE_PULL_RESOURCE_TYPES);
    expect(unique.size).toBe(MACHINE_PULL_RESOURCE_TYPES.length);
  });
});

describe("DEFAULT_ALLOWED_PUSH_RESOURCES", () => {
  it("matches MACHINE_PUSH_RESOURCE_TYPES exactly", () => {
    expect(DEFAULT_ALLOWED_PUSH_RESOURCES).toEqual([...MACHINE_PUSH_RESOURCE_TYPES]);
  });

  it("is a new array (not the same reference)", () => {
    expect(DEFAULT_ALLOWED_PUSH_RESOURCES).not.toBe(MACHINE_PUSH_RESOURCE_TYPES);
  });
});

describe("resource type arrays", () => {
   it("have no overlap between push and pull types", () => {
     const pushSet = new Set(MACHINE_PUSH_RESOURCE_TYPES);
     const pullSet = new Set(MACHINE_PULL_RESOURCE_TYPES);
 
     for (const type of pushSet) {
       expect(pullSet.has(type as any)).toBe(false);
     }
   });
 });
