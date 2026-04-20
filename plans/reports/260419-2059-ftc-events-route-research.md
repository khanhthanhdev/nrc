# Research Report: FTC Events Route Structure (Season + Event)

**Conducted at:** 2026-04-19 20:59 (local)

## Table of Contents
- [Executive Summary](#executive-summary)
- [Research Methodology](#research-methodology)
- [Key Findings](#key-findings)
  - [1. Technology Overview](#1-technology-overview)
  - [2. Current State and Trends](#2-current-state-and-trends)
  - [3. Best Practices](#3-best-practices)
  - [4. Security Considerations](#4-security-considerations)
  - [5. Performance Insights](#5-performance-insights)
- [Comparative Analysis](#comparative-analysis)
- [Implementation Recommendations](#implementation-recommendations)
  - [Quick Start Guide](#quick-start-guide)
  - [Code Examples](#code-examples)
  - [Common Pitfalls](#common-pitfalls)
- [Resources and References](#resources-and-references)
- [Appendices](#appendices)
- [Next Steps](#next-steps)
- [Unresolved Questions](#unresolved-questions)

## Executive Summary

FTC Events uses a clean, stable URL contract centered on `/{season}/{eventCode}` with sub-pages under that event node (rankings, qualifications, playoffs, etc.). This is exactly the right shape for your NRC requirement where each season has partly shared pages and partly season-specific behavior.

The practical takeaway: treat `season` as first-class route context, `eventCode` as second-level identity, and put event tabs as nested leaf routes. Keep the URL stable across seasons, and switch rendering/data adapters per season behind a resolver layer. That gives long-term compatibility and avoids route churn.

Brutal truth: do not copy FTC page-by-page blindly. Copy URL semantics and navigation model, then keep your own domain naming and data contracts. Route compatibility matters more than visual parity.

## Research Methodology

- Sources consulted: 5 primary pages (official FTC Events site)
- Date range of materials: current live pages (footer shows platform version `v5.7.11`, copyright `2026`)
- Key search terms used: direct target URL analysis (`season`, `event code`, `rankings`, `qualifications`, `match detail`)
- Boundaries: route architecture + information architecture only; no reverse engineering hidden APIs
- Evaluation criteria: URL consistency, nav consistency, season/event hierarchy, list/detail drilldown pattern

## Key Findings

### 1. Technology Overview

Observed canonical route patterns on FTC Events:

- Season home: `/{season}` (example: `/2025`)
- Event root: `/{season}/{eventCode}` (example: `/2025/VNCMP`)
- Event tab pages:
  - `/{season}/{eventCode}/rankings`
  - `/{season}/{eventCode}/qualifications`
  - `/{season}/{eventCode}/playoffs`
  - plus event-specific pages like `pitMap`, `practice`, `awards`
- Match detail drilldown:
  - `/{season}/{eventCode}/qualifications/{matchNumber}`

This is a strict hierarchy:

```text
season -> event -> phase/list -> item detail
```

### 2. Current State and Trends

Patterns visible in the current FTC deployment:

- Multi-season switcher from home (`/`, `/2025`, `/2024`, ...)
- Consistent event-level top navigation tabs for each event
- Repeated data views (table-heavy pages) across tabs
- List/detail navigation for matches (qualifications list -> single match)
- Footer indicates current deployed app version (`FTC Events - v5.7.11`)

Trend signal: they optimize for durable URLs and predictable navigation, not flashy route innovation.

### 3. Best Practices

For NRC to follow FTC route-dir style with TanStack Start:

1. Use season and event as required dynamic route params.
2. Keep nested route tree matching URL tree (do not flatten).
3. Put event shared shell (tabs, event metadata, breadcrumbs) at `/{season}/{eventCode}` layout boundary.
4. Implement list/detail routes explicitly, not query-string pseudo-routes.
5. Keep page slugs stable across seasons (`rankings`, `qualifications`, `playoffs`) even if internals change.
6. Resolve season-specific behavior through feature adapters, not URL forks.

Recommended route contract for NRC:

```text
/:season
/:season/:eventCode
/:season/:eventCode/rankings
/:season/:eventCode/qualifications
/:season/:eventCode/qualifications/:matchNumber
/:season/:eventCode/playoffs
/:season/:eventCode/awards
```

### 4. Security Considerations

For this routing model:

- Validate `season` and `eventCode` in route loaders before data fetch.
- Enforce allowlist format for event code (e.g., uppercase alnum + limited symbols).
- Normalize canonical URL casing (avoid duplicate content + auth bypass edge cases).
- Block over-fetch on list pages (pagination/windowing if needed).
- Keep staff/admin operations on separate protected namespace, never mixed into public event URLs.

### 5. Performance Insights

Route-level implications from FTC pattern:

- Table-heavy pages benefit from streaming/skeleton and cache per route key (`season,eventCode,page`).
- Match detail routes should fetch minimal payload for first paint; defer heavy breakdown panels.
- Shared layout caching at event boundary reduces repeated metadata fetch on tab switches.
- Preload adjacent likely routes (`rankings` <-> `qualifications`) from tab hover/viewport.

## Comparative Analysis

Two ways to implement season variance:

1. URL forking per season (bad default)
   - Pros: straightforward per-season custom pages
   - Cons: duplicated routes, SEO fragmentation, expensive maintenance

2. Stable URL + season adapter (recommended)
   - Pros: DRY routes, stable links, easy cross-season analytics, clear contracts
   - Cons: needs adapter abstraction discipline

Recommendation: choose option 2.

## Implementation Recommendations

### Quick Start Guide

1. Create route tree matching FTC semantics.
2. Add `season` validation boundary route.
3. Add `eventCode` boundary route with shared event layout/tabs.
4. Add leaf routes: `rankings`, `qualifications`, `qualifications/$matchNumber`, `playoffs`, `awards`.
5. Create season adapter resolver (`shared default + per-season override`).
6. Keep public routes separate from staff protected routes.

Suggested directory structure (TanStack Start style):

```text
apps/web/src/routes/
  $season/
    route.tsx
    index.tsx
    $eventCode/
      route.tsx
      index.tsx
      rankings.tsx
      qualifications/
        index.tsx
        $matchNumber.tsx
      playoffs.tsx
      awards.tsx

apps/web/src/features/events/
  shared/
    pages/
      rankings-page.tsx
      qualifications-page.tsx
      qualification-match-page.tsx
  seasons/
    2025/
      pages/
        qualifications-page.tsx
  resolver.ts
```

### Code Examples

```ts
// apps/web/src/features/events/resolver.ts
type Season = string

export function resolveQualificationsPage(season: Season) {
  switch (season) {
    case '2025':
      return import('./seasons/2025/pages/qualifications-page')
    default:
      return import('./shared/pages/qualifications-page')
  }
}
```

```ts
// route param guard concept
const seasonRegex = /^\d{4}$/
const eventCodeRegex = /^[A-Z0-9_-]{3,20}$/
```

### Common Pitfalls

- Mixing season logic into route files directly -> route bloat.
- Encoding page type via query params (`?tab=rankings`) instead of real nested routes.
- Allowing arbitrary event code formats -> broken links + security risk.
- Repeating event shell fetch in every tab route -> unnecessary latency.
- Creating separate `2025-routes`, `2026-routes` trees too early.

## Resources and References

### Official Documentation / Primary Source

- FTC Event home: https://ftc-events.firstinspires.org/#allevents
- FTC event info (season+event root): https://ftc-events.firstinspires.org/2025/VNCMP
- FTC rankings tab: https://ftc-events.firstinspires.org/2025/VNCMP/rankings
- FTC qualifications list: https://ftc-events.firstinspires.org/2025/VNCMP/qualifications
- FTC qualification match detail: https://ftc-events.firstinspires.org/2025/VNCMP/qualifications/2

### Notes

- Site footer indicates app version string: `FTC Events - v5.7.11`.
- Footer links mention `API / Services`, but API contract was not inspected in this pass.

## Appendices

### A. Glossary

- Season: competition cycle identifier (example `2025`)
- Event code: short unique event identifier inside a season (example `VNCMP`)
- Tab page: event sub-page category (`rankings`, `qualifications`, `playoffs`)
- Match detail: leaf page for one match (`/qualifications/{matchNumber}`)

### B. Version Compatibility Matrix

| Concern | Recommendation |
|---|---|
| Router style | TanStack Start file-based nested routes |
| URL contract | Stable `/:season/:eventCode/...` |
| Season customization | Adapter resolver layer |
| Shared UI | Event shell at event boundary route |

### C. Raw Research Notes

- All sampled FTC pages preserve same season/event prefix.
- Qualifications page links directly to individual match detail routes.
- Event root acts as navigation hub with clear tabs.
- Structure is predictable enough to mirror 1:1 in your route tree.

## Next Steps

1. Lock NRC public route contract to FTC-style hierarchy.
2. Implement the route skeleton only (no heavy UI) to validate navigation.
3. Build season adapter with shared defaults and one explicit 2025 override.
4. Add canonical redirects for bad casing and invalid event codes.
5. Add route-level tests for list/detail navigation and invalid params.

## Unresolved Questions

- Should NRC keep FTC slug names exactly (`qualifications`, `playoffs`) or use domain-local alternatives?
- Do you want team pages under same hierarchy now (`/:season/team/:teamNumber`) or later?
- Should old-season URLs be immutable snapshots (read-only) with version-pinned scoring rules?
