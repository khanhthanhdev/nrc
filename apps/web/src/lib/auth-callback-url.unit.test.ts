import { describe, expect, it } from "vitest";

import { toBrowserCallbackURL } from "./auth-callback-url";

describe("toBrowserCallbackURL", () => {
  it("returns path as-is when window is undefined (server-side)", () => {
    // In test environment, window is typically undefined
    const result = toBrowserCallbackURL("/auth/callback");
    expect(result).toBe("/auth/callback");
  });

  it("handles root path", () => {
    const result = toBrowserCallbackURL("/");
    expect(result).toBe("/");
  });

  it("handles nested paths", () => {
    const result = toBrowserCallbackURL("/auth/callback/google");
    expect(result).toBe("/auth/callback/google");
  });

  it("handles path with query parameters", () => {
    const result = toBrowserCallbackURL("/auth/callback?code=123&state=abc");
    expect(result).toBe("/auth/callback?code=123&state=abc");
  });
});
