# Public Event Live Results UI Wireframe

Route group: `/$season/$eventId`

This wireframe fits the current database schema and current website implementation.

Reference researched:
- `https://ftc-events.firstinspires.org/2025/VNCMP`
- `https://ftc-events.firstinspires.org/2025/VNCMP/practice`
- `https://ftc-events.firstinspires.org/2025/VNCMP/qualifications`
- `https://ftc-events.firstinspires.org/2025/VNCMP/qualifications/1`
- `https://ftc-events.firstinspires.org/2025/VNCMP/rankings`

Current app constraints:
- Current public shell tabs: Rankings, Qualifications, Playoffs, Awards.
- No dedicated public `/practice` route exists yet.
- No dedicated public `/schedule` route exists yet.
- Published match/ranking rows currently expose team numbers, not team names.
- Score detail is available for qualifications and playoffs only.
- Overview page can show practice rows inside "Schedule" because `listPublicMatches` can return all phases.

## 1. Current Data Contract

### `published_match`

Public API: `orpc.event.listPublicMatches`

**API Route & Code Details:**
- **Endpoint:** GET `/rpc/event.listPublicMatches`
- **Query params:** `{ season: string, eventCode: string, phase?: "PRACTICE" | "QUALIFICATION" | "PLAYOFF" }`
- **Handler location:** `packages/api/src/features/event/presentation/router.ts:196-198`
- **Handler procedure:** `listPublicMatches` (publicProcedure, no auth required)
- **Application logic:** `packages/api/src/features/event/application/public-event-data.ts:109-135`
- **Client call:** `orpc.event.listPublicMatches.useQuery({ season, eventCode, phase })`
- **Query options:** `orpc.event.listPublicMatches.queryOptions({ input: { season, eventCode, phase } })`
- **Refetch interval:** 30 seconds (configured in route components)
- **Error handling:** Returns ORPCError "NOT_FOUND" if event not public
- **Response transforms:** Raw DB rows → `PublicMatchItem[]` via `mapPublicMatch()` helper

**Database query:**
```typescript
// From public-event-data.ts:123-126
const rows = await db
  .select()
  .from(publishedMatch)
  .where(and(
    eq(publishedMatch.eventKey, eventKey),
    isNull(publishedMatch.deletedAt),
    phase ? eq(publishedMatch.phase, phase) : undefined
  ));
```

**Sorting logic:**
```typescript
// From public-event-data.ts:128-134
return rows
  .map(mapPublicMatch)
  .toSorted((a, b) =>
    (PHASE_SORT_ORDER[a.phase] ?? 9) - (PHASE_SORT_ORDER[b.phase] ?? 9) ||
    a.sequenceNumber - b.sequenceNumber
  );
// PHASE_SORT_ORDER: QUALIFICATION=0, PLAYOFF=1, PRACTICE=2
```

**Response contract:**
```text
eventKey            -> `${season}/${eventCode}`
matchKey            -> "P1", "Q1", "E1", etc.
phase               -> PRACTICE | QUALIFICATION | PLAYOFF
redAlliance         -> string[] team numbers
blueAlliance        -> string[] team numbers
redScore            -> number | null
blueScore           -> number | null
resultStatus        -> string | null
scheduledStartAt    -> ISO string | null
playedAt            -> ISO string | null
field               -> string | null
details             -> JSON score breakdown | null
sequenceNumber      -> number (parsed from matchKey)
```

### `published_ranking`

Public API: `orpc.event.listPublicRankings`

**API Route & Code Details:**
- **Endpoint:** GET `/rpc/event.listPublicRankings`
- **Query params:** `{ season: string, eventCode: string }`
- **Handler location:** `packages/api/src/features/event/presentation/router.ts:200-202`
- **Handler procedure:** `listPublicRankings` (publicProcedure, no auth required)
- **Application logic:** `packages/api/src/features/event/application/public-event-data.ts:172-197`
- **Client call:** `orpc.event.listPublicRankings.useQuery({ season, eventCode })`
- **Query options:** `orpc.event.listPublicRankings.queryOptions({ input: { season, eventCode } })`
- **Refetch interval:** 30 seconds (configured in route components)
- **Error handling:** Returns ORPCError "NOT_FOUND" if event not public
- **Response transforms:** Raw DB rows → `PublicRankingItem[]` via inline mapping

**Database query:**
```typescript
// From public-event-data.ts:179-183
const rows = await db
  .select()
  .from(publishedRanking)
  .where(and(
    eq(publishedRanking.eventKey, eventKey),
    isNull(publishedRanking.deletedAt)
  ))
  .orderBy(asc(publishedRanking.rank));
```

**Response contract:**
```text
teamNumber          -> string
rank                -> number
wins/losses/ties    -> number
matchesPlayed       -> number
summary             -> JSON ranking summary | null
details             -> JSON ranking detail | null
```

### `published_award`

Public API: `orpc.event.listPublicAwards`

**API Route & Code Details:**
- **Endpoint:** GET `/rpc/event.listPublicAwards`
- **Query params:** `{ season: string, eventCode: string }`
- **Handler location:** `packages/api/src/features/event/presentation/router.ts:192-194`
- **Handler procedure:** `listPublicAwards` (publicProcedure, no auth required)
- **Application logic:** `packages/api/src/features/event/application/public-event-data.ts:203-225`
- **Client call:** `orpc.event.listPublicAwards.useQuery({ season, eventCode })`
- **Query options:** `orpc.event.listPublicAwards.queryOptions({ input: { season, eventCode } })`
- **Refetch interval:** 30 seconds (configured in route components)
- **Error handling:** Returns ORPCError "NOT_FOUND" if event not public
- **Response transforms:** Raw DB rows → `PublicAwardItem[]` via inline mapping

**Database query:**
```typescript
// From public-event-data.ts:210-214
const rows = await db
  .select()
  .from(publishedAward)
  .where(and(
    eq(publishedAward.eventKey, eventKey),
    isNull(publishedAward.deletedAt)
  ))
  .orderBy(asc(publishedAward.awardKey));
```

**Response contract:**
```text
awardKey            -> string
awardName           -> string
teamNumber          -> string | null
recipientName       -> string | null
comment             -> string | null
```

### `event` (public event info)

Public API: `orpc.event.getPublicEvent`

