# Clean Architecture + OpenAPI for NRC Sync Service

## Document Status

- **Status**: Living architecture guide for the sync-domain refactor
- **Audience**: Backend developers, desktop app developers
- **Decision date**: 2026-03-27
- **Related**: `nrc_data_sync_design.md`, `nrc_sync_api_spec.md`

---

## 1. Executive Summary

This document defines the **Clean Architecture** implementation pattern for the NRC sync service, combined with **OpenAPI contract-first** design for the server ↔ desktop app synchronization layer.

### Why This Combination?

| Constraint                            | Solution                                                     |
| ------------------------------------- | ------------------------------------------------------------ |
| High developer turnover (6-12 months) | Clean Architecture = clear layer boundaries, easy onboarding |
| Desktop app sync (pull/push)          | OpenAPI = contract-first, type-safe client generation        |
| Annual theme changes                  | Domain layer stable, content configurable                    |
| NGO budget/resources                  | No gRPC complexity, REST + OpenAPI tooling                   |

### 1.1. Scope of This Document

This document is not a greenfield architecture sketch. It is a boundary-hardening and refactor plan for the sync code that already exists in:

- `packages/api` for contracts and schemas
- `packages/api-service` for routers and sync services
- `apps/server` for HTTP transport and OpenAPI exposure
- `packages/db` for sync persistence

The goal is to make the current implementation easier to reason about, easier to test, and safer to extend without changing the public sync surface unless explicitly required.

### 1.2. Non-Goals

This document does not propose:

- changing `/sync/v1/*` route shapes unless the contract itself requires it
- replacing oRPC or OpenAPI
- moving sync logic into a separate service
- introducing gRPC, streaming, or background workers as part of this refactor
- rewriting the sync feature before it is behaviorally covered by tests

### 1.3. Confirmed Team Decisions

- This plan is for the **sync domain only**, even though the sync domain connects to other services.
- The refactor must follow **small-team best practices**: clear boundaries, low ceremony, and fast development.
- The desktop app already syncs successfully, so the refactor must **not break or force changes onto the desktop integration**.
- The sync contract is treated as a **stable boundary** during the refactor. Internal changes are allowed; contract drift is not.
- The architecture should optimize for **easy yearly change**, which means season-specific behavior should stay concentrated in season definitions, policy, and sync domain rules rather than spread across routers and database code.
- The preferred style is **balanced Clean Architecture**: enough structure to isolate change, but not so much abstraction that a small team slows down.

---

## 2. Architecture Overview

