# Sync Error Surface

This document defines the error surface for machine-facing sync endpoints. Keep it aligned with the machine router and application use cases so refactors do not change the public sync contract by accident.

**Last updated**: 2026-03-29 (Clean Architecture refactor complete)

## Architecture Context

After the Clean Architecture refactor:

- **Transport layer** (`apps/server`) — HTTP handling, OpenAPI exposure
- **Presentation layer** (`sync-machine.router.ts`) — Auth, context mapping, ORPC error translation
- **Application layer** (`application/machine/*.usecase.ts`) — Use case orchestration, result types
- **Domain layer** (`domain/`) — Pure validation rules, error classifications
- **Infrastructure layer** (`infrastructure/`) — Persistence, publication, audit logging

Error flow: **Domain → Application → Presentation (translate to ORPC) → Transport**

## Machine Endpoint Errors

### GET /sync/v1/machine/bootstrap

| Error Code       | HTTP Status | When                                                 |
| ---------------- | ----------- | ---------------------------------------------------- |
| `NOT_FOUND`      | 404         | Event registry not found for the machine's event key |
| `CLIENT_REVOKED` | 403         | Machine secret has been revoked                      |
| `CLIENT_EXPIRED` | 403         | Machine secret has expired                           |
| `UNAUTHORIZED`   | 401         | Missing or invalid bearer token                      |

### POST /sync/v1/machine/push

| Error Code                       | HTTP Status | When                                                |
| -------------------------------- | ----------- | --------------------------------------------------- |
| `VALIDATION_FAILED`              | 400         | Schema validation failed or batch payload invalid   |
| `SYNC_DISABLED`                  | 403         | `isSyncEnabled = false` for this event              |
| `RESOURCE_TYPE_NOT_ALLOWED`      | 403         | Resource type not in `allowedPushResources`         |
| `UNSUPPORTED_DEFINITION_VERSION` | 400         | Season registry doesn't have definition for version |
| `BATCH_HASH_MISMATCH`            | 409         | Duplicate `batchId` with different payload          |
| `CLIENT_REVOKED`                 | 403         | Machine secret has been revoked                     |
| `CLIENT_EXPIRED`                 | 403         | Machine secret has expired                          |
| `UNAUTHORIZED`                   | 401         | Missing or invalid bearer token                     |

## Error Response Format

Errors follow the ORPC error format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error description",
  "status": 400
}
```

## Router Layer Responsibilities

The router layer (`sync-machine.router.ts`) handles:

1. **Auth middleware** — `requireMachineAuth` validates bearer token
2. **Context mapping** — `getMachineContext` ensures machine context exists
3. **Error translation** — application use case results → `ORPCError` with correct HTTP status
4. **No business logic** — all validation and decision-making happens in application/domain layers

**Example error translation:**

```typescript
// sync-machine.router.ts
pushSyncBatch: syncMachineContract.pushSyncBatch.handler(async (opts) => {
  const { input, context } = opts;
  const requestId = opts.context.requestId;

  const result = await syncModule.machine.processPushBatch.execute({
    machineScope: context.machineScope,
    payload: input,
    request: { requestId },
  });

  // Application returned failure → translate to ORPC error
  if (!result.success) {
    switch (result.reason) {
      case "sync_disabled":
        throw new ORPCError("SYNC_DISABLED", { status: 403 });
      case "client_revoked":
        throw new ORPCError("CLIENT_REVOKED", { status: 403 });
      case "validation_failed":
        throw new ORPCError("VALIDATION_FAILED", { status: 400 });
      // ... other cases
    }
  }

  // Application succeeded → return receipt
  return result.batch;
});
```

## Application Use Case Error Handling

Application use cases return discriminated union results instead of throwing transport errors. This keeps business logic decoupled from HTTP/ORPC concerns.

**Push batch result type:**

```typescript
// application/types/push-batch.types.ts
export type ProcessPushBatchResult =
  | { success: true; batch: PushBatchReceipt }
  | { success: false; reason: ProcessPushBatchFailureReason };

export type ProcessPushBatchFailureReason =
  | "client_revoked"
  | "client_expired"
  | "sync_disabled"
  | "validation_failed"
  | "hash_mismatch"
  | "resource_type_not_allowed"
  | "unsupported_definition_version"
  | "duplicate_batch";
```

**Use case execution pattern:**

```typescript
// Router calls use case through composition root
const result = await syncModule.machine.processPushBatch.execute({
  machineScope,
  payload,
  request: { requestId },
});

// Use case returns result, doesn't throw
if (!result.success) {
  // Router translates to ORPC error
  throw new ORPCError(result.reason.toUpperCase());
}
```

**Domain errors bubble up through application:**

```typescript
// Domain service returns validation failure
const validation = validatePushBatch(batch, policy);
if (!validation.valid) {
  return { success: false, reason: "validation_failed" };
}

// Application orchestrates, domain decides
```

## Contract Reference

See `packages/api/src/contracts/sync-machine.contract.ts` for the authoritative error definitions.
