const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export const PUBLIC_ROUTE_CACHE = {
  awards: {
    cacheControl: "public, s-maxage=3600, stale-while-revalidate=86400",
    gcTime: 24 * HOUR,
    staleTime: HOUR,
  },
  eventDetails: {
    cacheControl: "public, s-maxage=30, stale-while-revalidate=60",
    gcTime: 5 * MINUTE,
    staleTime: 30 * SECOND,
  },
  eventsListing: {
    cacheControl: "public, s-maxage=300, stale-while-revalidate=600",
    gcTime: 30 * MINUTE,
    staleTime: 5 * MINUTE,
  },
  homepage: {
    cacheControl: "public, s-maxage=3600, stale-while-revalidate=86400",
    gcTime: 24 * HOUR,
    staleTime: HOUR,
  },
} as const;

const publicEventChildPattern =
  /^\/(?:[a-z]{2}\/)?\d{4}\/[A-Za-z0-9-]+\/(?:awards|playoffs|qualifications|rankings)(?:\/[^/]+)?$/;
const publicEventPattern = /^\/(?:[a-z]{2}\/)?\d{4}\/[A-Za-z0-9-]+(?:\/)?$/;
const publicSeasonPattern = /^\/(?:[a-z]{2}\/)?\d{4}(?:\/)?$/;

export function getPublicCacheControl(pathname: string): string {
  if (/^\/(?:[a-z]{2}\/)?$/.test(pathname)) {
    return PUBLIC_ROUTE_CACHE.homepage.cacheControl;
  }

  if (/^\/(?:[a-z]{2}\/)?events(?:\/)?$/.test(pathname) || publicSeasonPattern.test(pathname)) {
    return PUBLIC_ROUTE_CACHE.eventsListing.cacheControl;
  }

  if (publicEventChildPattern.test(pathname) || publicEventPattern.test(pathname)) {
    return PUBLIC_ROUTE_CACHE.eventDetails.cacheControl;
  }

  return "no-store";
}
