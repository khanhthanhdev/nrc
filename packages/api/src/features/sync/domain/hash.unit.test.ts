import { describe, expect, it } from "vitest";

import { canonicalJson, sha256Hex, hashCanonicalPayload } from "./hash.js";

describe("canonicalJson", () => {
  it("sorts object keys alphabetically", () => {
    expect(canonicalJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
  });

  it("preserves array order", () => {
    expect(canonicalJson({ values: [3, 1, 2] })).toBe('{"values":[3,1,2]}');
  });

  it("handles nested objects", () => {
    expect(canonicalJson({ z: { b: 2, a: 1 }, a: 0 })).toBe('{"a":0,"z":{"a":1,"b":2}}');
  });

  it("handles null", () => {
    expect(canonicalJson(null)).toBe("null");
  });

  it("handles primitives", () => {
    expect(canonicalJson(42)).toBe("42");
    expect(canonicalJson("hello")).toBe('"hello"');
    expect(canonicalJson(true)).toBe("true");
  });

  it("handles empty objects", () => {
    expect(canonicalJson({})).toBe("{}");
  });

  it("handles empty arrays", () => {
    expect(canonicalJson([])).toBe("[]");
  });

  it("handles deeply nested structures", () => {
    const input = { a: { b: { c: { d: 1 } } } };
    expect(canonicalJson(input)).toBe('{"a":{"b":{"c":{"d":1}}}}');
  });
});

describe("sha256Hex", () => {
  it("returns a 64-character hex string", async () => {
    const hash = await sha256Hex("hello");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns the same hash for the same input", async () => {
    const hash1 = await sha256Hex("test");
    const hash2 = await sha256Hex("test");
    expect(hash1).toBe(hash2);
  });

  it("returns different hashes for different inputs", async () => {
    const hash1 = await sha256Hex("hello");
    const hash2 = await sha256Hex("world");
    expect(hash1).not.toBe(hash2);
  });

  it("handles empty string", async () => {
    const hash = await sha256Hex("");
    expect(hash).toHaveLength(64);
  });

  it("produces known SHA-256 for 'hello'", async () => {
    // SHA-256 of "hello" is well-known
    const hash = await sha256Hex("hello");
    expect(hash).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });
});

describe("hashCanonicalPayload", () => {
  it("returns same hash for objects with different key order", async () => {
    const hash1 = await hashCanonicalPayload({ a: 1, b: 2 });
    const hash2 = await hashCanonicalPayload({ b: 2, a: 1 });
    expect(hash1).toBe(hash2);
  });

  it("returns different hash for objects with different values", async () => {
    const hash1 = await hashCanonicalPayload({ a: 1 });
    const hash2 = await hashCanonicalPayload({ a: 2 });
    expect(hash1).not.toBe(hash2);
  });

  it("returns different hash for different array order", async () => {
    const hash1 = await hashCanonicalPayload({ values: [1, 2] });
    const hash2 = await hashCanonicalPayload({ values: [2, 1] });
    expect(hash1).not.toBe(hash2);
  });

  it("returns a 64-character hex string", async () => {
    const hash = await hashCanonicalPayload({ test: true });
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("handles complex nested payloads", async () => {
    const hash = await hashCanonicalPayload({
      batchId: "batch-1",
      resources: [
        { records: [{ key: "value" }], type: "match_results" },
      ],
      version: "2026.1",
    });
    expect(hash).toHaveLength(64);
  });
});
