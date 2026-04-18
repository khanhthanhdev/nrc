# ADR-002: Result-Union Error Model for Sync Application Layer

- Status: Accepted
- Date: 2026-04-18

## Context

Sync flows have multiple expected business failure outcomes (policy violations, validation failures, idempotency conflicts).

Transport and contract concerns must stay out of domain/application logic.

## Decision

Application use cases return discriminated result unions for expected outcomes.

Presentation layer maps failure reasons to transport error codes and HTTP statuses.

## Consequences

- Business logic remains decoupled from ORPC/Hono transport concerns.
- Error mapping becomes explicit and testable in router/presentation layer.
- Unexpected failures still require a fallback internal error translation path.

## Follow-up

- Define reason-to-code/status mapping tables per endpoint.
- Add tests covering translation behavior.
