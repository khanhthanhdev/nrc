import { describe, expect, it } from "vitest";

import { getPublicCacheControl, PUBLIC_ROUTE_CACHE } from "./cache-config";

describe("getPublicCacheControl", () => {
  describe("homepage", () => {
    it("returns homepage cache for root path", () => {
      expect(getPublicCacheControl("/")).toBe(PUBLIC_ROUTE_CACHE.homepage.cacheControl);
    });

    it("returns homepage cache for locale root", () => {
      // Pattern requires trailing slash for locale: /en/ matches, /en does not
      expect(getPublicCacheControl("/en/")).toBe(PUBLIC_ROUTE_CACHE.homepage.cacheControl);
      expect(getPublicCacheControl("/vi/")).toBe(PUBLIC_ROUTE_CACHE.homepage.cacheControl);
    });
  });

  describe("events listing", () => {
    it("returns eventsListing cache for /events", () => {
      expect(getPublicCacheControl("/events")).toBe(PUBLIC_ROUTE_CACHE.eventsListing.cacheControl);
    });

    it("returns eventsListing cache for localized /events", () => {
      expect(getPublicCacheControl("/vi/events")).toBe(
        PUBLIC_ROUTE_CACHE.eventsListing.cacheControl,
      );
    });

    it("returns eventsListing cache for season pages", () => {
      expect(getPublicCacheControl("/2026")).toBe(
        PUBLIC_ROUTE_CACHE.eventsListing.cacheControl,
      );
    });

    it("returns eventsListing cache for localized season pages", () => {
      expect(getPublicCacheControl("/en/2025")).toBe(
        PUBLIC_ROUTE_CACHE.eventsListing.cacheControl,
      );
    });
  });

  describe("event details", () => {
    it("returns eventDetails cache for event page", () => {
      expect(getPublicCacheControl("/2026/HANOI")).toBe(
        PUBLIC_ROUTE_CACHE.eventDetails.cacheControl,
      );
    });

    it("returns eventDetails cache for localized event page", () => {
      expect(getPublicCacheControl("/vi/2026/HANOI")).toBe(
        PUBLIC_ROUTE_CACHE.eventDetails.cacheControl,
      );
    });

    it("returns eventDetails cache for event child pages", () => {
      expect(getPublicCacheControl("/2026/HANOI/awards")).toBe(
        PUBLIC_ROUTE_CACHE.eventDetails.cacheControl,
      );
      expect(getPublicCacheControl("/2026/HANOI/rankings")).toBe(
        PUBLIC_ROUTE_CACHE.eventDetails.cacheControl,
      );
      expect(getPublicCacheControl("/2026/HANOI/qualifications")).toBe(
        PUBLIC_ROUTE_CACHE.eventDetails.cacheControl,
      );
      expect(getPublicCacheControl("/2026/HANOI/playoffs")).toBe(
        PUBLIC_ROUTE_CACHE.eventDetails.cacheControl,
      );
    });

    it("returns eventDetails cache for event child pages with sub-paths", () => {
      expect(getPublicCacheControl("/2026/HANOI/qualifications/Q-001")).toBe(
        PUBLIC_ROUTE_CACHE.eventDetails.cacheControl,
      );
    });
  });

  describe("unmatched routes", () => {
    it("returns no-store for unknown paths", () => {
      expect(getPublicCacheControl("/teams")).toBe("no-store");
      expect(getPublicCacheControl("/auth")).toBe("no-store");
      expect(getPublicCacheControl("/staff/seasons")).toBe("no-store");
      expect(getPublicCacheControl("/onboarding")).toBe("no-store");
    });
  });
});

describe("PUBLIC_ROUTE_CACHE", () => {
  it("has sensible staleTime <= gcTime for all entries", () => {
    for (const [key, config] of Object.entries(PUBLIC_ROUTE_CACHE)) {
      expect(config.staleTime).toBeLessThanOrEqual(config.gcTime);
    }
  });

  it("has cacheControl strings that include max-age", () => {
    for (const [key, config] of Object.entries(PUBLIC_ROUTE_CACHE)) {
      expect(config.cacheControl).toContain("s-maxage=");
    }
  });
});
