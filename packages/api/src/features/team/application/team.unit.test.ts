import { describe, expect, it } from "vitest";

const TEST_ENV_DEFAULTS = {
  BETTER_AUTH_SECRET: "test",
  BETTER_AUTH_URL: "http://localhost",
  CORS_ORIGIN: "http://localhost",
  DATABASE_URL: "postgresql://localhost/test",
  GOOGLE_CLIENT_ID: "test",
  GOOGLE_CLIENT_SECRET: "test",
} as const;

for (const [key, value] of Object.entries(TEST_ENV_DEFAULTS)) {
  process.env[key] ??= value;
}

const { resolveNextTeamNumber } = await import("./team.js");

describe("resolveNextTeamNumber", () => {
  it("starts the sequence at 00001", () => {
    expect(resolveNextTeamNumber(null)).toBe("00001");
    expect(resolveNextTeamNumber(0)).toBe("00001");
  });

  it("increments existing five-digit team numbers", () => {
    expect(resolveNextTeamNumber("00001")).toBe("00002");
  });

  it("continues from the highest existing numeric team number", () => {
    expect(resolveNextTeamNumber("02323")).toBe("02324");
  });

  it("rejects allocation after 99999", () => {
    expect(() => resolveNextTeamNumber(99_999)).toThrow(
      "Unable to allocate a unique team number and slug.",
    );
  });
});
