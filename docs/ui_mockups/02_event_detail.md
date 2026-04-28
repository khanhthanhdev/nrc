# Event Detail UI Wireframe

Route: `/$season/$eventId`

The event detail page is the central hub for a specific competition, designed to provide real-time updates and clear information for participants and spectators.

## 1. Public View Layout

```ascii
+-----------------------------------------------------------------------------+
| [Header: Logo | Search | Events | Teams | Seasons |           User Profile] |
+-----------------------------------------------------------------------------+
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  |                                                                       |  |
|  |                        [ Event Hero Banner ]                          |  |
|  |                                                                       |  |
|  |   # Hanoi Regional 2026                                               |  |
|  |   [Icon] Oct 10-12, 2026 | [Icon] Hanoi Innovation Hub                |  |
|  |   Status: [ LIVE ]                                                    |  |
|  |                                                                       |  |
|  |   [ Watch Stream ]  [ Register Team ]  [ Follow Event ]               |  |
|  |                                                                       |  |
|  +-----------------------------------------------------------------------+  |
|  | [ Overview ] [ Schedule ] [ Results ] [ Rankings ] [ Teams ] [ Awards ] |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  +---------------------------+   +---------------------------------------+  |
|  | ## About Event            |   | ## Live Match / Latest Result         |  |
|  | Welcome to the Hanoi...    |   | +-----------------------------------+ |  |
|  |                           |   | | Q#15: Blue [ 120 ] vs Red [ 45 ]  | |  |
|  | ### Key Dates             |   | | [ View Match Details ]            | |  |
|  | - Check-in: 8:00 AM       |   | +-----------------------------------+ |  |
|  | - Opening: 9:00 AM        |   |                                       |  |
|  |                           |   | ## Upcoming Matches                   |  |
|  | ### Venue Info            |   | +-----------------------------------+ |  |
|  | [ Map Thumbnail ]         |   | | Q#16: Team A, B vs Team C, D      | |  |
|  | Hanoi Innovation Hub...   |   | | Scheduled: 10:30 AM               | |  |
|  +---------------------------+   +-----------------------------------+ |  |
|                                  +---------------------------------------+  |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## 2. Tab Content Wireframes

### 2.1 Overview

- Event description, rules links, venue information, and sponsor logos.

### 2.2 Schedule

- Vertical timeline of event phases (Registration, Inspection, Qualifying, Playoffs, Awards).
- Toggle between "Planned" and "Actual".

### 2.3 Results (Qualifications/Playoffs)

- Searchable list of all matches.
- Filter by Team, Match Type, or Field.

### 2.4 Rankings

- Live leaderboard with:
  - Rank, Team Number, Team Name, W-L-T, RP (Ranking Points), Score.

### 2.5 Teams (Participants)

- Grid of team cards participating in this event.
- Includes status (Checked-in, Pending Inspection, etc.).

### 2.6 Awards

- List of awards given at the end of the event with winning teams.

## 3. Management View (Staff)

Route: `/staff/events/$eventId`

- **Control Center**: Manage match status (Start/Stop), Inspection status.
- **Sync**: Push results to web, Pull team registrations.
- **Communications**: Send announcements to all participating team mentors.
