import { describe, expect, it } from "vitest";

import { hashCanonicalPayload } from "./hash.js";

describe("sync payload hashing", () => {
  it("canonicalizes object keys while preserving array order", async () => {
    await expect(hashCanonicalPayload({ a: 1, b: { c: 2 } })).resolves.toBe(
      await hashCanonicalPayload({ b: { c: 2 }, a: 1 }),
    );

    await expect(hashCanonicalPayload({ values: [1, 2] })).resolves.not.toBe(
      await hashCanonicalPayload({ values: [2, 1] }),
    );
  });
});
