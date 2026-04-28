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
|  +-----------------------------------------------------------------------------+  |
|  | Rank | Team Number & Name | RS | Match Pts | Base Pts | Auto Pts | W-L-T | Plays |  |
|  +-----------------------------------------------------------------------------+  |
|  |   1  | 24751 GreenAms     | 4.0|   146.0   |   13.0   |   45.4   | 5-0-0 |   5   |  |
|  |   2  | 33935 IronCorteX   | 3.4|   134.8   |   14.0   |   29.0   | 5-0-0 |   5   |  |
|  |   3  | 25209 FRITS        | 3.0|   118.4   |   17.0   |   35.6   | 4-1-0 |   5   |  |
|  |   4  | 32807 NMA-TC       | 3.0|   115.6   |   14.0   |   27.6   | 4-1-0 |   5   |  |
|  |   5  | 33947 FTHN.Omnitrix| 3.0|   101.0   |   17.0   |   14.6   | 4-1-0 |   5   |  |
|  +-----------------------------------------------------------------------------+  |
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
| Events (Active)|                                                             |
| Registrations |  (Red) 101 [ 120 ] vs [ 90 ] 404 (Blue)                      |
|               |                                                             |
| ADMINISTRATION|  [ Submit Result ] [ Edit Score ]                           |
| ────────────  |                                                             |
| Users         |  ## Recent Matches                                          |
| Sync Logs     |  - QM 41: 101 (45) - (60) 404  [ Edit ]                      |
| Settings      |  - QM 40: 102 (80) - (80) 405  [ Edit ]                      |
|               |                                                             |
| ────────────  |                                                             |
| ← Back to     |                                                             |
|   Site        |                                                             |
+---------------+-------------------------------------------------------------+
```
