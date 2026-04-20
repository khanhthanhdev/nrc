# Phase 02: Verify flat route skeleton and fill missing leaf pages

## Context Links

- `apps/web/src/routes/__root.tsx`
- `apps/web/src/routeTree.gen.ts`
- `plans/reports/260419-2059-ftc-events-route-research.md`

## Overview

- Priority: P1
- Status: pending
- Objective: verify the existing TanStack file routes for all route zones and fill any missing leaf content with clear public/user/staff separation.

## Key Insights

- Current app already uses flat dot-notation routes for all zones. This phase focuses on verifying the existing skeleton and adding any missing leaf pages.
- Route files must stay thin, mostly delegating to features layer.

## Requirements

### Functional

1. Verify existing `$season` boundary route and nested public event routes.
2. Verify existing `$season.$eventId` boundary route and index.
3. Verify existing public leaf routes for rankings, qualifications, playoffs, awards.
4. Verify existing qualification match detail route `$matchNumber`.
5. Verify existing `/register/$eventId` and `/register/$eventId/$registrationId` routes.
6. Verify existing `/staff` route tree for season/event CRUD pages.
7. Add or refine only missing leaf content; do not convert flat routes to nested directories.

### Non-functional

1. Preserve existing auth/team routes.
2. Keep route files under 200 lines.
3. Keep staff routes isolated under `/staff` namespace.

## Architecture

```text
routes/
  $season.tsx                                    (exists)
  $season.$eventId.tsx                           (exists)
  $season.$eventId.rankings.tsx                  (exists)
  $season.$eventId.qualifications.tsx            (exists)
  $season.$eventId.qualifications.$matchNumber.tsx (exists)
  $season.$eventId.playoffs.tsx                  (exists)
  $season.$eventId.awards.tsx                    (exists)
  register.tsx                                   (exists)
  register.$eventId.tsx                          (exists)
  register.$eventId.$registrationId.tsx          (exists)
  staff.tsx                                      (exists)
  staff.seasons.tsx                              (exists)
  staff.seasons.new.tsx                          (exists)
  staff.seasons.$seasonId.edit.tsx               (exists)
  staff.events.tsx                               (exists)
  staff.events.new.tsx                           (exists)
  staff.events.$eventId.edit.tsx                 (exists)
```

## Related Code Files

- Modify: existing route files above only where leaf content or guard wiring is still missing

## Implementation Steps

1. Add `$season` and `$eventId` boundary routes for public pages using guard helpers.
2. Add `/register` namespace routes with auth guard placeholder.
3. Add `/staff` namespace routes with staff-role guard placeholder.
4. Add or refine leaf pages rendering distinct headings and route-specific context.
5. Generate route tree and verify full paths.
6. Confirm no collisions with existing flat routes.

## Todo List

- [ ] Boundary routes created
- [ ] Leaf routes created
- [ ] Register namespace routes created
- [ ] Staff namespace routes created
- [ ] Route tree generation verified
- [ ] Existing route behavior unchanged

## Success Criteria

- All targeted URLs resolve to distinct pages.
- `/staff` routes are isolated from public dynamic routes.
- `routeTree.gen.ts` includes all new nodes.

## Risk Assessment

- Risk: wrong file naming for TanStack Start conventions.
- Mitigation: generate tree immediately and correct naming early.

## Security Considerations

- Boundary routes reject invalid params before leaf rendering.
- Staff routes reject non-staff users in route guard layer.

## Next Steps

- Consolidate guard logic into the existing policy modules.
