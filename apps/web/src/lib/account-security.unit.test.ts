import { describe, expect, it } from "vitest";

import { hasCredentialProvider } from "./account-security";

describe("hasCredentialProvider", () => {
  it("returns true when credential provider exists", () => {
    expect(hasCredentialProvider([{ providerId: "google" }, { providerId: "credential" }])).toBe(
      true,
    );
  });

  it("returns false when credential provider is absent", () => {
    expect(hasCredentialProvider([{ providerId: "google" }, { providerId: "github" }])).toBe(false);
  });

  it("returns false for empty or missing account lists", () => {
    expect(hasCredentialProvider([])).toBe(false);
    expect(hasCredentialProvider(null)).toBe(false);
    expect(hasCredentialProvider(undefined)).toBe(false);
  });
});
