# Phase 03: Consolidate guard layer and shared policy helpers

## Context Links

- `plans/reports/260419-2059-ftc-events-route-research.md`
- `apps/web/src/utils/orpc.ts`

## Overview

- Priority: P1
- Status: pending
- Objective: keep route files DRY while consolidating reusable auth/role/ownership logic into the existing shared modules.

## Key Insights

- Guard duplication across routes is a reliability risk; central shared helpers are required.
- The current codebase already has validation and registration access logic in `route-policy.ts`.
- There is no concrete season-specific UI divergence yet, so a resolver or adapter layer is not justified now.

## Requirements

### Functional

1. Keep shared event UI components in `features/events` where they already exist.
2. Consolidate any missing guard or ownership helpers into the existing policy layer instead of creating new duplication.
3. Extend existing `route-guards.ts` only if a route-level auth/staff hook is still missing.
4. Keep registration access decisions in `route-policy.ts`.

### Non-functional

1. Keep shared helper APIs simple and explicit.
2. Avoid dynamic import complexity unless needed for bundle split.
3. Keep guard logic centralized to avoid policy drift.

## Architecture

```text
features/events/
  public-event-shell.tsx

lib/
  route-guards.ts        (extend only if needed)
  route-policy.ts        (already has canWriteRegistration, canReadRegistration)

Route page -> shared component / route-policy helper -> rendered page
Route beforeLoad -> guard helper -> allow/redirect/forbidden
```

## Related Code Files

- Modify: `apps/web/src/lib/route-guards.ts` only if an auth/staff hook still needs to be added
- Modify: `apps/web/src/lib/route-policy.ts` for any missing ownership or canonicalization helper
- Modify: existing public event route files only if they need to consume the shared helpers more directly

## Implementation Steps

1. Reuse the existing shared event shell and route-policy helpers instead of introducing a resolver layer.
2. Add or refine any missing access helper in the shared policy module.
3. Keep route guards focused on auth and staff redirects.
4. Refactor route leaves and `/register`, `/staff` routes only where they still duplicate shared checks.
5. Preserve the existing read-only registration behavior for non-owner team members.

## Todo List

- [ ] Shared helper reuse confirmed
- [ ] Guard helpers consolidated
- [ ] Route leaves and protected routes consume shared helpers
- [ ] Registration read-only policy for non-owner team members preserved

## Success Criteria

- Guards are reusable and used by all protected route zones.
- Non-owner team members can open registration detail in read-only mode.
- Shared helpers cover all route-level validation and access behavior without a resolver layer.

## Risk Assessment

- Risk: too much indirection for small codebase.
- Mitigation: keep logic in the existing shared modules, avoid a resolver until a concrete divergence exists.
- Risk: frontend guard rules drift from backend authorization.
- Mitigation: same permission matrix mirrored in server oRPC authorization layer.

## Security Considerations

- Shared helper logic does not trust user input beyond pre-validated route params.
- Guards do not replace server checks; backend remains source of truth.

## Next Steps

- Wire navigation and staff/team entry points in shell/header.
