# Event Playoffs Bracket UI Wireframe

Route: `/$season/$eventId/playoffs`

## 1. Normal User View

(Header only)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
|  # Hanoi Regional 2026                                                      |
|  [ Overview ] ... [ Qualifications ] [ Playoffs ] [ Rankings ] [ Awards]    |
|  -------------------------------------------------------------------------  |
|                                                                             |
|  ## Playoffs Bracket                                                        |
|                                                                             |
|  Semifinals                       Finals                        Winner      |
|                                                                             |
|  +------------+                                                             |
|  | Alliance 1 | [ 2 ] --+                                                   |
|  +------------+         |                                                   |
|                         |---+                                               |
|  +------------+         |   |    +------------+                             |
|  | Alliance 4 | [ 0 ] --+   |    | Alliance 1 | [ 2 ] --+                   |
|  +------------+             |    +------------+         |                   |
|                             |                           |                   |
|                             |                           |==== WINNER:       |
|                             |                           |     ALLIANCE 1    |
|  +------------+             |                           |                   |
|  | Alliance 2 | [ 1 ] --+   |    +------------+         |                   |
|  +------------+         |   |    | Alliance 3 | [ 0 ] --+                   |
|                         |---+    +------------+                             |
|  +------------+         |                                                   |
|  | Alliance 3 | [ 2 ] --+                                                   |
|  +------------+                                                             |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## 2. Staff View

Route: `/staff/events/$eventId/playoffs`
(Header + Sidebar)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
| STAFF PANEL   |                                                             |
| ────────────  |  # Manage Playoffs: Hanoi Regional 2026                     |
| Overview      |                                                             |
|               |  [ Generate Bracket ] [ Edit Alliances ] [ Match Entry ]    |
| CONTENT       |  -------------------------------------------------------    |
| ────────────  |                                                             |
| Seasons       |  ## Live Bracket Control                                    |
| Events (Active)|  Match #14: Alliance 1 vs Alliance 4                        |
| Registrations |  Status: [ IN PROGRESS ]                                    |
|               |  [ Enter Score ] [ Reset Match ] [ Declare Winner ]         |
| ADMINISTRATION|                                                             |
| ────────────  |  ## Alliance Selection                                      |
| Users         |  1. Team 101, 102, 103                                      |
| Sync Logs     |  2. Team 404, 405, 406                                      |
| Settings      |  ...                                                        |
|               |                                                             |
| ────────────  |                                                             |
| ← Back to     |                                                             |
|   Site        |                                                             |
+---------------+-------------------------------------------------------------+
```
