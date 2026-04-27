# Season Page Design Guidelines

## 1. Overview and Concept

The `/$season` route serves as a **"mini-landing page"** for a specific competition year. Based on the database schema, it dynamically pulls the theme, game description, documents, and announcements.

## 2. Normal User View (`/$season`)

Route: `/$season` (e.g., `/2026`)
(Header only)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams                Sign in  [CTA] |
+-----------------------------------------------------------------------------+
|                                                                             |
|  [----------------------- Hero Banner (Thematic) -----------------------]   |
|  |                                                                      |   |
|  |   NRC SEASON 2026                                   [ Season Switch v ]  |
|  |   # INTO THE DEEP                                   +-----------------+  |
|  |                                                     | [Search Season] |  |
|  |   "Explore the unknown depths and engineer your way | ----------------|  |
|  |    to victory."                                     | ( ) 2026: ITD   |  |
|  |                                                     | ( ) 2025: SUB   |  |
|  |   [ Watch Game Reveal ]           [ Download Game Manual ]            |  |
|  |                                                     +-----------------+  |
|  [----------------------------------------------------------------------]   |
|                                                                             |
|  [ Events ]  [ Documents ]  [ Announcements ]                               |
|  ~~~~~~~~~~                                                                 |
|                                                                             |
|  ## 2026 Season Events (Vietnam)                                            |
|  -------------------------------------------------------------------------  |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | [Map Icon]  Hanoi Regional Hub                                        |  |
|  |             Oct 10-12, 2026 | Hanoi Innovation Hub                    |  |
|  |             Status: [ Registration Open ]      [ View Details ] [Reg] |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | [Map Icon]  HCMC Regional Hub                                         |  |
|  |             Nov 05-07, 2026 | Saigon Tech Park                        |  |
|  |             Status: [ Upcoming ]               [ View Details ]       |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | [Map Icon]  Da Nang Regional Hub                                      |  |
|  |             Dec 15-17, 2026 | Da Nang Software Park                   |  |
|  |             Status: [ Upcoming ]               [ View Details ]       |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | [Star Icon] STEMese Festival (Season Finale)                          |  |
|  |             Feb 20-22, 2027 | National Convention Center, Hanoi       |  |
|  |             Status: [ To be Announced ]        [ View Details ]       |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
+-----------------------------------------------------------------------------+
|  Footer: Terms | Privacy | Contact                                          |
+-----------------------------------------------------------------------------+
```

### Design Inspiration (Vietnam Context):

- **Localized Scale**: Since NRC Vietnam typically has 3-4 major events, use **wide list cards** instead of a dense grid. This makes the page feel substantial and premium despite having fewer items.
- **Map Focus**: Incorporating a stylized map of Vietnam with markers for the Hubs (Hanoi, HCMC, Da Nang) can add a strong sense of local identity.
- **Finale Highlight**: Use a distinct visual style for the "STEMese Festival" to signify its importance as the season finale.

---

## 3. Staff View (`/staff/seasons`)

Route: `/staff/seasons`
(Header + Sidebar)

### 3.1 Season Listing

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
| STAFF PANEL   |                                                             |
| ────────────  |  # Manage Seasons                                           |
| Overview      |                                                             |
|               |  [ + Create New Season ]                                    |
| CONTENT       |  ----------------------------------------------------       |
| ────────────  |                                                             |
| Seasons (Active)|  ## All Seasons                                           |
| Events        |  +------+-------------------+------------+----------+-------+ |
| Registrations |  | Year | Theme             | Game Code  | Status   | Act.  | |
|               |  +------+-------------------+------------+----------+-------+ |
| ADMINISTRATION|  | 2026 | Into the Deep     | ITD-2026   | [Active] | [Edit]| |
| ────────────  |  | 2025 | Submerged         | SUB-2025   | [Archiv] | [Edit]| |
| Users         |  +------+-------------------+------------+----------+-------+ |
| Sync Logs     |                                                             |
| Settings      |                                                             |
|               |                                                             |
| ────────────  |                                                             |
| ← Back to     |                                                             |
|   Site        |                                                             |
+---------------+-------------------------------------------------------------+
```

### 3.2 Season Editor (Tabs)

Route: `/staff/seasons/$id/edit`

#### Tab 1: Basic Information

