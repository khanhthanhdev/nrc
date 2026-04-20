# Phase 04: Extend public event shell and navigation entry points

## Context Links

- `apps/web/src/components/header.tsx`
- `apps/web/src/routes/__root.tsx`

## Overview

- Priority: P2
- Status: pending
- Objective: refine the existing public event shell and clear navigation for public/team/staff zones without breaking existing auth UX.

## Key Insights

- Existing header already has Home, Auth, Onboarding, Teams, and conditional Staff links.
- `PublicEventShell` already exists and is wired in `$season.$eventId.tsx`.
- Public season/event routes need discoverable but minimal entry path.
- Staff links must be hidden unless session has staff role.

## Requirements

### Functional

1. Extend existing `PublicEventShell` only as needed for breadcrumb context and improved tab UX.
2. Add or refine a navigation entry to public season/event routes in the header if a discoverable entry is still missing.
3. Add or refine navigation entries for team/register routes.
4. Verify existing conditional staff navigation entry (already implemented).
5. Keep existing auth/team navigation intact.

### Non-functional

1. Avoid hard-coding too many demo links.
2. Keep shell component reusable across leaf routes.
3. Do not expose staff navigation to non-staff users.

## Architecture

```text
$season.$eventId.tsx provides:
- PublicEventShell
- Tab links to child routes
- Outlet for leaf content
```

## Related Code Files

- Modify: `apps/web/src/routes/$season.$eventId.tsx`
- Modify: `apps/web/src/features/events/public-event-shell.tsx`
- Modify: `apps/web/src/components/header.tsx`

## Implementation Steps

1. Extend existing `PublicEventShell` with breadcrumb context and improved tab definitions if needed.
2. Verify existing shell rendering in `$season.$eventId.tsx` around `<Outlet />`.
3. Add minimal header link pattern for public event route if the current header still lacks it.
4. Add team/register entries to header if the current global nav still feels incomplete.
5. Verify existing conditional `/staff` entry (already implemented with `isStaffSystemRole`).
6. Ensure active tab highlighting uses router link state.

## Todo List

- [ ] Event shell component extended
- [ ] Tabs wired to child routes
- [ ] Header entry added
- [ ] Team/register entries added
- [ ] Staff-only nav entry verified (already exists)
- [ ] Existing nav remains functional

## Success Criteria

- Event pages provide consistent shell + tab UX.
- Users can navigate to event section from global header.
- Staff navigation only visible for authorized roles.

## Risk Assessment

- Risk: header gets cluttered early.
- Mitigation: group by route zone and keep one compact entry per zone.

## Security Considerations

- No privileged links exposed in public event shell.
- Staff navigation and quick actions hidden for non-staff sessions.

## Next Steps

- Validate behavior with permission and route-level checks.
