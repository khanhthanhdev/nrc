# Event Rankings UI Wireframe
Route: `/$season/$eventId/rankings`

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
|  ## Event Rankings                                                          |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | Rank | Team Number & Name | RP | W-L-T | Tie 1 | Tie 2 | Match Played |  |
|  +-----------------------------------------------------------------------+  |
|  |   1  | 101 Robox          | 12 | 6-0-0 |  450  |  120  |      6       |  |
|  |   2  | 404 Cyber          | 10 | 5-1-0 |  420  |  110  |      6       |  |
|  |   3  | 999 Mecha          |  8 | 4-2-0 |  380  |   90  |      6       |  |
|  |   4  |  42 ByteBuilders   |  6 | 3-3-0 |  300  |   80  |      6       |  |
|  |   5  | 202 AutoBots       |  4 | 2-4-0 |  250  |   50  |      6       |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  [1] [2] [3] Next >                                                         |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## 2. Staff View (Match Entry)
Route: `/staff/events/$eventId/matches`
(Header + Sidebar)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
| STAFF PANEL   |                                                             |
| ────────────  |  # Match Scoring: Hanoi Regional 2026                       |
| Overview      |                                                             |
|               |  [ Qual Matches ] [ Playoff Matches ] [ Rankings ]          |
| CONTENT       |  ----------------------------------------------------       |
| ────────────  |                                                             |
| Seasons       |  ## Qual Match #42                                          |
| Events (Active)|  Red: 101, 102 vs Blue: 404, 405                            |
| Registrations |                                                             |
|               |  Red Score: [ 120 ]   Blue Score: [ 90 ]                    |
| ADMINISTRATION|  [ Submit Result ] [ Edit Score ]                           |
| ────────────  |                                                             |
| Users         |  ## Recent Matches                                          |
| Sync Logs     |  - QM 41: Red 45, Blue 60  [ Edit ]                         |
| Settings      |  - QM 40: Red 80, Blue 80  [ Edit ]                         |
|               |                                                             |
| ────────────  |                                                             |
| ← Back to     |                                                             |
|   Site        |                                                             |
+---------------+-------------------------------------------------------------+
```

