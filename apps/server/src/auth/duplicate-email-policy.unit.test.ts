import { describe, expect, it } from "vitest";

import { normalizeEmailForLookup } from "./duplicate-email-policy.js";

describe("normalizeEmailForLookup", () => {
  it("returns lowercase trimmed email", () => {
    expect(normalizeEmailForLookup("  USER@Example.COM  ")).toBe("user@example.com");
  });

  it("returns lowercase for all-uppercase email", () => {
    expect(normalizeEmailForLookup("ADMIN@EXAMPLE.COM")).toBe("admin@example.com");
  });

  it("preserves already-lowercase email", () => {
    expect(normalizeEmailForLookup("user@example.com")).toBe("user@example.com");
  });

  it("returns null for empty string", () => {
    expect(normalizeEmailForLookup("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(normalizeEmailForLookup("   ")).toBeNull();
  });

  it("returns null for null", () => {
    expect(normalizeEmailForLookup(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(normalizeEmailForLookup(undefined)).toBeNull();
  });

  it("returns null for number", () => {
    expect(normalizeEmailForLookup(123)).toBeNull();
  });

  it("returns null for object", () => {
    expect(normalizeEmailForLookup({})).toBeNull();
  });

  it("returns null for array", () => {
    expect(normalizeEmailForLookup([])).toBeNull();
  });

  it("returns null for boolean", () => {
    expect(normalizeEmailForLookup(true)).toBeNull();
  });

  it("handles email with leading/trailing tabs", () => {
    expect(normalizeEmailForLookup("\tuser@example.com\t")).toBe("user@example.com");
  });

  it("handles mixed whitespace", () => {
    expect(normalizeEmailForLookup(" \t user@example.com \t ")).toBe("user@example.com");
  });
});