### 2.1. Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│  CONTRACT LAYER (OpenAPI - Contract-First)              │
│  packages/api/src/contracts/sync-*.contract.ts          │
│  packages/api/src/schemas/sync/*.ts                     │
│  - Valibot schemas (source of truth)                    │
│  - Shared request/response types                        │
└─────────────────────────────────────────────────────────┘
                          ↓ consumed by
┌─────────────────────────────────────────────────────────┐
│  TRANSPORT LAYER (HTTP/OpenAPI Exposure)                │
│  apps/server/src/app.ts                                 │
│  apps/server/src/handlers/openapi.ts                    │
│  apps/server/src/handlers/rpc.ts                        │
│  - Mounts RPC and OpenAPI handlers                      │
│  - Serves /openapi.json and /api                        │
│  - Does NOT contain sync business rules                 │
└─────────────────────────────────────────────────────────┘
                          ↓ forwards to
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Controllers/Routes)                │
│  packages/api-service/src/routers/sync-*.router.ts      │
│  - Binds contracts to handlers                          │
│  - Maps auth/context to use-case inputs                 │
│  - Translates domain/application errors to ORPC errors  │
└─────────────────────────────────────────────────────────┘
                          ↓ calls
┌─────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases)                          │
│  packages/api-service/src/services/sync/application/    │
│  - get-event-bootstrap.usecase.ts                       │
│  - process-push-batch.usecase.ts                        │
│  - review-sync-batch.usecase.ts                         │
│  - create-sync-client.usecase.ts                        │
│  - Owns orchestration and transaction boundaries        │
└─────────────────────────────────────────────────────────┘
                          ↓ uses
┌─────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Core Business Logic)                     │
│  packages/api-service/src/services/sync/domain/         │
│  - Entities: SyncClient, SyncBatch, SyncPolicy          │
│  - Value Objects: EventKey, BatchId, ResourceType       │
│  - Repository ports and policy interfaces               │
│  - Business Rules: validation, review decisions,        │
│    idempotency invariants, allowed-resource checks      │
│  - NO external dependencies (no DB, no HTTP)            │
└─────────────────────────────────────────────────────────┘
                          ↓ implemented by
┌─────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER                                   │
│  packages/db/src/schema/sync.ts                         │
│  packages/api-service/src/services/sync/infrastructure/ │
│  - Drizzle repositories                                 │
│  - Season registry adapters                             │
│  - Canonical hashing + normalization adapters           │
│  - Audit log + publication persistence                  │
└─────────────────────────────────────────────────────────┘
```

### 2.2. Dependency Rule

```
TRANSPORT → PRESENTATION → APPLICATION → DOMAIN
                              ↑
                     INFRASTRUCTURE implements ports
```

**Rule**: Dependencies point **INWARD only**. Outer layers depend on inner layers, never vice versa.

### 2.3. What Lives Where in This Repo

| Layer          | Current repo location                                                  | Responsibility                                                 | Must not do                                                  |
| -------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| Contract       | `packages/api/src/contracts`, `packages/api/src/schemas/sync`          | Define request/response schemas, error surface, route metadata | Read DB, inspect auth context, encode runtime business rules |
| Transport      | `apps/server/src/handlers`                                             | Expose RPC and OpenAPI over HTTP                               | Contain sync-specific branching                              |
| Presentation   | `packages/api-service/src/routers/sync-*.router.ts`                    | Bind contract procedures to sync handlers                      | Build SQL, hash payloads, publish records                    |
| Application    | `packages/api-service/src/services/sync/application`                   | Coordinate use cases and transactions                          | Know ORPC/Hono details                                       |
| Domain         | `packages/api-service/src/services/sync/domain`                        | Own sync rules and vocabulary                                  | Import Drizzle, context, Hono, ORPC                          |
| Infrastructure | `packages/api-service/src/services/sync/infrastructure`, `packages/db` | Implement repositories, persistence, external adapters         | Leak DB records directly to routers                          |

---

## 3. Contract-First with OpenAPI

### 3.1. Why OpenAPI (Not gRPC/Protobuf)?

| Factor                       | OpenAPI + REST                | gRPC + Protobuf                   |
| ---------------------------- | ----------------------------- | --------------------------------- |
| Developer onboarding         | ✅ Familiar REST patterns     | ⚠️ Proto learning curve           |
| Desktop app (Electron/Tauri) | ✅ Fetch/axios works directly | ⚠️ Need grpc-web or extra tooling |
| NGO volunteer turnover       | ✅ Standard web tech          | ❌ Specialized knowledge          |
| Browser devtools             | ✅ Network tab inspectable    | ⚠️ Binary protocol                |
| API documentation            | ✅ Auto-generated Swagger UI  | ⚠️ Extra setup                    |
| **Our decision**             | ✅ **Selected**               | ❌ **Not needed**                 |

### 3.2. Current Contract Structure

```
packages/api/src/
├── contracts/
│   ├── sync-machine.contract.ts    # Desktop app endpoints
│   ├── sync-admin.contract.ts      # Admin management endpoints
│   └── sync.contract.ts            # Shared sync types
├── schemas/sync/
│   ├── common.schema.ts            # Shared primitives
│   ├── pull.schema.ts              # Bootstrap, changes
│   ├── push.schema.ts              # Batch push payloads
│   ├── admin.schema.ts             # Admin operations
│   ├── season-definition.schema.ts # Season config
│   └── seasons/
│       └── 2025.schema.ts          # Year-specific rules
```

### 3.3. Example Contract Shape

```typescript
// packages/api/src/contracts/sync-machine.contract.ts
import { contract } from "../contract";
import { eventBootstrapResponseSchema } from "../schemas/sync/pull.schema";
import {
  pushSyncBatchRequestSchema,
  pushSyncBatchResponseSchema,
} from "../schemas/sync/push.schema";

export const syncMachineContract = contract.tag("SyncMachine").router({
  getEventBootstrap: contract
    .route({
      method: "GET",
      path: "/sync/v1/machine/bootstrap",
      operationId: "getEventBootstrap",
    })
    .output(eventBootstrapResponseSchema),
  pushSyncBatch: contract
    .input(pushSyncBatchRequestSchema)
    .output(pushSyncBatchResponseSchema)
    .route({
      method: "POST",
      path: "/sync/v1/machine/push",
      operationId: "pushSyncBatch",
    }),
});
```

### 3.4. Generated Outputs

The oRPC framework automatically generates:

1. **TypeScript types** - consumed by `packages/api-service` and `apps/web`
2. **OpenAPI spec** - served by `apps/server` at `GET /openapi.json`
3. **Swagger UI** - served by `apps/server` at `GET /api` (via `@orpc/openapi`)
4. **Desktop client SDK** - can be generated via `openapi-typescript-codegen`

### 3.5. Contract Boundary Rules

- `packages/api` stays the source of truth for request and response shape.
- Contract schemas validate structure, enums, and documented error surface.
- Runtime business rules remain outside the contract package. Example: whether a machine is revoked belongs in application/domain code, not in the schema.
- Contract-breaking changes require an explicit versioning decision. Refactors inside `packages/api-service` must preserve the existing `operationId`, route shape, and desktop-facing semantics by default.

---

## 4. Clean Architecture Implementation

### 4.1. Current State Assessment

**Status**: ✅ **COMPLETE** (2026-03-29)

The sync layering is fully implemented with clean boundaries:

```
packages/api/src/contracts/                    ✅ Contract layer
packages/api/src/schemas/sync/                ✅ Contract schemas
apps/server/src/handlers/openapi.ts           ✅ Transport/OpenAPI exposure
packages/api-service/src/routers/sync-*.ts    ✅ Thin presentation layer
packages/api-service/src/services/sync/       ✅ Clean layering:
  ├── domain/                                 ✅ Pure rules and ports
  ├── application/                            ✅ Use cases
  └── infrastructure/                         ✅ Adapters and composition
packages/db/src/schema/sync.ts                ✅ Persistence schema
```

**Completed migrations:**

- Pure sync rules extracted to `domain/` (validators, decision services, value objects)
- Use cases extracted to `application/` (one per router action)
- Repository implementations in `infrastructure/repositories/`
- Composition root in `infrastructure/composition/` (wiring only, ~400 lines)
- Legacy transitional services removed (`push.service.ts`, `pull.service.ts`, `admin.service.ts`, `review.service.ts`, `publish.service.ts`, `review-publish.service.ts`)

### 4.2. Final Structure

```
packages/api-service/src/
├── routers/
│   ├── sync-machine.router.ts       # Presentation: routes only
│   └── sync-admin.router.ts
├── services/sync/
│   ├── domain/                       # Pure business logic
│   │   ├── value-objects/            # EventKey, BatchId, SyncReviewMode, AllowedPushResource
│   │   ├── repositories/             # Interfaces ONLY (port definitions)
│   │   ├── services/                 # Domain services (batch-validator, review-decision, bootstrap-builder)
│   │   ├── types/                    # Domain-level types
│   │   ├── README.md                 # Layer ownership and rules
│   │   └── index.ts
│   ├── application/                  # Use cases
│   │   ├── machine/                  # Machine-facing use cases
│   │   │   ├── get-event-bootstrap.usecase.ts
│   │   │   └── process-push-batch.usecase.ts
│   │   ├── admin/                    # Admin-facing use cases
│   │   │   ├── create-sync-client.usecase.ts
│   │   │   ├── get-sync-batch.usecase.ts
│   │   │   ├── get-sync-policy.usecase.ts
│   │   │   ├── list-sync-batches.usecase.ts
│   │   │   ├── list-sync-clients.usecase.ts
│   │   │   ├── review-sync-batch.usecase.ts
│   │   │   ├── revoke-sync-client.usecase.ts
│   │   │   └── update-sync-policy.usecase.ts
│   │   ├── types/                    # Application DTOs
│   │   ├── README.md                 # Layer ownership and rules
│   │   └── index.ts
│   └── infrastructure/               # Implementations
│       ├── composition/              # sync-module.ts, sync-root.ts (wiring)
│       ├── mappers/                  # Response mapping utilities
│       ├── repositories/             # Drizzle implementations
│       │   ├── drizzle-accepted-state.repo.ts
│       │   ├── drizzle-season-definition.repo.ts
│       │   ├── drizzle-sync-batch.repo.ts
│       │   ├── drizzle-sync-client.repo.ts
│       │   └── drizzle-sync-policy.repo.ts
│       ├── services/                 # Infrastructure services
│       │   ├── audit-log-writer.service.ts
│       │   ├── batch-normalizer.service.ts
│       │   ├── change-diff.service.ts
│       │   ├── change-set-publisher.service.ts
│       │   ├── payload-hasher.service.ts
│       │   ├── publish-projection.service.ts
│       │   ├── push-payload-parser.ts
│       │   ├── review-policy-evaluator.ts
│       │   └── session-guard.ts
│       ├── types/                    # Infrastructure-level types
│       ├── README.md                 # Layer ownership and rules
│       └── index.ts
```

**Transitional services removed:**

- `push.service.ts` — orchestration moved to `application/machine/process-push-batch.usecase.ts`
- `pull.service.ts` — replaced by `application/machine/get-event-bootstrap.usecase.ts`
- `admin.service.ts` — replaced by explicit admin use cases
- `review.service.ts` — logic moved to `application/admin/review-sync-batch.usecase.ts`
- `publish.service.ts` — publication logic in `infrastructure/services/publish-projection.service.ts`
- `review-publish.service.ts` — duplicate publication path removed
- `push-validation.service.ts` — validation moved to `domain/services/batch-validator.service.ts`
- `push-canonicalization.service.ts` — hashing in `infrastructure/services/payload-hasher.service.ts`
- `push-normalization.service.ts` — normalization in `infrastructure/services/batch-normalizer.service.ts`
- `review-policy.service.ts` — policy evaluation in `infrastructure/services/review-policy-evaluator.ts`

### 4.3. Boundary Rules for the Refactor

- Routers may read auth and session context, call one application entry point, and map failures to ORPC errors. Nothing more.
- Application code may own transactions, idempotency flow, and sequencing across repositories and domain services.
- Domain code may decide whether a batch is valid, reviewable, duplicate-incompatible, or publishable, but it must work without Drizzle, Hono, ORPC, or request context.
- Infrastructure code may translate DB rows to domain objects and persist domain decisions, but it must not encode business branching that belongs in the domain.
- Prefer function-first modules and explicit factories. Introduce classes or a DI container only where they pay for themselves.
- `apps/server` remains a transport shell. Sync refactors should not require business-logic edits there unless the contract exposure changes.

### 4.4. Current File Mapping to Layers

| Current file                                                                                | Role                                                     | Status                                  |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------- |
| `packages/api-service/src/services/sync/application/machine/get-event-bootstrap.usecase.ts` | machine bootstrap orchestration                          | ✅ Authoritative                        |
| `packages/api-service/src/services/sync/application/machine/process-push-batch.usecase.ts`  | push validation, staging, receipt                        | ✅ Authoritative                        |
| `packages/api-service/src/services/sync/application/admin/*.usecase.ts`                     | admin orchestration                                      | ✅ Authoritative                        |
| `packages/api-service/src/services/sync/domain/*`                                           | pure rules and ports                                     | ✅ Authoritative                        |
| `packages/api-service/src/services/sync/infrastructure/*`                                   | persistence, hashing, normalization, publication, wiring | ✅ Authoritative                        |
| `packages/api-service/src/services/sync/auth.service.ts`                                    | auth helpers (buildEventKey, generateSyncClientSecret)   | ⚠️ Keep — used by composition root      |
| `packages/api-service/src/services/sync/season-registry.service.ts`                         | season registry                                          | ⚠️ Consider migration to infrastructure |
| `packages/api-service/src/services/sync/change-diff.service.ts`                             | diff generation for review UI                            | ✅ Uses infrastructure helpers          |
| `packages/api-service/src/services/sync/bootstrap-queries.service.ts`                       | bootstrap query helpers                                  | ⚠️ Consider migration to infrastructure |
| `packages/api-service/src/services/sync/sync-utils.ts`                                      | shared utilities                                         | ✅ Keep — pure helpers                  |

**Deleted transitional services:**
| Deleted file | Replacement |
|-------------|-------------|
| `push.service.ts` | `application/machine/process-push-batch.usecase.ts` |
| `pull.service.ts` | `application/machine/get-event-bootstrap.usecase.ts` |
| `admin.service.ts` | `application/admin/*.usecase.ts` |
| `review.service.ts` | `application/admin/review-sync-batch.usecase.ts` |
| `publish.service.ts` | `infrastructure/services/publish-projection.service.ts` |
| `review-publish.service.ts` | Removed — duplicate publication path |

### 4.5. Migration Plan (COMPLETE)

The refactor has been completed in phases. This section records the approach for future reference.

**Phase 0: Freeze the External Surface** ✅

- Contract tests added for `getEventBootstrap`, `pushSyncBatch`, `reviewSyncBatch`
- Router safety-net tests verify one-use-case-per-route pattern

**Phase 1: Extract Sync Domain Vocabulary** ✅

- Value objects: `EventKey`, `BatchId`, `SyncReviewMode`, `AllowedPushResource`
- Domain services: `batch-validator.service.ts`, `review-decision.service.ts`, `bootstrap-builder.service.ts`
- Repository ports defined in `domain/repositories/`

**Phase 2: Separate Application Use Cases** ✅

- Machine use cases: `get-event-bootstrap.usecase.ts`, `process-push-batch.usecase.ts`
- Admin usecases: `create-sync-client`, `list-sync-batches`, `review-sync-batch`, `update-sync-policy`, etc.

**Phase 3: Introduce Repository Ports and Infra Adapters** ✅

- Drizzle repositories implement domain ports
- Application code depends on interfaces, not concrete DB queries

**Phase 4: Make Transactions and Publication Explicit** ✅

- Single publication path in `publish-projection.service.ts`
- Transaction boundaries owned by use cases, implemented via `sync-module.ts`

**Phase 5: Add Composition Root** ✅

- `sync-module.ts` (~400 lines) wires use cases with concrete implementations
- `sync-root.ts` exports the assembled module for routers to import

**Phase 6: Cleanup and Documentation** ✅

- Legacy transitional services deleted
- Layer READMEs updated with ownership rules
- This document updated to reflect final state

### 4.6. Acceptance Gates (ALL PASSED)

| Phase | Required proof                                                              | Status  |
| ----- | --------------------------------------------------------------------------- | ------- |
| 0     | Contract and route behavior documented by tests                             | ✅ Pass |
| 1     | Pure unit tests exist for extracted sync rules                              | ✅ Pass |
| 2     | Routers only orchestrate auth/context and ORPC error mapping                | ✅ Pass |
| 3     | Use cases no longer import Drizzle tables directly                          | ✅ Pass |
| 4     | Auto-accept and manual approval share the same publication path             | ✅ Pass |
| 5     | Wiring is explicit and test setup does not depend on global container state | ✅ Pass |
| 6     | Legacy services deleted, docs updated                                       | ✅ Pass |

**Verification commands:**

```bash
# All sync tests pass
bun test packages/api-service/src/services/sync/
bun test packages/api-service/src/routers/sync-machine.router.test.ts
bun test packages/api-service/src/routers/sync-admin.router.test.ts

# No imports of deleted legacy services
rg "push\.service|pull\.service|admin\.service|review\.service|publish\.service|review-publish" packages/api-service/src

# Type check and lint pass
bun run check-types
bun x ultracite check
```

### 4.7. Step-by-Step Execution Order (RECORDED)

This records the implementation order that was followed for the sync refactor.

**Step 1: Capture current behavior** ✅

- Lock down current machine and admin sync behavior with tests
- Record the current receipt semantics for `duplicate`, `applied`, `pending_review`, and failure cases

**Step 2: Create the new folders without changing behavior** ✅

- Add `services/sync/domain/`, `services/sync/application/`, `services/sync/infrastructure/`

**Step 3: Extract pure sync vocabulary** ✅

- Event key and batch ID value objects
- Sync policy rule helpers
- Client lifecycle checks
- Push batch invariant helpers

**Step 4: Wrap existing flows as use-case entry points** ✅

- Application entry points for bootstrap, push, review, client management, policy management

**Step 5: Extract repository ports** ✅

- Repository interfaces based on actual use-case needs

**Step 6: Move persistence behind infrastructure adapters** ✅

- Replace direct Drizzle usage with repository implementations

**Step 7: Centralize transaction boundaries** ✅

- Push staging, review approval, and rejection flows explicit in application code

**Step 8: Rewire routers to the new use cases** ✅

- Routers call only application entry points

**Step 9: Remove obsolete mixed services** ✅

- Legacy transitional services deleted after new layers passed tests

**Step 10: Finalize yearly-change guidance** ✅

- Document where future season changes belong (see layer READMEs)

---

## 5. Sync Service Specifics

### 5.1. Pull Workflow (Desktop → Server)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Desktop    │     │  Controller  │     │ PullSyncUC   │
│   App        │     │  (Router)    │     │ (Use Case)   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ GET /sync/v1/      │                    │
       │ machine/bootstrap  │                    │
       │───────────────────>│                    │
       │                    │ call               │
       │                    │───────────────────>│
       │                    │                    │
       │                    │                    │ Fetch from
       │                    │                    │ repositories
       │                    │                    │
       │                    │ return Bootstrap   │
       │                    │<───────────────────│
       │ return response    │                    │
       │<───────────────────│                    │
       │                    │                    │
```

### 5.2. Push Workflow (Desktop → Server)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Desktop    │     │  Controller  │     │ PushSyncUC   │
│   App        │     │  (Router)    │     │ (Use Case)   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ POST /sync/v1/     │                    │
       │ machine/push       │                    │
       │ {batchId, ...}     │                    │
       │───────────────────>│                    │
       │                    │ call               │
       │                    │───────────────────>│
       │                    │                    │
       │                    │                    │ 1. Validate
       │                    │                    │ 2. Check idempotency
       │                    │                    │ 3. Stage changes
       │                    │                    │ 4. Auto-apply or
       │                    │                    │    pending_review
       │                    │                    │
       │                    │ return receipt     │
       │                    │<───────────────────│
       │ return {status,    │                    │
       │         changeSetId}│                   │
       │<───────────────────│                    │
```

### 5.2.1. Push Execution Responsibilities

The current `processPushBatch` flow already implies a concrete sequence. The refactor should preserve that sequence explicitly:

1. Parse request against `pushSyncBatchRequestSchema`.
2. Canonicalize the payload and compute the hash.
3. Enforce schema-version support.
4. Check duplicate `batchId` for the current machine client.
5. Enforce event-level sync enablement.
6. Validate the requested `definitionVersion` against the season registry.
7. Enforce allowed push resource types from machine policy.
8. Load approved team and season data required for business validation.
9. Validate the payload against business rules.
10. Normalize accepted records into staged items.
11. Persist batch metadata, resource rows, change set, staged items, and audit log in one transaction.
12. Evaluate review policy.
13. Either auto-apply through the shared publication path, move to `pending_review`, or fail with an explicit terminal reason.

### 5.2.2. State Machine That Must Stay Authoritative

The implementation should treat batch and change-set status as one controlled state machine:

- `validated -> applied`
- `validated -> pending_review`
- `validated -> failed`
- `pending_review -> applied`
- `pending_review -> rejected`

Any additional state should be justified in the persistence design first. The goal is to avoid one status graph in storage and a different implied graph in service code.

### 5.3. Domain Entities

```typescript
// packages/api-service/src/services/sync/domain/entities/sync-client.entity.ts

export class SyncClient {
  constructor(
    public readonly id: string,
    public readonly eventKey: EventKey,
    public readonly name: string,
    public readonly isActive: boolean,
    public readonly isRevoked: boolean,
    public readonly allowedResources: ResourceType[],
    public readonly createdAt: Date,
    public readonly expiresAt?: Date,
  ) {}

  // Business logic methods
  canPush(resourceType: ResourceType): boolean {
    return this.isActive && !this.isRevoked && this.allowedResources.includes(resourceType);
  }

  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }
}
```

### 5.4. Repository Interfaces

```typescript
// packages/api-service/src/services/sync/domain/repositories/sync-client.repo.ts

export interface ISyncClientRepository {
  findById(id: string): Promise<SyncClient | null>;
  findBySecret(secret: string): Promise<SyncClientWithSecret | null>;
  create(client: SyncClientCreateDto): Promise<SyncClient>;
  revoke(id: string): Promise<void>;
  listByEvent(eventKey: EventKey): Promise<SyncClient[]>;
}
```

### 5.5. Use Case Example

```typescript
// packages/api-service/src/services/sync/application/get-event-bootstrap.usecase.ts

export class GetEventBootstrapUseCase {
  constructor(
    private readonly syncClientRepo: ISyncClientRepository,
    private readonly seasonDefinitionRepo: ISeasonDefinitionRepository,
    private readonly eventRepo: IEventRepository,
    private readonly registrationRepo: IRegistrationRepository,
  ) {}

  async execute(input: PullSyncInput): Promise<PullSyncOutput> {
    // 1. Get client from repository
    const client = await this.syncClientRepo.findById(input.clientId);
    if (!client) throw new UnauthorizedError("Client not found");

    // 2. Fetch domain data through repositories
    const seasonDef = await this.seasonDefinitionRepo.getBySeason(client.eventKey.season);
    const event = await this.eventRepo.getByKey(client.eventKey);
    const registrations = await this.registrationRepo.getApproved(client.eventKey);

    // 3. Apply business logic
    const bootstrap = this.buildBootstrapResponse(client, seasonDef, event, registrations);

    // 4. Return pure domain result (no HTTP, no DB)
    return { bootstrap };
  }
}
```

---

## 6. Desktop App Integration

### 6.1. SDK Generation

```bash
# Generate TypeScript client from OpenAPI spec
openapi-typescript-codegen generate \
  --input http://localhost:3000/openapi.json \
  --output ./src/generated/sync-client \
  --client fetch
```

### 6.2. Desktop App Usage

```typescript
// Desktop app sync service
import { SyncMachineService } from './generated/sync-client';

const client = new SyncMachineService({
  baseUrl: 'https://api.nrc.org',
  headers: {
    'Authorization': `Bearer ${SYNC_SECRET}`
  }
});

// Pull bootstrap
const bootstrap = await client.getEventBootstrap();

// Push batch
const receipt = await client.pushSyncBatch({
  schemaVersion: '2026-03-08',
  definitionVersion: '2025.1',
  batchId: generateBatchId(),
  resources: [...]
});

if (receipt.status === 'pending_review') {
  // Show pending state to operator
}
```

### 6.3. Desktop Integration Decisions to Keep Explicit

- The desktop app should keep treating the existing sync API surface as the canonical integration surface.
- This refactor must not require a coordinated desktop rewrite. Compatibility with the current desktop sync flow is a hard constraint.
- Generated client code, if used later, should be version-pinned to a committed API revision or release process. Do not regenerate ad hoc without knowing which server contract it targets.
- Receipt handling must support at least `duplicate`, `applied`, and `pending_review`.
- The local app should treat `pending_review` as a successful receipt that is awaiting admin action, not as a transport failure.

---

## 7. Testing Strategy

### 7.1. Domain Layer Tests (Unit)

```typescript
// packages/api-service/src/services/sync/domain/entities/sync-client.entity.test.ts

describe("SyncClient", () => {
  it("allows push when active and resource is allowed", () => {
    const client = new SyncClient({
      id: "1",
      eventKey: EventKey.create("2025", "VNCMP"),
      name: "Test Client",
      isActive: true,
      isRevoked: false,
      allowedResources: ["match_results"],
    });

    expect(client.canPush("match_results")).toBe(true);
    expect(client.canPush("team_awards")).toBe(false);
  });
});
```

### 7.2. Use Case Tests (Integration)

```typescript
// packages/api-service/src/services/sync/application/push-sync.usecase.test.ts

describe("PushSyncUseCase", () => {
  it("rejects batch from revoked client", async () => {
    const mockClientRepo = new MockSyncClientRepository();
    mockClientRepo.clients.set("1", createRevokedClient());

    const useCase = new PushSyncUseCase(mockClientRepo /* ... */);

    await expect(useCase.execute(validPushInput)).rejects.toThrow(ClientRevokedError);
  });
});
```

### 7.3. Contract Tests

```typescript
// packages/api/src/contracts/sync-machine.contract.test.ts

