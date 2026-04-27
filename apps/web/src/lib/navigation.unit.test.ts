import { describe, expect, it } from "vitest";

import { getStaffNavigation, isStaffPath, publicNavigation } from "./navigation";

describe("navigation", () => {
  it("keeps the public header limited to home, events, teams, and register", () => {
    expect(publicNavigation.map((item) => item.to)).toEqual([
      "/",
      "/events",
      "/teams",
      "/register",
    ]);
  });

  it("marks only /staff routes as staff shell paths", () => {
    expect(isStaffPath("/staff")).toBe(true);
    expect(isStaffPath("/staff/events")).toBe(true);
    expect(isStaffPath("/users")).toBe(false);
    expect(isStaffPath("/teams")).toBe(false);
  });

  it("shows admin-only links only for admins", () => {
    const managerSections = getStaffNavigation("MANAGER").sections.flatMap((section) =>
      section.items.map((item) => item.to),
    );
    const adminSections = getStaffNavigation("ADMIN").sections.flatMap((section) =>
      section.items.map((item) => item.to),
    );

    expect(managerSections).toContain("/staff/sync");
    expect(managerSections).not.toContain("/staff/seasons");
    expect(managerSections).not.toContain("/staff/users");
    expect(managerSections).not.toContain("/staff/settings");

    expect(adminSections).toContain("/staff/seasons");
    expect(adminSections).toContain("/staff/users");
    expect(adminSections).toContain("/staff/settings");
  });
});
