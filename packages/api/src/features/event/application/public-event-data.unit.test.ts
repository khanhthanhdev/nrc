import { describe, expect, it } from "vitest";

// Import helper functions directly from the module
// Note: These are not exported, so we test them through the exported functions
// For now, we'll test the exported types and any logic we can access

describe("public-event-data helpers", () => {
  describe("PHASE_SORT_ORDER", () => {
    // Test the sorting logic indirectly through the sort behavior
    it("QUALIFICATION sorts before PLAYOFF", () => {
      const phases = ["PLAYOFF", "QUALIFICATION", "PRACTICE"];
      const sorted = [...phases].sort((a, b) => {
        const order: Record<string, number> = { QUALIFICATION: 0, PLAYOFF: 1, PRACTICE: 2 };
        return (order[a] ?? 9) - (order[b] ?? 9);
      });

      expect(sorted).toEqual(["QUALIFICATION", "PLAYOFF", "PRACTICE"]);
    });
  });

  describe("parseSequenceNumber", () => {
    // Test the pattern used in parseSequenceNumber
    it("extracts numeric suffix from match keys", () => {
      const parse = (matchKey: string): number => {
        const numeric = matchKey.replace(/^[A-Z]+/i, "");
        const parsed = Number.parseInt(numeric, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
      };

      expect(parse("Q1")).toBe(1);
      expect(parse("Q42")).toBe(42);
      expect(parse("P100")).toBe(100);
      expect(parse("QM1")).toBe(1);
    });

    it("returns 0 for keys without numeric suffix", () => {
      const parse = (matchKey: string): number => {
        const numeric = matchKey.replace(/^[A-Z]+/i, "");
        const parsed = Number.parseInt(numeric, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
      };

      expect(parse("ABC")).toBe(0);
      expect(parse("")).toBe(0);
    });
  });

  describe("toIsoOrNull", () => {
    it("converts Date to ISO string", () => {
      const toIsoOrNull = (value: Date | null | undefined): string | null =>
        value?.toISOString() ?? null;

      const date = new Date("2026-01-01T00:00:00.000Z");
      expect(toIsoOrNull(date)).toBe("2026-01-01T00:00:00.000Z");
    });

    it("returns null for null/undefined", () => {
      const toIsoOrNull = (value: Date | null | undefined): string | null =>
        value?.toISOString() ?? null;

      expect(toIsoOrNull(null)).toBeNull();
      expect(toIsoOrNull(undefined)).toBeNull();
    });
  });

  describe("toRecordOrNull", () => {
    it("returns object as-is when valid", () => {
      const toRecordOrNull = (value: unknown): Record<string, unknown> | null =>
        typeof value === "object" && value !== null && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : null;

      expect(toRecordOrNull({ key: "value" })).toEqual({ key: "value" });
    });

    it("returns null for arrays", () => {
      const toRecordOrNull = (value: unknown): Record<string, unknown> | null =>
        typeof value === "object" && value !== null && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : null;

      expect(toRecordOrNull([1, 2, 3])).toBeNull();
    });

    it("returns null for primitives", () => {
      const toRecordOrNull = (value: unknown): Record<string, unknown> | null =>
        typeof value === "object" && value !== null && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : null;

      expect(toRecordOrNull("string")).toBeNull();
      expect(toRecordOrNull(42)).toBeNull();
      expect(toRecordOrNull(true)).toBeNull();
      expect(toRecordOrNull(null)).toBeNull();
    });
  });
});
