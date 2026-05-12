import { describe, expect, it } from "vitest";

import { VIETNAM_34_CITIES } from "./vietnam-cities.js";

describe("VIETNAM_34_CITIES", () => {
  it("contains exactly 34 cities", () => {
    expect(VIETNAM_34_CITIES).toHaveLength(34);
  });

  it("includes both major cities", () => {
    expect(VIETNAM_34_CITIES).toContain("Thành phố Hà Nội");
    expect(VIETNAM_34_CITIES).toContain("Thành phố Hồ Chí Minh");
  });

  it("includes Đà Nẵng", () => {
    expect(VIETNAM_34_CITIES).toContain("Thành phố Đà Nẵng");
  });

  it("includes Cần Thơ", () => {
    expect(VIETNAM_34_CITIES).toContain("Thành phố Cần Thơ");
  });

  it("includes Hải Phòng", () => {
    expect(VIETNAM_34_CITIES).toContain("Thành phố Hải Phòng");
  });

  it("starts with thành phố entries", () => {
    expect(VIETNAM_34_CITIES[0]).toBe("Thành phố Hà Nội");
    expect(VIETNAM_34_CITIES[1]).toBe("Thành phố Hồ Chí Minh");
  });

  it("all entries are strings", () => {
    for (const city of VIETNAM_34_CITIES) {
      expect(typeof city).toBe("string");
      expect(city.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate entries", () => {
    const uniqueCities = new Set(VIETNAM_34_CITIES);
    expect(uniqueCities.size).toBe(VIETNAM_34_CITIES.length);
  });

  it("includes Kon Tum as last province", () => {
    expect(VIETNAM_34_CITIES[33]).toBe("Tỉnh Kon Tum");
  });
});
