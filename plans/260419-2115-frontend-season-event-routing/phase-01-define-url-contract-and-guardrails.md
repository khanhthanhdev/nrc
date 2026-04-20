# Phase 01: Define route zones and guardrails

## Context Links

- `docs/nrc_web_overview.md`
- `plans/reports/260419-2059-ftc-events-route-research.md`
- `apps/web/src/routeTree.gen.ts`

## Overview

- Priority: P1
- Status: pending
- Objective: lock route-zone contract and strict guard/param rules before wider UI and data work.

## Key Insights

- Stable public URL contract prevents rework each season.
- Guardrails (regex + canonical redirects) avoid duplicated paths and broken indexing.
- Zone separation reduces auth bugs and route collisions.

## Requirements

### Functional

1. Define canonical public event URLs under `/:season/:eventId/...`.
2. Define static namespaces and access policy: `/teams`, `/register`, `/staff`.
3. Define validation rules for `season`, `eventId`, `matchNumber`, `registrationId`.
4. Define error handling behavior for invalid params and unauthorized access.

### Non-functional

1. Keep definitions concise and developer-facing.
2. Keep route slugs stable for analytics continuity.

## Architecture

```text
Input URL -> Route param parse -> Validation -> Canonicalize -> Continue/Reject
```

Guardrails:

- `season`: 4-digit year (`^\d{4}$`)
- `eventId`: uppercase + underscore/hyphen (`^[A-Z0-9_-]{3,20}$`)
- `matchNumber`: positive integer
- `registrationId`: validated id format (UUID/cuid based on backend contract)
- Static route zones (never captured by dynamic public route):
  - `/auth/*`
  - `/teams/*`
  - `/register/*`
  - `/staff/*`
  - `/account`
  - `/onboarding`

## Related Code Files

- Modify: `apps/web/src/routes/*` (existing dynamic route files where needed)
- Modify: `apps/web/src/lib/route-policy.ts`
- Modify: `apps/web/src/lib/route-guards.ts`

## Implementation Steps

1. Confirm `route-policy.ts` already defines the shared param validators and registration access helpers.
2. Extend `route-policy.ts` only if a missing validator or canonicalization helper is still needed.
3. Keep `route-guards.ts` focused on auth/staff navigation guards; do not duplicate ownership logic already in `route-policy.ts`.
4. Define error strategy (404 vs redirect vs forbidden) per invalid case.
5. Document final contract in phase file and route policy docs.
6. Lock slug policy to FTC names exactly: `rankings`, `qualifications`, `playoffs`, `awards`.

## Todo List

- [ ] Route-zone contract documented and approved
- [ ] Regex and canonical rules confirmed in shared helpers
- [ ] Guard policy documented (auth/staff/ownership)
- [ ] Invalid-param and unauthorized strategy documented
- [ ] Slug policy locked to FTC names

## Success Criteria

- All route params validated consistently from shared helpers.
- Route-zone guard policy centralized and reusable.
- Canonical URLs deterministic.

## Risk Assessment

- Risk: over-strict event id rule rejects valid legacy ids.
- Mitigation: keep allowlist extensible via shared constant.

## Security Considerations

- Validate params before using in API query keys.
- No raw params in direct interpolation without normalization.
- Route guards are UX only; mirror permission checks in oRPC handlers.

## Next Steps

- Move on to the flat-route verification and any missing leaf page content.