describe("syncMachineContract", () => {
  it("validates bootstrap response schema", () => {
    const validResponse = {
      /* ... */
    };
    expect(isValid(validResponse, bootstrapResponseSchema)).toBe(true);
  });

  it("rejects push with unknown resource type", () => {
    const invalidPush = { resources: [{ resourceType: "unknown" }] };
    expect(isValid(invalidPush, pushRequestSchema)).toBe(false);
  });
});
```

### 7.4. Refactor-Safety Test Matrix

| Layer          | Minimum coverage                                                                  |
| -------------- | --------------------------------------------------------------------------------- |
| Contract       | schema validation, route metadata, error code surface                             |
| Presentation   | router-to-use-case mapping, auth guard behavior, ORPC error translation           |
| Application    | bootstrap flow, push idempotency, review routing, publish/reject transactions     |
| Domain         | allowed-resource checks, client revocation/expiry behavior, review decision rules |
| Infrastructure | repository mapping, transactional writes, diff/publication persistence            |

### 7.5. High-Risk Cases That Must Be Covered

- duplicate `batchId` with identical payload returns `duplicate`
- duplicate `batchId` with different payload returns hash mismatch
- sync disabled blocks valid machine pushes
- unsupported `definitionVersion` is rejected before publication
- disallowed resource type is rejected even if the schema shape is valid
- `AUTO_ACCEPT` plus guardrail hit routes to `pending_review`
- manual review approval uses the same publish path as auto-accept
- rejected or failed batches never leak into accepted public projections

---

## 8. Benefits for NGO Context

### 8.1. High Turnover Mitigation

| Benefit                | Impact                                      |
| ---------------------- | ------------------------------------------- |
| Clear layer boundaries | New devs know where to look                 |
| Domain logic isolated  | Business rules easy to find and test        |
| Repository interfaces  | Database changes don't break business logic |
| Contract-first API     | Desktop app devs work in parallel           |

### 8.2. Annual Theme Changes

| Layer          | Changes Yearly? | How to Update              |
| -------------- | --------------- | -------------------------- |
| Contract       | No              | Stable OpenAPI spec        |
| Domain         | Partially       | Add new season to registry |
| Application    | No              | Use cases remain stable    |
| Presentation   | No              | Routes remain stable       |
| Infrastructure | Maybe           | Database migrations        |

### 8.3. Onboarding Checklist for New Developers

```
Week 1:
☐ Read docs/clean-architecture-openapi.md
☐ Read docs/nrc_data_sync_design.md
☐ Run `bun run dev` and explore /api Swagger UI
☐ Trace one machine bootstrap call: transport → router → use case → repository

