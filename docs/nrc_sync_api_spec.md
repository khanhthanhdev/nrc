# NRC Sync API Specification

## Document Status

- Status: **Target-state contract specification** (pre-implementation)
- Audience: local event-control app developers, backend developers, admin tooling developers
- Last updated: 2026-04-18
- Canonical API base path: `/api`
- Canonical sync namespace: `/sync/v1`
- Canonical sync routes: `/api/sync/v1/*`
- OpenAPI reference route (current + target): `/api-reference`
- OpenAPI JSON route (target): `/openapi.json`

---

## 1. Purpose

This document defines the approved sync API contract to be implemented.

This is not an "as-implemented" runtime guarantee yet. Current codebase state must be checked before relying on availability.

---

## 2. Contract Surfaces

### 2.1 Machine API (local app)

Authentication:

- `Authorization: Bearer <sync-secret>`

Endpoints:

- `GET /api/sync/v1/machine/bootstrap`
- `POST /api/sync/v1/machine/push`

### 2.2 Admin API (staff tooling)

Authentication:

- staff session with admin authorization

Target endpoint groups:

- sync clients: list/create/revoke
- sync policy: get/update
- sync batches: list/detail
- review actions: approve/reject staged batch

---

## 3. Versioning and Compatibility

### 3.1 Namespace

- external namespace is fixed at `/sync/v1`
- breaking wire contract changes require explicit versioning decision

### 3.2 Schema Version vs Definition Version

- `schemaVersion`: wire-contract version
- `definitionVersion`: season ruleset version for payload semantics

Client guidance:

1. Pull bootstrap first.
2. Read active `definitionVersion` from bootstrap.
3. Push with supported `schemaVersion` and the returned `definitionVersion`.
4. Fail closed if local app cannot honor returned definition version.

---

## 4. Machine Auth and Client Lifecycle

### 4.1 Credential Model

- machine credential is event-scoped
- secret is shown once and hashed at rest
- TLS required in production

### 4.2 Active Client Policy

Default policy is one active client per event:

- creating a new active credential rotates/revokes previous active credential for that event

---

## 5. Push Contract Semantics

### 5.1 Idempotency

Idempotency key scope: `(syncClientId, batchId)`

Outcomes:

- identical payload hash for same key -> `duplicate`
- different payload hash for same key -> hash mismatch conflict

### 5.2 Receipt Outcomes (minimum)

- `applied`
- `pending_review`
- `duplicate`

### 5.3 Canonical Persisted Batch States

- `validated`
- `applied`
- `pending_review`
- `duplicate`
- `rejected`
- `failed`

---

## 6. Error Surface Contract

Machine API must consistently expose symbolic codes and HTTP statuses for:

- auth failures (`UNAUTHORIZED`, revoked/expired client)
- sync disabled
- validation failure
- resource not allowed
- unsupported definition version
- batch hash mismatch

Authoritative mapping details live in `docs/sync-error-surface.md`.

---

## 7. OpenAPI Publication Policy

- API reference UI route: `/api-reference`
- canonical OpenAPI JSON endpoint: `/openapi.json` (target-state requirement)
- route definitions and schemas must be generated from the same contract source to prevent drift

---

## 8. Current Implementation Gap Note

At the time of this document update, the sync API described here is target-state and not fully implemented in the current repo runtime surface.

Before implementation starts:

- ensure prerequisites in `clean-architecture-openapi.md` are satisfied
- keep this spec synchronized with ADR decisions

---

## 9. Source of Truth

- `docs/clean-architecture-openapi.md` (master architecture)
- `docs/sync-error-surface.md` (error contract)
- `docs/adr/` (decision records)
