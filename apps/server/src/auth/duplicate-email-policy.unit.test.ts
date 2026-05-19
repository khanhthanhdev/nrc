import { describe, expect, it } from "vitest";

import {
  normalizeEmailForLookup,
  shouldBlockCredentialSignUpForGoogleOnlyAccount,
} from "./duplicate-email-policy.js";

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

describe("shouldBlockCredentialSignUpForGoogleOnlyAccount", () => {
  it("blocks when only google provider is linked", () => {
    expect(shouldBlockCredentialSignUpForGoogleOnlyAccount([{ providerId: "google" }])).toBe(true);
  });

  it("does not block when credential provider is already linked", () => {
    expect(
      shouldBlockCredentialSignUpForGoogleOnlyAccount([
        { providerId: "google" },
        { providerId: "credential" },
      ]),
    ).toBe(false);
  });

  it("does not block when only credential provider is linked", () => {
    expect(shouldBlockCredentialSignUpForGoogleOnlyAccount([{ providerId: "credential" }])).toBe(
      false,
    );
  });

  it("does not block when no providers are linked", () => {
    expect(shouldBlockCredentialSignUpForGoogleOnlyAccount([])).toBe(false);
  });

  it("ignores unrelated providers", () => {
    expect(shouldBlockCredentialSignUpForGoogleOnlyAccount([{ providerId: "github" }])).toBe(false);
  });
});