Week 2:
☐ Add a new field to sync_policy table
☐ Update contract schema if the API surface changes
☐ Update repository interface and infrastructure implementation
☐ Write one unit test for a domain rule
☐ Write one application-flow test for the affected use case

Week 3:
☐ Debug one pending-review batch end to end
☐ Generate desktop SDK against local `/openapi.json`
☐ Confirm accepted data shows up only through published projections
```

---

## 9. Architecture Decision Records

### ADR-001: Why OpenAPI over gRPC?

**Context**: Desktop app needs to sync with server. gRPC offers better performance, but OpenAPI is simpler.

**Decision**: Use OpenAPI + REST.

**Rationale**:

- Volunteer developers already know REST
- Browser devtools work out of the box
- No proto compilation step for desktop app
- Performance difference negligible for our payload sizes

**Consequences**:

- Slightly larger payloads (JSON vs binary)
- No streaming support (not needed for our use case)

### ADR-002: Why Clean Architecture?

**Context**: High developer turnover means code must be self-documenting.

**Decision**: Implement Clean Architecture layers with dependency inversion.

**Rationale**:

- Domain logic isolated = easy to test and understand
- Database changes don't break business rules
- New devs can find "where the rules live"
- Use cases are explicit about what they do

**Consequences**:

- More files initially
- Requires discipline to maintain boundaries
- Worth it for long-term maintainability

---

## 10. Related Documents

| Document                               | Purpose                                    |
| -------------------------------------- | ------------------------------------------ |
| `nrc_sync_api_spec.md`                 | Implementation API spec for local app devs |
| `nrc_data_sync_design.md`              | Full technical design for sync system      |
| `../README.md`                         | Getting started guide                      |
| `../packages/api/src/contracts/`       | Contract source code                       |
| `../packages/api-service/src/routers/` | Router implementations                     |

---

## 11. Confirmed Decisions

1. This document applies to the sync domain only.
2. The architecture should follow small-team best practices and stay easy to change each year.
3. The sync contract must remain stable so the current desktop sync implementation is not forced to change.
4. The refactor should be step by step and may change the whole internal sync implementation behind the stable contract.
5. The preferred architecture is balanced rather than heavy: clean boundaries, explicit flow, and minimal framework overhead.
6. The primary goal is maintainability and yearly adaptability, not maximum abstraction.

---

## 12. Next Actions

1. Lock contract behavior with tests before moving internal files.
2. Extract domain vocabulary and decision helpers from the current sync services.
3. Split the largest sync flows into explicit application use cases.
4. Move Drizzle reads and writes behind infrastructure repositories.
5. Add a composition module and keep wiring explicit before evaluating container-based DI.
6. Re-run the push, review, and public-consumption verification path after each phase.
