# ADR-004: Sync Rollout Order and Prerequisite Gate

- Status: Accepted
- Date: 2026-04-18

## Context

Team priority is to complete other core features before starting sync implementation.

We still need decision-complete sync architecture now to avoid ad hoc implementation later.

## Decision

- Complete architecture and contract docs now.
- Defer sync code implementation until prerequisite gate passes.

Prerequisite gate:

1. Auth/session model stable
2. Event identity model stable
3. Core admin event flows stable

Implementation order after gate passes:

1. Machine slice first (bootstrap/push/idempotency/publication path)
2. Admin slice second (clients/policy/review)
3. Hardening and observability

## Consequences

- Prevents churn from coupling sync build-out to unstable core foundations.
- Enables immediate implementation kickoff once prerequisites are marked complete.

## Follow-up

- Track prerequisite gate status in planning checklist.
- Start coding only after explicit sign-off.
