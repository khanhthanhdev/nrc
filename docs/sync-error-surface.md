# Sync Error Surface

## Document Status

- Status: Target-state error contract (pre-implementation)
- Last updated: 2026-04-18
- Scope: Sync machine-facing endpoints, with translation rules from application failures

---

## 1. Error Flow Boundary

Canonical flow:

`domain classification -> application result union -> presentation translation -> transport response`

Rules:

- Domain/application never throw transport-specific errors.
- Application returns discriminated union failures for expected business outcomes.
- Presentation layer maps failure reasons to canonical code + status.

---

## 2. Machine Endpoint Error Codes

### GET `/api/sync/v1/machine/bootstrap`

| Code             | Status | Meaning                         |
| ---------------- | ------ | ------------------------------- |
| `UNAUTHORIZED`   | 401    | Missing or invalid bearer token |
| `CLIENT_REVOKED` | 403    | Credential revoked              |
| `CLIENT_EXPIRED` | 403    | Credential expired              |
| `NOT_FOUND`      | 404    | Event/sync scope not found      |

### POST `/api/sync/v1/machine/push`

| Code                             | Status | Meaning                                           |
| -------------------------------- | ------ | ------------------------------------------------- |
| `UNAUTHORIZED`                   | 401    | Missing or invalid bearer token                   |
| `CLIENT_REVOKED`                 | 403    | Credential revoked                                |
| `CLIENT_EXPIRED`                 | 403    | Credential expired                                |
| `SYNC_DISABLED`                  | 403    | Event sync disabled                               |
| `RESOURCE_TYPE_NOT_ALLOWED`      | 403    | Pushed resource not allowed by policy             |
| `VALIDATION_FAILED`              | 400    | Payload/schema/business validation failure        |
| `UNSUPPORTED_DEFINITION_VERSION` | 400    | Unsupported season definition version             |
| `BATCH_HASH_MISMATCH`            | 409    | Same `(syncClientId,batchId)` with different hash |

---

## 3. Result-Union Contract (Application Layer)

Target pattern for push use case:

```typescript
export type ProcessPushBatchResult =
  | { success: true; receipt: PushBatchReceipt }
  | { success: false; reason: ProcessPushBatchFailureReason };

export type ProcessPushBatchFailureReason =
  | "unauthorized"
  | "client_revoked"
  | "client_expired"
  | "sync_disabled"
  | "validation_failed"
  | "resource_type_not_allowed"
  | "unsupported_definition_version"
  | "batch_hash_mismatch";
```

Mapping responsibility:

- presentation/router converts `reason` to symbolic code + status
- unexpected/unclassified failures map to internal server error contract

---

## 4. Idempotency and Duplicate Semantics

- Duplicate with identical payload hash is a successful idempotent outcome and should return a duplicate receipt.
- Duplicate with differing payload hash is an explicit conflict (`BATCH_HASH_MISMATCH`).
- Persisted status graph includes `duplicate` as first-class state.

---

## 5. Consistency Rules

This file must stay aligned with:

- `docs/clean-architecture-openapi.md` (architecture + state machine)
- `docs/nrc_sync_api_spec.md` (public contract)
- implementation code once sync is built

No section should claim runtime implementation status unless code is present.
