# Phase 05: Validate permissions, routes, and rollout checks

## Context Links

- `package.json` (root scripts)
- `apps/web/package.json`

## Overview

- Priority: P1
- Status: pending
- Objective: lock correctness of route zones, auth/role/ownership guard behavior, and public route contract before wider UI/data implementation.

## Key Insights

- Routing regressions are easy to miss without explicit tests.
- Contract tests for URL validity give stable baseline for future season expansion.
- Authorization regressions are high risk; require route + API parity checks.

## Requirements

### Functional

1. Add tests for valid route resolution.
2. Add tests for invalid params handling.
3. Add tests for shared helper behavior in `route-policy.ts`.
4. Add tests for auth/staff/ownership access rules.

### Non-functional

1. Keep test suite focused and fast.
2. Ensure checks pass with project scripts.

## Architecture

```text
Test layers:
1) Unit: guard/policy helpers
2) Route integration: navigation + rendered leaf
3) Permission integration: staff/user/anonymous behavior by zone
4) Sanity: generated route tree contains expected paths
```

## Related Code Files

- Create: `apps/web/src/lib/route-policy.test.ts`
- Create: `apps/web/src/lib/route-guards.test.ts`
- Create/Modify: route integration tests under `apps/web/src/routes/**` test files

## Implementation Steps

1. Add unit tests for `route-policy.ts` regex/canonicalization edge cases.
2. Add guard tests for `route-guards.ts`:
   - anonymous denied from `/register` and `/staff`
   - normal user denied from `/staff`
   - staff allowed on `/staff`
   - non-owner team member gets read-only access on `/register/:eventId/:registrationId`
   - non-team user denied from `/register/:eventId/:registrationId`
3. Add route integration tests for major paths.
4. Run `bun run check-types` and `bun run check`.

## Todo List

- [ ] Guard tests added
- [ ] Shared helper tests added
- [ ] Route integration tests added
- [ ] Permission behavior tests added
- [ ] Type/lint checks passing
- [ ] Registration read-only permission behavior verified

## Success Criteria

- Valid URLs render correct page.
- Invalid URLs are rejected/redirected as defined.
- Unauthorized users are redirected/blocked per zone policy.
- Non-owner team members have read-only registration detail access, no write actions.
- Shared helper behavior is deterministic and covered by tests.

## Risk Assessment

- Risk: route tests brittle due to generated tree changes.
- Mitigation: assert public paths and rendered semantics, not internals.
- Risk: false confidence if only frontend guards are tested.
- Mitigation: add API authorization tests for corresponding protected operations.

## Security Considerations

- Invalid params never reach data fetching layer in tests.
- Authorization failure paths tested for information leakage and unsafe fallthrough.

## Next Steps

- After passing checks, begin incremental data integration for public pages and registration workflows.
- Confirm old seasons load from persisted DB records without migration breakage.