**API Route & Code Details:**
- **Endpoint:** GET `/rpc/event.getPublicEvent`
- **Query params:** `{ season: string, eventCode: string }`
- **Handler location:** `packages/api/src/features/event/presentation/router.ts:138-140`
- **Handler procedure:** `getPublicEvent` (publicProcedure, no auth required)
- **Application logic:** `packages/api/src/features/event/application/event.ts` (getPublicEventBySeasonAndCode)
- **Client call:** `orpc.event.getPublicEvent.useQuery({ season, eventCode })`
- **Query options:** `orpc.event.getPublicEvent.queryOptions({ input: { season, eventCode } })`
- **Refetch interval:** None (event info doesn't change frequently)
- **Error handling:** Returns ORPCError "NOT_FOUND" if event not public
- **Response transforms:** Raw DB row → PublicEventInfo with documents array

**Database query:**
```typescript
// From event.ts (getPublicEventBySeasonAndCode)
const [event] = await db
  .select()
  .from(eventTable)
  .where(and(
    eq(eventTable.season, season),
    eq(eventTable.eventCode, eventCode),
    isNull(eventTable.deletedAt),
    inArray(eventTable.status, PUBLIC_EVENT_STATUSES)
  ))
  .limit(1);
```

**Response contract:**
```text
eventKey            -> `${season}/${eventCode}`
season              -> string
eventCode           -> string
eventName           -> string
description         -> string | null
status              -> string (one of PUBLIC_EVENT_STATUSES)
startDate           -> ISO string | null
endDate             -> ISO string | null
venue               -> string | null
location            -> string | null
documents           -> Array<{ id: string, title: string, url: string }>
```

## 2. Public Event Shell

Current component: `PublicEventShell`

Route group:
- `/$season/$eventId`
- `/$season/$eventId/rankings`
- `/$season/$eventId/qualifications`
- `/$season/$eventId/qualifications/$matchNumber`
- `/$season/$eventId/playoffs`
- `/$season/$eventId/playoffs/$matchNumber`
- `/$season/$eventId/awards`

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
|                                                                             |
|  PUBLIC EVENT                                                               |
|  Vietnam Championship 2026                                                  |
|  2026 / VNCMP                                                               |
|                                                                             |
|  [ rankings ] [ qualifications ] [ playoffs ] [ awards ]                    |
|  -------------------------------------------------------------------------  |
|                                                                             |
|  <Route content renders here>                                               |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## 3. Overview Hub

Route: `/$season/$eventId`

**Route file:** `apps/web/src/routes/{-$locale}/$season.$eventId.tsx` (388 lines)

**Data sources & API calls:**
```typescript
// From $season.$eventId.tsx:26-48
const eventQuery = useQuery({
  ...orpc.event.getPublicEvent.queryOptions({
    input: { eventCode: eventId, season },
  }),
  enabled: isValidRoute,
  retry: false,
});

const matchesQuery = useQuery({
  ...orpc.event.listPublicMatches.queryOptions({
    input: { eventCode: eventId, season },
  }),
  enabled: isValidRoute,
  refetchInterval: 30_000,  // 30 seconds
  retry: false,
});

const rankingsQuery = useQuery({
  ...orpc.event.listPublicRankings.queryOptions({
    input: { eventCode: eventId, season },
  }),
  enabled: isValidRoute,
  refetchInterval: 30_000,  // 30 seconds
  retry: false,
});
```

**API Route & Code Details:**
- **Event info:**
  - Endpoint: GET `/rpc/event.getPublicEvent`
  - Handler: `packages/api/src/features/event/presentation/router.ts:138-140`
  - Application logic: `packages/api/src/features/event/application/event.ts`
  - Client call: `orpc.event.getPublicEvent.useQuery({ season, eventCode })`
  - No refetch interval (static event data)

- **Matches:**
  - Endpoint: GET `/rpc/event.listPublicMatches`
  - Handler: `packages/api/src/features/event/presentation/router.ts:196-198`
  - Application logic: `packages/api/src/features/event/application/public-event-data.ts:109-135`
  - Client call: `orpc.event.listPublicMatches.useQuery({ season, eventCode })`
  - Refetch interval: 30 seconds
  - Returns all phases (PRACTICE, QUALIFICATION, PLAYOFF)

- **Rankings:**
  - Endpoint: GET `/rpc/event.listPublicRankings`
  - Handler: `packages/api/src/features/event/presentation/router.ts:200-202`
  - Application logic: `packages/api/src/features/event/application/public-event-data.ts:172-197`
  - Client call: `orpc.event.listPublicRankings.useQuery({ season, eventCode })`
  - Refetch interval: 30 seconds

**Component locations:**
- **Event info:** Inline rendering in `$season.$eventId.tsx:109-127`
- **Quick links:** Inline rendering in `$season.$eventId.tsx:130-162`
- **Schedule:** Inline rendering in `$season.$eventId.tsx:163-222`
- **Match results:** `PublicMatchesTable` in `apps/web/src/features/events/public-event-data.tsx`
- **Ranking snapshot:** Inline rendering in `$season.$eventId.tsx:270-330`
- **All public matches:** `PublicMatchesTable` in `apps/web/src/features/events/public-event-data.tsx`
- **Documents:** Inline rendering in `$season.$eventId.tsx:360-377`

**Data processing logic:**
```typescript
// From $season.$eventId.tsx:79-103
const qualificationCount = matches.filter((match) => match.phase === "QUALIFICATION").length;
const playoffCount = matches.filter((match) => match.phase === "PLAYOFF").length;
const postedCount = matches.filter(
  (match) => match.redScore !== null || match.blueScore !== null,
).length;

const qualificationMatches = matches.filter((match) => match.phase === "QUALIFICATION");
const playoffMatches = matches.filter((match) => match.phase === "PLAYOFF");

const latestResults = matches
  .filter((match) => match.redScore !== null || match.blueScore !== null)
  .toSorted((left, right) => {
    const leftTime = new Date(left.playedAt ?? left.scheduledStartAt ?? 0).getTime();
    const rightTime = new Date(right.playedAt ?? right.scheduledStartAt ?? 0).getTime();
    return rightTime - leftTime;  // Most recent first
  })
  .slice(0, 6);  // Top 6 results

const upcomingMatches = matches
  .filter(
    (match) => match.scheduledStartAt && match.redScore === null && match.blueScore === null,
  )
  .toSorted(
    (left, right) =>
      new Date(left.scheduledStartAt ?? 0).getTime() -
      new Date(right.scheduledStartAt ?? 0).getTime(),
  )
  .slice(0, 5);  // Top 5 upcoming
```

**Route validation:**
```typescript
// From $season.$eventId.tsx:24-25
const { eventId, season } = useParams({ from: "/{-$locale}/$season/$eventId" });
const isValidRoute = isValidSeason(season) && isValidEventId(eventId);
```

**Error handling:**
```typescript
// From $season.$eventId.tsx:50-76
if (!isValidRoute) {
  return <div>Invalid public route</div>;
}

if (eventQuery.isLoading) {
  return <div>Loading event...</div>;
}

if (eventQuery.error || !eventQuery.data) {
  return <div>Event not found</div>;
}
```

**Conditional rendering:**
```typescript
// From $season.$eventId.tsx:107
{stripLocaleFromPathname(pathname) === `/${season}/${eventId}` ? (
  <div className="grid gap-4 md:grid-cols-2">
    {/* Overview content */}
  </div>
) : (
  <Outlet />  // Child routes render here
)}
```

Current overview sections:
- Event info
- Quick links
- Schedule
- Match results
- Ranking snapshot
- All public matches
- Documents

```ascii
+-----------------------------------------------------------------------------+
|  PUBLIC EVENT                                                               |
|  Vietnam Championship 2026                                                  |
|  2026 / VNCMP                                                               |
|                                                                             |
|  [ rankings ] [ qualifications ] [ playoffs ] [ awards ]                    |
|  -------------------------------------------------------------------------  |
|                                                                             |
|  +-----------------------------------+  +----------------------------------+ |
|  | Event info                       |  | Quick links                      | |
|  | Event details from staff.        |  | [rankings] [qualifications]     | |
|  |                                  |  | [playoffs] [awards]             | |
|  | Qualifications  48               |  +----------------------------------+ |
|  | Playoffs        12                                                     | |
|  | Posted          60                                                     | |
|  +-----------------------------------+                                     | |
|                                                                             |
|  ## Schedule                                                                 |
|  Upcoming matches from published event schedule.                             |
|                                                                             |
|  +------------------------------------------------------------------------+ |
|  | Q49                         TBD vs TBD                                  | |
|  | Scheduled: Feb 1, 12:50 PM                                             | |
|  | Red:  24751 34037                                                      | |
|  | Blue: 28668 23321                                                      | |
|  +------------------------------------------------------------------------+ |
|  | P10                         TBD vs TBD                                  | |
|  | Scheduled: Feb 1, 1:05 PM                                              | |
|  | Red:  32360 33935                                                      | |
|  | Blue: 28731 25258                                                      | |
|  +------------------------------------------------------------------------+ |
|                                                                             |
|  ## Match results                                                            |
|  Published qualification and playoff results with links to score breakdowns. |
|                                                                             |
|  +------------------------------------------------------------------------+ |
|  | Match # | Red alliance | Blue alliance | Red score | Blue score | Status |
|  +------------------------------------------------------------------------+ |
|  | Q48     | 28785 32360  | 28789 33854   | 29        | 97         | posted |
|  | Q47     | 34037 33935  | 33946 25266   | 145       | 41         | posted |
|  | E3      | 24751 33935  | 33947 26749   | 144       | 130        | posted |
|  +------------------------------------------------------------------------+ |
|                                                                             |
|  ## Rankings                                                                 |
|  Current qualification ranking snapshot from published event data.           |
|                                                                             |
|  +----------------------+ +----------------------+ +----------------------+  |
|  | Rank 1               | | Rank 2               | | Rank 3               |  |
|  | Team 24751           | | Team 33935           | | Team 25209           |  |
|  | 5-0-0, 5 played      | | 5-0-0, 5 played      | | 4-1-0, 5 played      |  |
|  | QS: 4.00             | | QS: 3.40             | | QS: 3.00             |  |
|  +----------------------+ +----------------------+ +----------------------+  |
|                                                                             |
|  ## All public matches                                                       |
|                                                                             |
|  Qualifications                                                              |
|  +------------------------------------------------------------------------+ |
|  | Match # | Red alliance | Blue alliance | Red score | Blue score | Status |
|  +------------------------------------------------------------------------+ |
|  | Q1      | 21300 28668  | 33935 34276   | 84        | 162        | posted |
|  | Q2      | 34052 23400  | 32900 33946   | 71        | 72         | posted |
|  +------------------------------------------------------------------------+ |
|                                                                             |
|  Playoffs                                                                    |
|  +------------------------------------------------------------------------+ |
|  | Match # | Red alliance | Blue alliance | Red score | Blue score | Status |
|  +------------------------------------------------------------------------+ |
|  | E1      | 24751 33935  | 25209 32807   | 171       | 98         | posted |
|  | E2      | 24751 33935  | 33947 26749   | TBD       | TBD        | scheduled |
|  +------------------------------------------------------------------------+ |
|                                                                             |
|  ## Documents                                                                |
|  [ Event Guide ] [ Rules ] [ Venue Map ]                                    |
|                                                                             |
+-----------------------------------------------------------------------------+
```

Implementation fit:
- Schedule area includes practice, qualification, and playoff rows if they are upcoming.
- Match results area uses `PublicMatchesTable` with `detailRoute="auto"`.
- All public matches section currently shows qualifications and playoffs only.
- Practice exists in API data but not in the current tab layout. Keep practice in Schedule until a `/practice` route is added.

## 4. Qualifications Page

Route: `/$season/$eventId/qualifications`

**Route file:** `apps/web/src/routes/{-$locale}/$season.$eventId.qualifications.tsx`

**Data source & API call:**
```typescript
const matchesQuery = useQuery({
  ...orpc.event.listPublicMatches.queryOptions({
    input: { eventCode: eventId, season, phase: "QUALIFICATION" },
  }),
  enabled: isValidRoute,
  refetchInterval: 30_000,  // 30 seconds
  retry: false,
});
```

**API Route & Code Details:**
- **Endpoint:** GET `/rpc/event.listPublicMatches`
- **Query params:** `{ season: string, eventCode: string, phase: "QUALIFICATION" }`
- **Handler location:** `packages/api/src/features/event/presentation/router.ts:196-198`
- **Handler procedure:** `listPublicMatches` (publicProcedure, no auth required)
- **Application logic:** `packages/api/src/features/event/application/public-event-data.ts:109-135`
- **Client call:** `orpc.event.listPublicMatches.useQuery({ season, eventCode, phase: "QUALIFICATION" })`
- **Query options:** `orpc.event.listPublicMatches.queryOptions({ input: { season, eventCode, phase: "QUALIFICATION" } })`
- **Refetch interval:** 30 seconds
- **Error handling:** Returns ORPCError "NOT_FOUND" if event not public
- **Component:** `PublicMatchesTable` in `apps/web/src/features/events/public-event-data.tsx`

**Database query with phase filter:**
```typescript
// From public-event-data.ts:117-121
const conditions = [
  eq(publishedMatch.eventKey, eventKey),
  isNull(publishedMatch.deletedAt)
];

if (phase) {
  conditions.push(eq(publishedMatch.phase, phase));  // phase: "QUALIFICATION"
}
```

**Component props:**
```typescript
<PublicMatchesTable
  detailLinks
  detailRoute="qualifications"
  emptyMessage="No qualification matches published yet."
  eventId={eventId}
  matches={matchesQuery.data ?? []}
  season={season}
/>
```

**Table columns rendered:**
- Match # (links to detail page)
- Red alliance (team numbers)
- Blue alliance (team numbers)
- Red score
- Blue score
- Status

Current rendered table:
- Match #
- Red alliance
- Blue alliance
- Red score
- Blue score
- Status

```ascii
+-----------------------------------------------------------------------------+
|  PUBLIC EVENT                                                               |
|  Vietnam Championship 2026                                                  |
|  [ rankings ] [ qualifications ] [ playoffs ] [ awards ]                    |
|  -------------------------------------------------------------------------  |
|                                                                             |
|  ## Qualifications                                                           |
|  Qualification schedule and results from the synced published match table.   |
|                                                                             |
|  +------------------------------------------------------------------------+ |
|  | Match # | Red alliance | Blue alliance | Red score | Blue score | Status |
|  +------------------------------------------------------------------------+ |
|  | Q1      | 21300 28668  | 33935 34276   | 84        | 162        | posted |
|  | Q2      | 34052 23400  | 32900 33946   | 71        | 72         | posted |
|  | Q3      | 25266 28785  | 33947 25209   | 94        | 149        | posted |
|  +------------------------------------------------------------------------+ |
|                                                                             |
|  Match # links to `/$season/$eventId/qualifications/$matchNumber`.           |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## 5. Qualification Match Detail

Route: `/$season/$eventId/qualifications/$matchNumber`

**Route file:** `apps/web/src/routes/{-$locale}/$season.$eventId.qualifications.$matchNumber.tsx`

**Data source & API call:**
```typescript
const matchesQuery = useQuery({
  ...orpc.event.listPublicMatches.queryOptions({
    input: { eventCode: eventId, season, phase: "QUALIFICATION" },
  }),
  enabled: isValidRoute,
  refetchInterval: 30_000,  // 30 seconds
  retry: false,
});

// Client-side filtering
const match = matchesQuery.data?.find(
  (m) => m.matchKey === `Q${matchNumber}`
);
```

**API Route & Code Details:**
- **Endpoint:** GET `/rpc/event.listPublicMatches`
- **Query params:** `{ season: string, eventCode: string, phase: "QUALIFICATION" }`
- **Handler location:** `packages/api/src/features/event/presentation/router.ts:196-198`
- **Handler procedure:** `listPublicMatches` (publicProcedure, no auth required)
- **Application logic:** `packages/api/src/features/event/application/public-event-data.ts:109-135`
- **Client call:** `orpc.event.listPublicMatches.useQuery({ season, eventCode, phase: "QUALIFICATION" })`
- **Query options:** `orpc.event.listPublicMatches.queryOptions({ input: { season, eventCode, phase: "QUALIFICATION" } })`
- **Refetch interval:** 30 seconds
- **Component:** `PublicMatchDetail` in `apps/web/src/features/events/public-event-data.tsx`
- **Match filtering:** Client-side filter for `matchKey === Q${matchNumber}`

**Alternative API (single match):**
- **Endpoint:** GET `/rpc/event.getPublicMatchDetail`
- **Query params:** `{ season: string, eventCode: string, matchKey: string }`
- **Handler location:** `packages/api/src/features/event/presentation/router.ts:142-144`
- **Handler procedure:** `getPublicMatchDetail` (publicProcedure, no auth required)
- **Application logic:** `packages/api/src/features/event/application/public-event-data.ts:141-166`
- **Client call:** `orpc.event.getPublicMatchDetail.useQuery({ season, eventCode, matchKey: `Q${matchNumber}` })`
- **Note:** Currently not used in UI, but available for future optimization

**Component rendering:**
```typescript
<PublicMatchDetail
  match={match}
  season={season}
  eventId={eventId}
  phase="qualifications"
/>
```

**Rendered detail sections:**
- Red/blue alliance team number chips
- Red/blue scores
- Status, scheduled time, played time, field
- Red/blue score breakdown cards (if `details` JSON exists)
- "No scoring breakdown published" message if `details` is null

**Score detail JSON parsing:**
```typescript
// From public-event-data.ts helper functions
const redDetails = match.details?.redAlliance ?? match.details?.red;
const blueDetails = match.details?.blueAlliance ?? match.details?.blue;

// Known keys for score breakdown:
// - aSecondTierFlags, aFirstTierFlags, aCenterFlags, scoreA
// - bCenterFlagDown, bBaseFlagsDown, scoreB
// - cOpponentBackfieldBullets, scoreC
// - dRobotParkState, dGoldFlagsDefended, scoreD, scoreTotal
```

Current rendered detail:
- Red/blue alliance team number chips
- Red/blue scores
- Status, scheduled time, played time, field
- Red/blue score breakdown cards

```ascii
+-----------------------------------------------------------------------------+
|  ## Qualification Q1                                                         |
|  Full match score breakdown from published event data.                       |
|                                                                             |
|  +----------------------------------+  +----------------------------------+  |
|  | RED                              |  | BLUE                             |  |
|  | 21300 28668                      |  | 33935 34276                      |  |
|  | Score: 84                        |  | Score: 162                       |  |
|  +----------------------------------+  +----------------------------------+  |
|                                                                             |
|  +------------------------------------------------------------------------+ |
|  | Status      posted                                                    | |
|  | Scheduled   Jan 31, 4:02 PM                                           | |
|  | Played      Jan 31, 4:10 PM                                           | |
|  | Field       Field 1                                                   | |
|  +------------------------------------------------------------------------+ |
|                                                                             |
|  +----------------------------------+  +----------------------------------+  |
|  | Red alliance breakdown            |  | Blue alliance breakdown           |  |
|  | Section A  flags                  |  | Section A  flags                  |  |
|  |   2 second-tier, 1 first-tier     |  |   4 second-tier, 3 first-tier     |  |
|  |   scoreA: 24                      |  |   scoreA: 62                      |  |
|  | Section B  base                   |  | Section B  base                   |  |
|  |   1 center down, 2 base down      |  |   1 center down, 3 base down      |  |
|  |   scoreB: 15                      |  |   scoreB: 30                      |  |
|  | Section C  bullets                |  | Section C  bullets                |  |
|  |   3 opponent backfield bullets    |  |   6 opponent backfield bullets    |  |
|  |   scoreC: 12                      |  |   scoreC: 24                      |  |
|  | Section D  endgame                |  | Section D  endgame                |  |
|  |   park 1, gold flags 0            |  |   park 2, gold flags 1            |  |
|  |   scoreD: 33                      |  |   scoreD: 46                      |  |
|  | Published total: 84               |  | Published total: 162              |  |
|  +----------------------------------+  +----------------------------------+  |
|                                                                             |
|  If no `details` JSON exists, show: "No scoring breakdown published."        |
|                                                                             |
+-----------------------------------------------------------------------------+
```

Score detail JSON expectation:
- Current helper reads `details.redAlliance` or `details.red`.
- Current helper reads `details.blueAlliance` or `details.blue`.
- Known keys: `aSecondTierFlags`, `aFirstTierFlags`, `aCenterFlags`, `scoreA`, `bCenterFlagDown`, `bBaseFlagsDown`, `scoreB`, `cOpponentBackfieldBullets`, `scoreC`, `dRobotParkState`, `dGoldFlagsDefended`, `scoreD`, `scoreTotal`.

## 6. Rankings Page

Route: `/$season/$eventId/rankings`

**Route file:** `apps/web/src/routes/{-$locale}/$season.$eventId.rankings.tsx`

**Data source & API call:**
```typescript
const rankingsQuery = useQuery({
  ...orpc.event.listPublicRankings.queryOptions({
    input: { eventCode: eventId, season },
  }),
  enabled: isValidRoute,
  refetchInterval: 30_000,  // 30 seconds
  retry: false,
});
```

**API Route & Code Details:**
- **Endpoint:** GET `/rpc/event.listPublicRankings`
- **Query params:** `{ season: string, eventCode: string }`
- **Handler location:** `packages/api/src/features/event/presentation/router.ts:200-202`
- **Handler procedure:** `listPublicRankings` (publicProcedure, no auth required)
- **Application logic:** `packages/api/src/features/event/application/public-event-data.ts:172-197`
- **Client call:** `orpc.event.listPublicRankings.useQuery({ season, eventCode })`
- **Query options:** `orpc.event.listPublicRankings.queryOptions({ input: { season, eventCode } })`
- **Refetch interval:** 30 seconds
- **Error handling:** Returns ORPCError "NOT_FOUND" if event not public
- **Component:** `PublicRankingsTable` in `apps/web/src/features/events/public-event-data.tsx`

**Database query:**
```typescript
// From public-event-data.ts:179-183
const rows = await db
  .select()
  .from(publishedRanking)
  .where(and(
    eq(publishedRanking.eventKey, eventKey),
    isNull(publishedRanking.deletedAt)
  ))
  .orderBy(asc(publishedRanking.rank));  // Ordered by rank ascending
```

**Component props:**
```typescript
<PublicRankingsTable
  emptyMessage="No rankings published yet."
  rankings={rankingsQuery.data ?? []}
/>
```

**Table columns rendered:**
- Rank
- Team #
- W-L-T (wins-losses-ties)
- Played
- QS (Qualifying Score)

**QS (Qualifying Score) extraction logic:**
```typescript
// From public-event-data.ts helper function
export const getRankingQualifyingScore = (ranking: PublicRankingItem): string => {
  const summary = ranking.summary ?? {};
  const details = ranking.details ?? {};

  // Try multiple possible keys in order of preference
  const qs =
    summary.qualifyingScore ??
    summary.qualificationScore ??
    summary.rankingPoint ??
    summary.rankingPoints ??
    summary.qs ??
    summary.total ??
    details.qualifyingScore ??
    details.qualificationScore ??
    details.rankingPoint ??
    details.rankingPoints ??
    details.qs ??
    details.total;

  return qs != null ? String(qs) : "-";
};
```

Current rendered table:
- Rank
- Team #
- W-L-T
- Played
- QS

```ascii
+-----------------------------------------------------------------------------+
|  PUBLIC EVENT                                                               |
|  Vietnam Championship 2026                                                  |
|  [ rankings ] [ qualifications ] [ playoffs ] [ awards ]                    |
|  -------------------------------------------------------------------------  |
|                                                                             |
|  ## Rankings                                                                 |
|  Team ranking data from the synced qualification ranking snapshot.           |
|                                                                             |
|  +--------------------------------------------------------------+           |
|  | Rank | Team # | W-L-T | Played | QS                          |           |
|  +--------------------------------------------------------------+           |
|  | 1    | 24751  | 5-0-0 | 5      | 4.00                        |           |
|  | 2    | 33935  | 5-0-0 | 5      | 3.40                        |           |
|  | 3    | 25209  | 4-1-0 | 5      | 3.00                        |           |
|  | 4    | 32807  | 4-1-0 | 5      | 3.00                        |           |
|  | 5    | 33947  | 4-1-0 | 5      | 3.00                        |           |
|  +--------------------------------------------------------------+           |
|                                                                             |
+-----------------------------------------------------------------------------+
```

QS source:
- `summary.qualifyingScore`
- `summary.qualificationScore`
- `summary.rankingPoint`
- `summary.rankingPoints`
- `summary.qs`
- `summary.total`
- Fallback to same keys in `details`.
- If missing, show `-`.

## 7. Playoffs Page

Route: `/$season/$eventId/playoffs`

**Route file:** `apps/web/src/routes/{-$locale}/$season.$eventId.playoffs.tsx`

**Data source & API call:**
```typescript
const matchesQuery = useQuery({
  ...orpc.event.listPublicMatches.queryOptions({
    input: { eventCode: eventId, season, phase: "PLAYOFF" },
  }),
  enabled: isValidRoute,
  refetchInterval: 30_000,  // 30 seconds
  retry: false,
});
```

**API Route & Code Details:**
- **Endpoint:** GET `/rpc/event.listPublicMatches`
- **Query params:** `{ season: string, eventCode: string, phase: "PLAYOFF" }`
- **Handler location:** `packages/api/src/features/event/presentation/router.ts:196-198`
- **Handler procedure:** `listPublicMatches` (publicProcedure, no auth required)
- **Application logic:** `packages/api/src/features/event/application/public-event-data.ts:109-135`
- **Client call:** `orpc.event.listPublicMatches.useQuery({ season, eventCode, phase: "PLAYOFF" })`
- **Query options:** `orpc.event.listPublicMatches.queryOptions({ input: { season, eventCode, phase: "PLAYOFF" } })`
- **Refetch interval:** 30 seconds
- **Error handling:** Returns ORPCError "NOT_FOUND" if event not public
- **Component:** `PublicMatchesTable` in `apps/web/src/features/events/public-event-data.tsx` (shared with qualifications)

**Database query with phase filter:**
```typescript
// From public-event-data.ts:117-121
const conditions = [
  eq(publishedMatch.eventKey, eventKey),
  isNull(publishedMatch.deletedAt)
];

if (phase) {
  conditions.push(eq(publishedMatch.phase, phase));  // phase: "PLAYOFF"
}
```

**Component props:**
```typescript
<PublicMatchesTable
  detailLinks
  detailRoute="playoffs"
  emptyMessage="No playoff matches published yet."
  eventId={eventId}
  matches={matchesQuery.data ?? []}
  season={season}
/>
```

**Table columns rendered:**
- Match # (links to detail page)
- Red alliance (team numbers)
- Blue alliance (team numbers)
- Red score
- Blue score
- Status

**Note:** Layout is identical to qualifications page, only the phase filter differs.

Current rendered table matches the qualifications table.

```ascii
+-----------------------------------------------------------------------------+
|  ## Playoffs                                                                 |
|  Playoff schedule and results from the synced published match table.         |
|                                                                             |
|  +------------------------------------------------------------------------+ |
|  | Match # | Red alliance | Blue alliance | Red score | Blue score | Status |
|  +------------------------------------------------------------------------+ |
|  | E1      | 24751 33935  | 25209 32807   | 171       | 98         | posted |
|  | E2      | 24751 33935  | 33947 26749   | TBD       | TBD        | scheduled |
|  +------------------------------------------------------------------------+ |
|                                                                             |
|  Match # links to `/$season/$eventId/playoffs/$matchNumber`.                 |
+-----------------------------------------------------------------------------+
```

## 8. Playoff Match Detail

Route: `/$season/$eventId/playoffs/$matchNumber`

**Route file:** `apps/web/src/routes/{-$locale}/$season.$eventId.playoffs.$matchNumber.tsx`

**Data source & API call:**
```typescript
const matchesQuery = useQuery({
  ...orpc.event.listPublicMatches.queryOptions({
    input: { eventCode: eventId, season, phase: "PLAYOFF" },
  }),
  enabled: isValidRoute,
  refetchInterval: 30_000,  // 30 seconds
  retry: false,
});

// Client-side filtering
const match = matchesQuery.data?.find(
  (m) => m.matchKey === `E${matchNumber}` || m.sequenceNumber === Number(matchNumber)
);
```

**API Route & Code Details:**
- **Endpoint:** GET `/rpc/event.listPublicMatches`
- **Query params:** `{ season: string, eventCode: string, phase: "PLAYOFF" }`
- **Handler location:** `packages/api/src/features/event/presentation/router.ts:196-198`
- **Handler procedure:** `listPublicMatches` (publicProcedure, no auth required)
- **Application logic:** `packages/api/src/features/event/application/public-event-data.ts:109-135`
- **Client call:** `orpc.event.listPublicMatches.useQuery({ season, eventCode, phase: "PLAYOFF" })`
- **Query options:** `orpc.event.listPublicMatches.queryOptions({ input: { season, eventCode, phase: "PLAYOFF" } })`
- **Refetch interval:** 30 seconds
- **Component:** `PublicMatchDetail` in `apps/web/src/features/events/public-event-data.tsx` (shared with qualifications)
- **Match filtering:** Client-side filter for `matchKey === E${matchNumber}` or `sequenceNumber === matchNumber`

**Alternative API (single match):**
- **Endpoint:** GET `/rpc/event.getPublicMatchDetail`
- **Query params:** `{ season: string, eventCode: string, matchKey: string }`
- **Handler location:** `packages/api/src/features/event/presentation/router.ts:142-144`
- **Handler procedure:** `getPublicMatchDetail` (publicProcedure, no auth required)
- **Application logic:** `packages/api/src/features/event/application/public-event-data.ts:141-166`
- **Client call:** `orpc.event.getPublicMatchDetail.useQuery({ season, eventCode, matchKey: `E${matchNumber}` })`
- **Note:** Currently not used in UI, but available for future optimization

**Component rendering:**
```typescript
<PublicMatchDetail
  match={match}
  season={season}
  eventId={eventId}
  phase="playoffs"
/>
```

**Note:** Layout is identical to qualification match detail, only the phase and match key prefix differ.

Layout is identical to qualification match detail.

## 9. Awards Page

Route: `/$season/$eventId/awards`

**Route file:** `apps/web/src/routes/{-$locale}/$season.$eventId.awards.tsx`

**Data source & API call:**
```typescript
const awardsQuery = useQuery({
  ...orpc.event.listPublicAwards.queryOptions({
    input: { eventCode: eventId, season },
  }),
  enabled: isValidRoute,
  refetchInterval: 30_000,  // 30 seconds
  retry: false,
});
```

**API Route & Code Details:**
- **Endpoint:** GET `/rpc/event.listPublicAwards`
- **Query params:** `{ season: string, eventCode: string }`
- **Handler location:** `packages/api/src/features/event/presentation/router.ts:192-194`
- **Handler procedure:** `listPublicAwards` (publicProcedure, no auth required)
- **Application logic:** `packages/api/src/features/event/application/public-event-data.ts:203-225`
- **Client call:** `orpc.event.listPublicAwards.useQuery({ season, eventCode })`
- **Query options:** `orpc.event.listPublicAwards.queryOptions({ input: { season, eventCode } })`
- **Refetch interval:** 30 seconds
- **Error handling:** Returns ORPCError "NOT_FOUND" if event not public
- **Component:** `PublicAwardsTable` in `apps/web/src/features/events/public-event-data.tsx`

**Database query:**
```typescript
// From public-event-data.ts:210-214
const rows = await db
  .select()
  .from(publishedAward)
  .where(and(
    eq(publishedAward.eventKey, eventKey),
    isNull(publishedAward.deletedAt)
  ))
  .orderBy(asc(publishedAward.awardKey));  // Ordered by awardKey ascending
```

**Component props:**
```typescript
<PublicAwardsTable
  emptyMessage="No awards published yet."
  awards={awardsQuery.data ?? []}
/>
```

**Table columns rendered:**
- Award
- Team #
- Recipient
- Comment

**Data display logic:**
- Team # shows team number if `teamNumber` is not null, otherwise shows "-"
- Recipient shows `recipientName` if not null, otherwise shows "-"
- Comment shows `comment` if not null, otherwise shows "-"

Current rendered table:
- Award
- Team #
- Recipient
- Comment

```ascii
+-----------------------------------------------------------------------------+
|  ## Awards                                                                   |
|  Awards and recipients from the synced event awards snapshot.                |
|                                                                             |
|  +------------------------------------------------------------------------+ |
|  | Award                 | Team # | Recipient        | Comment             | |
|  +------------------------------------------------------------------------+ |
|  | Inspire Award Winner  | 24751  | -                | -                   | |
|  | Think Award           | 33935  | -                | -                   | |
|  | Dean's List Finalist  | -      | Student Name     | -                   | |
|  +------------------------------------------------------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## 10. Empty, Loading, Error States

**Component location:** `apps/web/src/features/events/public-event-data.tsx`

**Component:** `PublicDataMessage`

**Props interface:**
```typescript
interface PublicDataMessageProps {
  title: string;
  children?: React.ReactNode;
}
```

**Usage patterns:**

**Loading state:**
```typescript
{matchesQuery.isLoading ? (
  <PublicDataMessage title="Loading schedule..." />
) : null}
```

**Error state:**
```typescript
{matchesQuery.error ? (
  <PublicDataMessage title="Schedule unavailable">
    Try refreshing after the event sync completes.
  </PublicDataMessage>
) : null}
```

**Empty state:**
```typescript
{!matchesQuery.isLoading && !matchesQuery.error && upcomingMatches.length === 0 ? (
  <PublicDataMessage title="No upcoming matches published." />
) : null}
```

**Component implementation:**
```typescript
export const PublicDataMessage = ({ title, children }: PublicDataMessageProps) => {
  return (
    <div className="rounded-2xl border bg-background/60 p-4">
      <p className="text-muted-foreground text-sm">{title}</p>
      {children && <p className="text-muted-foreground mt-1 text-xs">{children}</p>}
    </div>
  );
};
```

**Used by:**
- Overview page (Schedule, Match results, Rankings sections)
- Qualifications page
- Playoffs page
- Awards page
- Rankings page

**Query configuration for all public routes:**
```typescript
const query = useQuery({
  ...orpc.event.listPublicMatches.queryOptions({
    input: { eventCode: eventId, season, phase: "QUALIFICATION" },
  }),
  enabled: isValidRoute,
  refetchInterval: 30_000,  // 30 seconds
  retry: false,  // Don't retry on error to avoid spamming
});
```

```ascii
+-----------------------------------------------------------------------------+
|  Loading schedule...                                                        |
+-----------------------------------------------------------------------------+

+-----------------------------------------------------------------------------+
|  Schedule unavailable                                                       |
|  Try refreshing after the event sync completes.                             |
+-----------------------------------------------------------------------------+

+-----------------------------------------------------------------------------+
|  No qualification matches published yet.                                    |
+-----------------------------------------------------------------------------+
```

## 11. Fit Notes

**Tab list:**
- Keep tab list unchanged unless adding real route files
- Current tabs: Rankings, Qualifications, Playoffs, Awards
- No `/practice` tab exists yet (practice data available in API but not exposed in UI)
- No `/schedule` tab exists yet (schedule shown in overview only)

**Team names:**
- Do not show team names in public match/ranking mockups until API returns team names
- Current API returns team numbers only
- Team name enrichment would require additional API endpoint or data transformation

**Practice matches:**
- Supported by `published_match.phase = PRACTICE`
- Current website has no practice tab
- Display practice only in overview Schedule for now
- Practice matches included in `listPublicMatches` when no phase filter is applied

**Features not yet implemented:**
- Do not show filters, compact mode, or CSV export until implemented
- No search functionality
- No pagination (all results shown in single table)

**Refetch intervals:**
- Matches: 30 seconds (`refetchInterval: 30_000`)
- Rankings: 30 seconds (`refetchInterval: 30_000`)
- Awards: 30 seconds (`refetchInterval: 30_000`)
- Event info: No refetch (static data)

**Event visibility guard:**
- Event must exist in database
- Event must not be deleted (`deletedAt IS NULL`)
- Event status must be in `PUBLIC_EVENT_STATUSES`
- `PUBLIC_EVENT_STATUSES = ["published", "registration_open", "registration_closed", "active", "completed", "archived"]`
- Excludes `"draft"` status
- Implemented in `requirePublicEvent()` helper in `public-event-data.ts:51-69`

**Match sorting:**
- Primary sort: Phase order (QUALIFICATION=0, PLAYOFF=1, PRACTICE=2)
- Secondary sort: Sequence number ascending
- Implemented in `public-event-data.ts:128-134`

**Overview "All public matches" behavior:**
- Intentionally renders qualification and playoff tables only
- Practice matches excluded from this section
- Practice matches shown in Schedule section only

**Route validation:**
- Season must be 4-digit year (validated by `isValidSeason()`)
- Event ID must be valid event code (validated by `isValidEventId()`)
- Validation in `lib/route-policy.ts`

**Error handling:**
- All queries use `retry: false` to avoid spamming on error
- Invalid routes show "Invalid public route" message
- Not found events show "Event not found" message
- Loading states show "Loading [data]..." message
- Error states show "[Data] unavailable" message
- Empty states show "No [data] published yet." message

**Component sharing:**
- `PublicMatchesTable` shared between Qualifications and Playoffs pages
- `PublicMatchDetail` shared between Qualification and Playoff match detail pages
- `PublicDataMessage` shared across all pages for loading/error/empty states

**Data transformation:**
- All dates converted to ISO strings in API responses
- JSON fields (`details`, `summary`) parsed as `Record<string, unknown> | null`
- Team arrays default to empty arrays if null
- Sequence numbers parsed from matchKey (e.g., "Q1" → 1)

## 12. Future Extension Options

**Add `/practice` route:**
- If practice needs a full table like FTC
- Would require new route file: `apps/web/src/routes/{-$locale}/$season.$eventId.practice.tsx`
- API already supports: `orpc.event.listPublicMatches({ phase: "PRACTICE" })`
- Component: Reuse `PublicMatchesTable` with `detailRoute="practice"`
- Match detail route: `/$season/$eventId/practice/$matchNumber`

**Add `/schedule` route:**
- If all phases need a chronological schedule page
- Would require new route file: `apps/web/src/routes/{-$locale}/$season.$eventId.schedule.tsx`
- API already supports: `orpc.event.listPublicMatches()` (all phases)
- Would need custom component to show chronological timeline
- Could include filters for phase, field, team

**Team name enrichment:**
- If public match/ranking tables should show `Team # + name`
- Options:
  1. Add team name to `published_match` and `published_ranking` tables (requires sync changes)
  2. Create new API endpoint that joins with team table
  3. Client-side team name lookup from separate team list API
- Would require database schema changes or additional API endpoints

**Raw JSON score detail tab:**
- If future seasons introduce new scoring keys
- Could add "Raw data" tab to match detail pages
- Would display `details` JSON as formatted code
- Useful for debugging and advanced users

**Real-time updates:**
- Current implementation uses 30-second polling
- Could upgrade to WebSocket or Server-Sent Events (SSE)
- Would require backend infrastructure changes
- Would provide instant updates during live events

**Mobile optimization:**
- Current layout is responsive but could be improved
- Could add mobile-specific views with compact tables
- Could add swipe gestures for navigation between tabs

**Search and filters:**
- Add search by team number across all matches
- Add filters for phase, field, status
- Add date range filters for schedule
- Would require client-side filtering or API changes

**Export functionality:**
- Add CSV export for matches, rankings, awards
- Add PDF export for printable schedules
- Would require client-side generation or API endpoints

**Multi-language support:**
- Current app has i18n infrastructure
- Could translate all public-facing text
- Would require translation files and locale detection

**Accessibility improvements:**
- Add ARIA labels for screen readers
- Add keyboard navigation for tables
- Add high contrast mode support

**Performance optimizations:**
- Implement virtual scrolling for large tables
- Add pagination for rankings (100+ teams)
- Cache API responses more aggressively
- Implement optimistic UI updates

**Analytics:**
- Add page view tracking
- Add user engagement metrics
- Add error tracking and monitoring

## 13. Implementation Guide

**Quick reference for developers implementing public event features.**

### File structure

```
packages/api/src/features/event/
├── presentation/
│   └── router.ts                    # API procedures (lines 138-202)
├── application/
│   ├── public-event-data.ts         # Query logic (lines 109-225)
│   └── event.ts                     # Event queries
└── schemas/
    ├── event.ts                     # Event validation schemas
    └── public-event-data.ts         # Public data validation schemas

apps/web/src/
├── routes/{-$locale}/
│   ├── $season.$eventId.tsx                         # Overview (388 lines)
│   ├── $season.$eventId.rankings.tsx                # Rankings
│   ├── $season.$eventId.qualifications.tsx          # Qualifications
│   ├── $season.$eventId.qualifications.$matchNumber.tsx  # Qualification detail
│   ├── $season.$eventId.playoffs.tsx                # Playoffs
│   ├── $season.$eventId.playoffs.$matchNumber.tsx    # Playoff detail
│   └── $season.$eventId.awards.tsx                  # Awards
├── features/events/
│   └── public-event-data.tsx        # Shared components
└── utils/
    └── orpc.ts                      # ORPC client setup (37 lines)
```

### API procedure reference

| Procedure | Input | Output | Handler Line |
|-----------|-------|--------|---------------|
| `getPublicEvent` | `{ season, eventCode }` | `PublicEventInfo` | 138-140 |
| `listPublicMatches` | `{ season, eventCode, phase? }` | `PublicMatchItem[]` | 196-198 |
| `getPublicMatchDetail` | `{ season, eventCode, matchKey }` | `PublicMatchItem \| null` | 142-144 |
| `listPublicRankings` | `{ season, eventCode }` | `PublicRankingItem[]` | 200-202 |
| `listPublicAwards` | `{ season, eventCode }` | `PublicAwardItem[]` | 192-194 |

### Client query pattern

```typescript
// Standard pattern for all public queries
const query = useQuery({
  ...orpc.event.listPublicMatches.queryOptions({
    input: { eventCode: eventId, season, phase: "QUALIFICATION" },
  }),
  enabled: isValidRoute,
  refetchInterval: 30_000,  // 30 seconds for live data
  retry: false,  // Don't retry on error
});

// Access data
const matches = query.data ?? [];

// Handle states
if (query.isLoading) return <PublicDataMessage title="Loading..." />;
if (query.error) return <PublicDataMessage title="Error">Error message</PublicDataMessage>;
if (matches.length === 0) return <PublicDataMessage title="No data" />;
```

### Route validation

```typescript
// All public routes must validate params
const { eventId, season } = useParams({ from: "/{-$locale}/$season/$eventId" });
const isValidRoute = isValidSeason(season) && isValidEventId(eventId);

// Validation functions in lib/route-policy.ts
isValidSeason(season)      // Must be 4-digit year
isValidEventId(eventId)    // Must be valid event code
```

### Component usage

**PublicMatchesTable:**
```typescript
<PublicMatchesTable
  detailLinks              // Enable match detail links
  detailRoute="auto"       // "auto" | "qualifications" | "playoffs"
  emptyMessage="No matches"
  eventId={eventId}
  matches={matches}
  season={season}
/>
```

**PublicRankingsTable:**
```typescript
<PublicRankingsTable
  emptyMessage="No rankings"
  rankings={rankings}
/>
```

**PublicAwardsTable:**
```typescript
<PublicAwardsTable
  emptyMessage="No awards"
  awards={awards}
/>
```

**PublicMatchDetail:**
```typescript
<PublicMatchDetail
  match={match}
  season={season}
  eventId={eventId}
  phase="qualifications"  // or "playoffs"
/>
```

**PublicDataMessage:**
```typescript
<PublicDataMessage title="Message">
  Optional subtitle
</PublicDataMessage>
```

### Data transformation helpers

```typescript
// Format dates for display
formatPublicEventDateTime(dateString, locale)  // From public-event-data.tsx

// Format scores (handles null)
formatPublicScore(score)  // Returns "TBD" if null, otherwise number

// Extract qualifying score with fallbacks
getRankingQualifyingScore(ranking)  // From public-event-data.tsx
```

### Phase constants

```typescript
// Match phases
type MatchPhase = "PRACTICE" | "QUALIFICATION" | "PLAYOFF";

// Phase sort order (for display)
const PHASE_SORT_ORDER = {
  QUALIFICATION: 0,
  PLAYOFF: 1,
  PRACTICE: 2,
};

// Match key prefixes
const MATCH_KEY_PREFIXES = {
  PRACTICE: "P",
  QUALIFICATION: "Q",
  PLAYOFF: "E",  // Elimination
};
```

### Event status constants

```typescript
// Public event statuses (from event.ts)
const PUBLIC_EVENT_STATUSES = new Set([
  "published",
  "registration_open",
  "registration_closed",
  "active",
  "completed",
  "archived",
]);

// Draft status is NOT public
// Events with status="draft" will return 404
```

### Error handling

```typescript
// API throws ORPCError "NOT_FOUND" for:
// - Event not found
// - Event deleted
// - Event status not public

// Client should handle:
// - query.isLoading → Show loading state
// - query.error → Show error message
// - !query.data → Show empty state
```

### Testing checklist

- [ ] Event with draft status returns 404
- [ ] Deleted event returns 404
- [ ] Invalid season format shows error
- [ ] Invalid event code shows error
- [ ] Qualification matches filter correctly
- [ ] Playoff matches filter correctly
- [ ] Practice matches included in overview schedule
- [ ] Match detail pages load correctly
- [ ] Rankings display in correct order
- [ ] Awards display in correct order
- [ ] Refetch interval works (30 seconds)
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Empty states display correctly
- [ ] Match detail links work
- [ ] Quick links navigate correctly
- [ ] Documents links open in new tab

### Common issues and solutions

**Issue:** Event not found error
- **Solution:** Check event status is in PUBLIC_EVENT_STATUSES
- **Solution:** Check event is not deleted (deletedAt IS NULL)

**Issue:** Matches not loading
- **Solution:** Check eventCode and season are correct
- **Solution:** Check published_match table has data for eventKey

**Issue:** Rankings not showing
- **Solution:** Check published_ranking table has data for eventKey
- **Solution:** Check rankings are ordered by rank ASC

**Issue:** Match detail not found
- **Solution:** Check matchKey format (Q1, E1, etc.)
- **Solution:** Check match exists in published_match table

**Issue:** Scores showing as TBD
- **Solution:** Check redScore and blueScore are not null
- **Solution:** Check match has been played (playedAt not null)

**Issue:** QS showing as -
- **Solution:** Check summary or details JSON has qualifying score
- **Solution:** Check multiple possible key names (qualifyingScore, qs, etc.)
