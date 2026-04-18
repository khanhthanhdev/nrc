# ADR-001: Sync Packaging in `packages/api`

- Status: Accepted
- Date: 2026-04-18

## Context

The repository does not currently contain `packages/api-service`, but earlier draft docs referenced that package for sync layering.

We need a packaging decision that matches the existing monorepo and preserves clear Clean Architecture boundaries.

## Decision

Implement sync domain inside `packages/api` using a feature-root layout:

`packages/api/src/features/sync/{contracts,schemas,presentation,application,domain,infrastructure}`

## Consequences

- Avoids introducing a new workspace package solely for sync at this stage.
- Keeps contract + router + use-case evolution close to current `appRouter` composition.
- Requires strict inward dependency rules inside one package.

## Follow-up

- Enforce dependency direction in code review and tests.
- Keep docs consistent with this package layout.
