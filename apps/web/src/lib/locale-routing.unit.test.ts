import { describe, expect, it } from "vitest";

import { getLocaleFromPathname, localizePathname, stripLocaleFromPathname } from "./locale-routing";

describe("locale routing", () => {
  it("strips locale prefixes from pathnames", () => {
    expect(stripLocaleFromPathname("/vi/teams")).toBe("/teams");
    expect(stripLocaleFromPathname("/en/staff/events")).toBe("/staff/events");
    expect(stripLocaleFromPathname("/vi")).toBe("/");
  });

  it("detects locale prefixes", () => {
    expect(getLocaleFromPathname("/vi/teams")).toBe("vi");
    expect(getLocaleFromPathname("/en")).toBe("en");
    expect(getLocaleFromPathname("/teams")).toBeNull();
  });

  it("builds localized pathnames", () => {
    expect(localizePathname("/teams", "vi")).toBe("/vi/teams");
    expect(localizePathname("/", "en")).toBe("/en");
    expect(localizePathname("/vi/staff", "en")).toBe("/en/staff");
  });
});
