import { describe, expect, it } from "vitest";

import { publicPageMeta, eventPageMeta } from "./og-tags";

describe("publicPageMeta", () => {
  it("returns standard meta tags for a page", () => {
    const meta = publicPageMeta("Test Page");

    expect(meta).toContainEqual({ title: "Test Page" });
    expect(meta).toContainEqual({
      content: "National Robotics Competition event schedules, rankings, match results, and awards.",
      name: "description",
    });
    expect(meta).toContainEqual({ content: "Test Page", property: "og:title" });
    expect(meta).toContainEqual({ content: "website", property: "og:type" });
    expect(meta).toContainEqual({ content: "NRC Competition Hub", property: "og:site_name" });
    expect(meta).toContainEqual({ content: "/og-default.png", property: "og:image" });
    expect(meta).toContainEqual({ content: "summary_large_image", name: "twitter:card" });
    expect(meta).toContainEqual({ content: "Test Page", name: "twitter:title" });
  });

  it("uses default description when not provided", () => {
    const meta = publicPageMeta("Test Page");
    const descriptionMeta = meta.find((m) => "name" in m && m.name === "description");

    expect(descriptionMeta?.content).toContain("National Robotics Competition");
  });

  it("uses custom description when provided", () => {
    const meta = publicPageMeta("Test Page", "Custom description");
    const descriptionMeta = meta.find((m) => "name" in m && m.name === "description");

    expect(descriptionMeta?.content).toBe("Custom description");
  });

  it("sets og:description to match description", () => {
    const meta = publicPageMeta("Test Page", "Custom description");
    const ogDesc = meta.find((m) => "property" in m && m.property === "og:description");

    expect(ogDesc?.content).toBe("Custom description");
  });

  it("sets twitter:description to match description", () => {
    const meta = publicPageMeta("Test Page", "Custom description");
    const twitterDesc = meta.find((m) => "name" in m && m.name === "twitter:description");

    expect(twitterDesc?.content).toBe("Custom description");
  });
});

describe("eventPageMeta", () => {
  it("returns event-specific meta when event is provided", () => {
    const meta = eventPageMeta({
      event: {
        description: "A robotics competition",
        name: "Hanoi Regional",
        summary: null,
      },
    } as any);

    const titleMeta = meta.find((m) => "title" in m);
    expect(titleMeta?.title).toBe("Hanoi Regional | NRC");
  });

  it("appends suffix to title when provided", () => {
    const meta = eventPageMeta(
      {
        event: {
          description: "A robotics competition",
          name: "Hanoi Regional",
          summary: null,
        },
      } as any,
      "Rankings",
    );

    const titleMeta = meta.find((m) => "title" in m);
    expect(titleMeta?.title).toBe("Hanoi Regional Rankings | NRC");
  });

  it("falls back to 'Event' when event is undefined", () => {
    const meta = eventPageMeta(undefined);

    const titleMeta = meta.find((m) => "title" in m);
    expect(titleMeta?.title).toBe("Event | NRC");
  });

  it("uses event description when available", () => {
    const meta = eventPageMeta({
      event: {
        description: "Regional qualifier",
        name: "Hanoi",
        summary: "Short summary",
      },
    } as any);

    const descMeta = meta.find((m) => "name" in m && m.name === "description");
    expect(descMeta?.content).toBe("Regional qualifier");
  });

  it("falls back to summary when description is null", () => {
    const meta = eventPageMeta({
      event: {
        description: null,
        name: "Hanoi",
        summary: "Short summary",
      },
    } as any);

    const descMeta = meta.find((m) => "name" in m && m.name === "description");
    expect(descMeta?.content).toBe("Short summary");
  });

  it("falls back to default description when both are null", () => {
    const meta = eventPageMeta({
      event: {
        description: null,
        name: "Hanoi",
        summary: null,
      },
    } as any);

    const descMeta = meta.find((m) => "name" in m && m.name === "description");
    expect(descMeta?.content).toContain("National Robotics Competition");
  });
});