Fields mapped to `seasonTable`.

```ascii
+-----------------------------------------------------------------------------+
| STAFF PANEL   |  # Edit Season: 2026                                        |
| ────────────  |                                                             |
| Overview      |  [ Basic Info ]  [ Documents ]  [ Announcements ]           |
|               |  ------------------------------------------------           |
| CONTENT       |                                                             |
| ────────────  |  * Season Year (Unique)                                     |
| Seasons (Active) |  [ 2026         ]  (Matches slug /2026)                    |
| Events        |                                                             |
| Registrations |  * Game Code                                                |
|               |  [ ITD-2026     ]  (Internal reference, e.g. FTC format)    |
| ADMINISTRATION|                                                             |
| ────────────  |  * Theme Title                                              |
| Users         |  [ Into the Deep                             ]              |
| Sync Logs     |                                                             |
| Settings      |  * Game Description                                         |
|               |  [ Explore the unknown depths and engineer...        ]      |
|               |  [                                                   ]      |
| ────────────  |                                                             |
| ← Back to     |  [x] Is Active Season (Shows on home page)                  |
|   Site        |                                                             |
|               |  ------------------------------------------------           |
|               |  [ Delete Season ]                 [ Save Changes ]         |
+---------------+-------------------------------------------------------------+
```

#### Tab 2: Documents

Fields mapped to `season_document` table. Used for Game Manuals, Q&A, etc.

```ascii
+-----------------------------------------------------------------------------+
| STAFF PANEL   |  # Season Documents: 2026                                   |
| ────────────  |                                                             |
| Overview      |  [ Basic Info ]  [ Documents ]  [ Announcements ]           |
|               |  ------------------------------------------------           |
| CONTENT       |  [ + Add New Document ]                                     |
| ────────────  |                                                             |
| Seasons (Active) |  +-----------------------------------------------------+ |
| Events        |  | Title          | Kind       | URL            | Actions | |
| Registrations |  +----------------+------------+----------------+---------+ |
|               |  | Game Manual 1  | PDF        | s3://...       | [E] [D] | |
| ADMINISTRATION|  | Field CAD      | ZIP        | https://...    | [E] [D] | |
| ────────────  |  | Q&A Forum      | Link       | https://...    | [E] [D] | |
| Users         |  +----------------+------------+----------------+---------+ |
| Sync Logs     |                                                             |
| Settings      |  * Sort order can be managed via drag-and-drop.             |
+---------------+-------------------------------------------------------------+
```

#### Tab 3: Announcements

Fields mapped to `season_announcement` table.

```ascii
+-----------------------------------------------------------------------------+
| STAFF PANEL   |  # Season Announcements: 2026                               |
| ────────────  |                                                             |
| Overview      |  [ Basic Info ]  [ Documents ]  [ Announcements ]           |
|               |  ------------------------------------------------           |
| CONTENT       |  [ + Create Announcement ]                                  |
| ────────────  |                                                             |
| Seasons (Active) |  +-----------------------------------------------------+ |
| Events        |  | Title                  | Published | Pinned | Actions  | |
| Registrations |  +------------------------+-----------+--------+----------+ |
|               |  | Registration Open!     | Oct 01    |  [x]   | [E] [D]  | |
| ADMINISTRATION|  | Rule Change #1         | Oct 15    |  [ ]   | [E] [D]  | |
| ────────────  |  +------------------------+-----------+--------+----------+ |
| Users         |                                                             |
| Sync Logs     |  * Announcements support Rich Text (Markdown) bodies.       |
| Settings      |                                                             |
+---------------+-------------------------------------------------------------+
```

## 4. Database Schema Mapping

The UI directly maps to the `packages/db/src/schema/event/index.ts` definition:

- **Season**: `year`, `gameCode`, `theme`, `description`, `isActive`.
- **Documents**: `season_document` table (Title, URL, Kind, SortOrder).
- **Announcements**: `season_announcement` table (Title, Body, IsPinned).

## 5. Summary of UI/UX Goals

1.  **Context Switching**: Users can easily traverse the history of the competition via the season switcher.
2.  **Consolidated Hub**: One-stop-shop for everything about a season (rules, news, and registration).
3.  **Staff Efficiency**: Simplified CRUD for organizers to manage multi-year competition data.
