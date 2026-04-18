# Clean Architecture + OpenAPI for NRC Sync Service

## Document Status

- Status: Canonical **target-state** architecture specification (pre-implementation)
- Audience: Backend developers, desktop app developers
- Last updated: 2026-04-18
- Scope: Sync domain only (`machine` + `admin` surfaces)
- Related: `nrc_sync_api_spec.md`, `sync-error-surface.md`, `nrc_data_sync_design.md`

---

## 1. Purpose

This document defines the decision-complete target architecture for the NRC sync domain before implementation starts.

It intentionally separates:

- what is implemented today
- what is approved as target architecture
- what must be true before coding begins

No section in this document should be interpreted as "already implemented" unless explicitly labeled current-state.

---

## 2. Current State vs Target State

| Area | Current state (repo) | Target state (approved) | Gap |
| --- | --- | --- | --- |
| API composition | `appRouter` exposes `healthCheck` only | `appRouter.sync.machine.*` and `appRouter.sync.admin.*` | Add sync contracts/routers/use cases |
| Sync package layout | No `src/features/sync` tree yet | `packages/api/src/features/sync/{contracts,schemas,presentation,application,domain,infrastructure}` | Create full feature-root layering |
| OpenAPI reference route | `/api-reference` serves Scalar reference | Keep `/api-reference` reference route | Keep and document as canonical |
| OpenAPI JSON route | No `/openapi.json` route currently exposed | Canonical spec endpoint at `/openapi.json` | Add explicit server route during implementation |
| External sync base path | No sync routes currently exposed | `/api/sync/v1/*` | Add machine/admin sync routes |
| Error propagation model | No sync-specific pattern in code | Application returns result unions; presentation translates to transport errors | Implement standardized result contracts |
| Idempotency status graph | DB supports `duplicate` in `sync_batch_status` | Canonical state model includes `duplicate` as first-class persisted outcome | Keep database and docs aligned |

Current-state references:

- `packages/api/src/routers/index.ts`
- `apps/server/src/index.ts`
- `packages/db/src/schema/sync.ts`

---

## 3. Target Architecture

### 3.1 Layered Topology (Feature-Root)

```text
packages/api/src/features/sync/
├── contracts/        # transport contract surface (oRPC/OpenAPI metadata)
├── schemas/          # Valibot request/response schemas
├── presentation/     # router handlers, auth/context mapping, error translation
├── application/      # use-case orchestration and transaction boundaries
├── domain/           # pure business rules, value objects, ports
└── infrastructure/   # repository adapters, persistence, hashing, publication helpers
```

### 3.2 Dependency Rule

```text
presentation -> application -> domain
                   ^
           infrastructure implements domain/application ports
```

Rules:

- Dependencies point inward.
- Domain must not import transport, DB, or framework concerns.
- Presentation must not contain business rules.
- Infrastructure must not decide business policy.

### 3.3 Router Composition

Sync is composed into existing `appRouter`.

Target namespace:

- `appRouter.sync.machine`
- `appRouter.sync.admin`

No separate root router package is introduced.

---

## 4. Contract and API Decisions

### 4.1 Canonical External Surface

- Sync API routes: `/api/sync/v1/*`
- Versioning namespace: `/sync/v1`
- OpenAPI reference UI: `/api-reference`
- Canonical OpenAPI JSON: `/openapi.json` (target-state endpoint)

### 4.2 Machine and Admin Surfaces

Machine (local event-control app):

- `GET /api/sync/v1/machine/bootstrap`
- `POST /api/sync/v1/machine/push`

Admin (NRC staff tooling):

- client lifecycle
- event sync policy
- batch listing/detail
- batch review/decision

### 4.3 Error Boundary Policy

- Application use cases return discriminated union results.
- Presentation maps failure reasons to transport error codes/status.
- Transport layer remains sync-domain agnostic.

---

## 5. Domain Behavior Decisions

### 5.1 Canonical Batch/Change-Set State Model

Persisted/authoritative states include:

- `validated`
- `applied`
- `pending_review`
- `duplicate`
- `rejected`
- `failed`

`duplicate` is not only a response shape; it is a first-class persisted idempotency outcome.

### 5.2 Machine Credential Lifecycle

Default policy:

- one active machine credential per event
- creating a new credential rotates/revokes prior active credential for that event

### 5.3 Idempotency Rule

For `(syncClientId, batchId)`:

- same payload hash -> return `duplicate`
- different payload hash -> return hash-mismatch conflict

---

## 6. Rollout and Preconditions

### 6.1 Architecture Timing

This architecture is complete at planning level, but implementation is intentionally deferred.

### 6.2 Prerequisite Gate Before Coding

Sync implementation starts only after:

- auth/session model is stable
- event identity model is stable
- core admin event flows are stable

### 6.3 Implementation Sequence (When Gate Passes)

1. Machine slice first: bootstrap + push + idempotency + publication path
2. Admin slice second: clients + policy + review flows
3. Hardening: observability, edge-case coverage, contract safety nets

---

## 7. Planning Exit Checklist

Architecture is approved for implementation handoff when all are complete:

1. This master spec is accepted.
2. ADRs for packaging, error model, API/OpenAPI exposure, and rollout are accepted.
3. `nrc_sync_api_spec.md` and `sync-error-surface.md` are aligned to this doc.
4. No sync document claims implemented behavior unless present in code.

---

## 8. Source of Truth and ADR Index

- Master spec: `docs/clean-architecture-openapi.md`
- Target contract spec: `docs/nrc_sync_api_spec.md`
- Error mapping spec: `docs/sync-error-surface.md`
- Authentication source of truth: `docs/authentication-source-of-truth.md`
- Historical/superseded background: `docs/nrc_data_sync_design.md`
- ADRs:
  - `docs/adr/ADR-001-sync-packaging-in-packages-api.md`
  - `docs/adr/ADR-002-sync-result-union-error-model.md`
  - `docs/adr/ADR-003-sync-api-surface-and-openapi-exposure.md`
  - `docs/adr/ADR-004-sync-rollout-and-prerequisites.md`
