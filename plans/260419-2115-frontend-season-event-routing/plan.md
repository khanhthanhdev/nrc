---
title: "Frontend route zones and auth guards"
description: "Implement public season-event routes plus team/register/staff namespaces with explicit auth and role guards."
status: pending
priority: P1
effort: 10h
issue:
branch: main
tags: [feature, frontend, routing, auth, tanstack]
blockedBy: []
blocks: []
created: 2026-04-19
---

# Frontend route zones and auth guards

## Overview

Plan to finalize route zones in NRC web app:

- public information at `/:season/:eventId/...`
- team self-service at `/teams/...`
- registration at `/register/:eventId` and `/register/:eventId/:registrationId`
- staff CRUD at `/staff/...` guarded by system role.

Goal: keep public FTC-like URLs, keep staff/user boundaries explicit, and enforce guard logic at both frontend route and backend API layers.

## Cross-Plan Dependencies

No unfinished related plans found in `plans/**/plan.md`.

## Context Links

- Research report: [FTC Events route research](../reports/260419-2059-ftc-events-route-research.md)
- Product doc: `docs/nrc_web_overview.md`
- Root layout: `apps/web/src/routes/__root.tsx`
- Current generated tree: `apps/web/src/routeTree.gen.ts`
- Current nav header: `apps/web/src/components/header.tsx`

## Scope

- In scope:
  - Keep the existing flat dot-notation route files for public season/event pages.
  - Fill in any missing leaf content for public event pages and verify generated route paths.
  - Maintain file-based route tree support for `/teams`, `/register`, `/staff` namespaces.
  - Route param validation + canonicalization rules.
  - Route guard strategy for auth + role + ownership.
  - Shared public event shell and header navigation entry points.
  - Basic tests for route navigation + invalid params.
- Out of scope:
  - Full event data rendering parity with FTC.
  - API schema redesign.
  - Full staff dashboard UI implementation.
  - Season adapter resolver or season-specific override layer until there is a concrete divergence to support.

## Architecture Decisions

- Use stable public URL contract at `/:season/:eventId/...`. No per-season route tree duplication.
- Keep route files thin; move shared UI into `features/events` and keep existing route-policy helpers as the canonical source for validation/authorization checks.
- Do not introduce a season adapter/resolver layer without a concrete, tested season-specific override.
- Keep staff routes under `/staff/...` only.
- Keep team and registration routes under static namespaces (`/teams`, `/register`).
- Enforce route-level guards as UX layer; enforce same permissions in oRPC handlers as security layer.

## Phases

| Phase | Name                                                                                                                | Status  |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ------- |
| 1     | [Define route zones and guardrails](./phase-01-define-url-contract-and-guardrails.md)                               | Pending |
| 2     | [Verify flat route skeleton and fill missing leaf pages](./phase-02-create-season-event-route-skeleton.md)          | Pending |
| 3     | [Consolidate guard logic into existing policy modules](./phase-03-implement-season-adapter-feature-layer.md)        | Pending |
| 4     | [Extend public event shell and navigation entry points](./phase-04-wire-event-shell-and-navigation-entry-points.md) | Pending |
| 5     | [Validate permissions, routes, and rollout checks](./phase-05-validate-with-tests-and-rollout-checks.md)            | Pending |

## Dependencies

- TanStack Router file-based routing conventions (already in project)
- Existing auth/session utilities (`authClient`, `resolvePostAuthRoute`)
- Existing API client (`apps/web/src/utils/orpc.ts`)
- Existing route policy and guard modules (`apps/web/src/lib/route-policy.ts`, `apps/web/src/lib/route-guards.ts`)
- Existing public shell component (`apps/web/src/features/events/public-event-shell.tsx`)

## Success Criteria

- Route tree supports:
  - `/:season/:eventId`
  - `/:season/:eventId/rankings`
  - `/:season/:eventId/qualifications`
  - `/:season/:eventId/qualifications/:matchNumber`
  - `/:season/:eventId/playoffs`
  - `/:season/:eventId/awards`
  - `/teams/...`
  - `/register/:eventId`
  - `/register/:eventId/:registrationId`
  - `/staff/...`
- Invalid season/event/registration params fail fast with clear UX.
- `/staff/...` denies non-staff users at route and API layers.
- `/register/...` enforces ownership/team role checks.
- `/register/:eventId/:registrationId` allows non-owner team members as read-only.
- Shared route shell reused across tabs.
- Generated router tree includes all new routes.
- Public event slugs use FTC names exactly: `rankings`, `qualifications`, `playoffs`, `awards`.
- Old seasons remain persisted and queryable from database with no forced archival rewrite.

## Risks

| Risk                                                        | Impact | Mitigation                                                                                                   |
| ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| Route naming mismatch with TanStack file conventions        | Medium | Keep existing flat dot-notation; verify generated `routeTree.gen.ts` each phase                              |
| Over-coupling route-specific logic in page components       | Medium | Keep route components thin, move shared UI into `features/events` and validation into `route-policy.ts`      |
| Namespace collision between root dynamic and static routes  | High   | Validate `season` as 4-digit year and keep static namespaces explicit (`auth`, `teams`, `register`, `staff`) |
| Permission drift between frontend guards and backend checks | High   | Centralize permission matrix and mirror checks in oRPC server handlers                                       |
| Header/nav confusion with existing auth-first UX            | Medium | Add explicit route-zone navigation without exposing staff links to non-staff                                 |

## Unresolved Questions

- Resolved: keep FTC sub-slugs exactly (`rankings`, `qualifications`, `playoffs`, `awards`).
- Resolved: for `/register/:eventId/:registrationId`, non-owner team members are read-only.
- Resolved: old seasons are retained and stored in database.
