# ADR-003: Sync API Surface and OpenAPI Exposure

- Status: Accepted
- Date: 2026-04-18

## Context

The approved sync contract uses `/api/sync/v1/*` for external routes.

Current server already exposes API reference at `/api-reference`, but does not currently expose `/openapi.json`.

## Decision

Canonical target-state exposure is:

- Sync endpoints under `/api/sync/v1/*`
- OpenAPI reference UI at `/api-reference`
- OpenAPI JSON at `/openapi.json`

## Consequences

- Keeps public API pathing consistent with existing `/api` base conventions.
- Preserves current reference UI route while adding explicit machine-consumable OpenAPI endpoint.
- Requires server update to expose `/openapi.json` during implementation phase.

## Follow-up

- Add explicit server route for `/openapi.json` when sync implementation starts.
- Keep contract, docs, and runtime exposure synchronized.
